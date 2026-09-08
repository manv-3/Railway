import math
from ortools.sat.python import cp_model
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class CPSATBlockOptimizer:
    def __init__(self, time_horizon_minutes: int = 1440): # 24-hour horizon default
        self.horizon = time_horizon_minutes
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    def solve(
        self,
        requests: List[Dict[str, Any]],
        trains: List[Dict[str, Any]],
        machine_limits: Dict[str, int] = None,
        max_time_seconds: float = 30.0
    ) -> Dict[str, Any]:
        """
        Solves multi-department block planning with constraint programming.
        Enforces directional track exclusive occupation, machinery limits,
        train precedence avoidance, and bundles multi-department overlapping works.
        """
        # Optimizer instances are reusable.  A CP-SAT model is not: retaining a
        # previous model silently carries old variables and constraints into a
        # new run, which makes repeat optimizations invalid.
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        request_ids = [str(request["request_id"]) for request in requests]
        if len(request_ids) != len(set(request_ids)):
            raise ValueError("Each maintenance request must have a unique request_id.")

        for request in requests:
            duration = int(request.get("estimated_duration_minutes", 60))
            if duration <= 0 or duration > self.horizon:
                raise ValueError(
                    f"Request {request['request_id']} has an invalid duration for the planning horizon."
                )
            if float(request.get("from_km", 0)) > float(request.get("to_km", 0)):
                raise ValueError(f"Request {request['request_id']} has from_km greater than to_km.")

        if not requests:
            return {
                "status": "SUCCESS", "solver_status": "OPTIMAL", "scheduled_requests": 0,
                "total_input_requests": 0, "total_blocks_created": 0,
                "combined_super_blocks": 0, "separate_maintenance_hours": 0.0,
                "optimized_block_hours": 0.0, "time_saved_hours": 0.0,
                "asset_availability_gain_percent": 0.0, "wall_time_seconds": 0.0,
                "blocks": []
            }

        if machine_limits is None:
            machine_limits = {
                "TAMPING_MACHINE": 2,
                "TOWER_WAGON": 2,
                "BALLAST_CLEANER": 1
            }

        starts = {}
        ends = {}
        presences = {}
        intervals = {}

        # 1. Variable Construction
        for req in requests:
            rid = str(req["request_id"])
            dur = max(15, int(req.get("estimated_duration_minutes", 60)))
            is_emergency = req.get("severity") == "EMERGENCY"

            presences[rid] = self.model.NewBoolVar(f"presence_{rid}")
            if is_emergency:
                # Emergency works MUST be scheduled
                self.model.Add(presences[rid] == 1)

            starts[rid] = self.model.NewIntVar(0, self.horizon - dur, f"start_{rid}")
            ends[rid] = self.model.NewIntVar(0, self.horizon, f"end_{rid}")
            intervals[rid] = self.model.NewOptionalIntervalVar(
                starts[rid], dur, ends[rid], presences[rid], f"interval_{rid}"
            )

        # 2. Directional-track safety.  Work may share a possession only when
        # it is from different departments *and* covers an overlapping km span.
        # The previous implementation gave any two departments on a long
        # section a bundling reward, even hundreds of kilometres apart.
        for i, r1 in enumerate(requests):
            for r2 in requests[i + 1:]:
                same_section = r1["section_id"] == r2["section_id"]
                spans_overlap = (
                    max(float(r1.get("from_km", 0)), float(r2.get("from_km", 0)))
                    < min(float(r1.get("to_km", 0)), float(r2.get("to_km", 0)))
                )
                can_share_possession = (
                    same_section and spans_overlap and r1["department"] != r2["department"]
                )
                if same_section and not can_share_possession:
                    self.model.AddNoOverlap([
                        intervals[str(r1["request_id"])], intervals[str(r2["request_id"])]
                    ])

        # 3. Machine Capacity (AddCumulative)
        for m_type, cap in machine_limits.items():
            mach_intervals = [
                intervals[str(r["request_id"])] for r in requests
                if r.get("required_machine_type") == m_type
            ]
            demands = [1 for _ in mach_intervals]
            if mach_intervals:
                self.model.AddCumulative(mach_intervals, demands, cap)

        # 4. Train Conflict Penalties & Precedence Constraints
        train_conflict_vars = []
        for tr in trains:
            t_entry = int(tr.get("entry_minute", 0))
            t_exit = int(tr.get("exit_minute", 60))
            t_sec = tr.get("section_id")
            t_prio = int(tr.get("priority_precedence", 2)) # 1 = Vande Bharat/Rajdhani

            for r in requests:
                if r["section_id"] == t_sec:
                    rid = str(r["request_id"])
                    conflict = self.model.NewBoolVar(f"conflict_{rid}_{tr.get('train_number', 'TR')}")

                    # conflict = True if start < t_exit and end > t_entry
                    overlap_left = self.model.NewBoolVar(f"ol_{rid}_{tr.get('train_number', 'TR')}")
                    overlap_right = self.model.NewBoolVar(f"or_{rid}_{tr.get('train_number', 'TR')}")

                    self.model.Add(starts[rid] < t_exit).OnlyEnforceIf(overlap_left)
                    self.model.Add(starts[rid] >= t_exit).OnlyEnforceIf(overlap_left.Not())
                    self.model.Add(ends[rid] > t_entry).OnlyEnforceIf(overlap_right)
                    self.model.Add(ends[rid] <= t_entry).OnlyEnforceIf(overlap_right.Not())

                    self.model.AddBoolAnd([overlap_left, overlap_right, presences[rid]]).OnlyEnforceIf(conflict)
                    self.model.AddBoolOr([overlap_left.Not(), overlap_right.Not(), presences[rid].Not()]).OnlyEnforceIf(conflict.Not())

                    # High priority (Vande Bharat / Rajdhani) strictly forbids overlap
                    if t_prio == 1:
                        self.model.Add(conflict == 0)
                    else:
                        train_conflict_vars.append(conflict * (300 // max(1, t_prio)))

        # 5. Bundling Incentive (Reward multi-department overlap on same section)
        bundle_bonuses = []
        for i, r1 in enumerate(requests):
            for j, r2 in enumerate(requests[i+1:], start=i+1):
                spans_overlap = (
                    max(float(r1.get("from_km", 0)), float(r2.get("from_km", 0)))
                    < min(float(r1.get("to_km", 0)), float(r2.get("to_km", 0)))
                )
                if (
                    r1["section_id"] == r2["section_id"]
                    and r1["department"] != r2["department"]
                    and spans_overlap
                ):
                    id1, id2 = str(r1["request_id"]), str(r2["request_id"])
                    overlap_bool = self.model.NewBoolVar(f"bundle_{id1}_{id2}")

                    b1 = self.model.NewBoolVar(f"b1_{id1}_{id2}")
                    b2 = self.model.NewBoolVar(f"b2_{id1}_{id2}")
                    self.model.Add(starts[id1] < ends[id2]).OnlyEnforceIf(b1)
                    self.model.Add(starts[id1] >= ends[id2]).OnlyEnforceIf(b1.Not())
                    self.model.Add(ends[id1] > starts[id2]).OnlyEnforceIf(b2)
                    self.model.Add(ends[id1] <= starts[id2]).OnlyEnforceIf(b2.Not())

                    self.model.AddBoolAnd([b1, b2, presences[id1], presences[id2]]).OnlyEnforceIf(overlap_bool)
                    self.model.AddBoolOr([b1.Not(), b2.Not(), presences[id1].Not(), presences[id2].Not()]).OnlyEnforceIf(overlap_bool.Not())
                    bundle_bonuses.append(overlap_bool * 500)

        # 6. Objective Function Definition
        scheduled_priority_gains = sum(
            presences[str(r["request_id"])] * int(float(r.get("priority_score", 50.0)) * 10)
            for r in requests
        )
        bundle_incentives = sum(bundle_bonuses)
        train_penalties = sum(train_conflict_vars)
        duration_penalties = sum(
            presences[str(r["request_id"])] * (int(r.get("estimated_duration_minutes", 60)) // 2)
            for r in requests
        )

        self.model.Maximize(
            scheduled_priority_gains + bundle_incentives - train_penalties - duration_penalties
        )

        # 7. Execution Parameters
        self.solver.parameters.max_time_in_seconds = max_time_seconds
        self.solver.parameters.num_workers = 4
        status = self.solver.Solve(self.model)

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            raw_scheduled = []
            for r in requests:
                rid = str(r["request_id"])
                if self.solver.Value(presences[rid]) == 1:
                    s = self.solver.Value(starts[rid])
                    e = self.solver.Value(ends[rid])
                    raw_scheduled.append({
                        "request_id": rid,
                        "department": r["department"],
                        "section_id": r["section_id"],
                        "asset_type": r.get("asset_type", "TRACK"),
                        "defect_type": r.get("defect_type", "GENERAL"),
                        "from_km": r.get("from_km"),
                        "to_km": r.get("to_km"),
                        "required_machine_type": r.get("required_machine_type"),
                        "start_minute": s,
                        "end_minute": e,
                        "duration_minutes": e - s,
                        "priority_score": float(r.get("priority_score", 50.0))
                    })

            # Post-Process: Group overlapping intervals into Combined Super-Blocks
            grouped_blocks = self._group_into_super_blocks(raw_scheduled, trains)

            separate_duration = sum(r["duration_minutes"] for r in raw_scheduled)
            combined_duration = sum(b["total_duration_minutes"] for b in grouped_blocks)
            time_saved_hours = max(0.0, (separate_duration - combined_duration) / 60.0)
            availability_gain = (
                ((separate_duration - combined_duration) / max(1, separate_duration) * 100.0)
                if separate_duration > 0 else 0.0
            )

            return {
                "status": "SUCCESS",
                "solver_status": "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE",
                "scheduled_requests": len(raw_scheduled),
                "total_input_requests": len(requests),
                "total_blocks_created": len(grouped_blocks),
                "combined_super_blocks": sum(1 for b in grouped_blocks if b["is_combined"]),
                "separate_maintenance_hours": round(separate_duration / 60.0, 2),
                "optimized_block_hours": round(combined_duration / 60.0, 2),
                "time_saved_hours": round(time_saved_hours, 2),
                "asset_availability_gain_percent": round(availability_gain, 1),
                "wall_time_seconds": round(self.solver.WallTime(), 3),
                "blocks": grouped_blocks
            }

        return {
            "status": "INFEASIBLE",
            "reason": "Constraints could not be satisfied within time limit",
            "wall_time_seconds": round(self.solver.WallTime(), 3),
            "blocks": []
        }

    def _compute_abs_track_circuits(self, from_km: float, to_km: float, direction: str = "UP") -> List[str]:
        """Discretize physical rail kilometer range into 1.0 km ABS track circuits (V5-05)."""
        start_k = max(0, int(math.floor(from_km)))
        end_k = max(start_k + 1, int(math.ceil(to_km)))
        return [f"TC_{k:03d}_{direction}" for k in range(start_k, end_k)]

    def _compute_signal_aspect_envelope(self, from_km: float, direction: str = "UP") -> List[Dict[str, Any]]:
        """
        Compute statutory 4-aspect signal protection envelope preceding the maintenance block.
        Under Indian Railways G&SR Rule 9.02 (Automatic Block Signalling):
        - Block boundary: RED (Danger - Stop)
        - 1 km in advance: YELLOW (Caution - Proceed with caution, prepare to stop at next stop signal)
        - 2 km in advance: DOUBLE_YELLOW (Attention - Proceed with restricted speed)
        - 3+ km in advance: GREEN (Clear)
        """
        start_k = max(0, int(math.floor(from_km)))
        envelope = []
        if start_k >= 2:
            envelope.append({"km": start_k - 2, "aspect": "DOUBLE_YELLOW", "distance_to_block_m": 2000, "rule": "G&SR 9.02 Attention"})
        if start_k >= 1:
            envelope.append({"km": start_k - 1, "aspect": "YELLOW", "distance_to_block_m": 1000, "rule": "G&SR 9.02 Caution"})
        envelope.append({"km": start_k, "aspect": "RED", "distance_to_block_m": 0, "rule": "G&SR 9.02 Danger Possession Stop"})
        return envelope

    def _evaluate_turnout_crossover_routes(
        self,
        block_section: str,
        start_km: float,
        end_km: float,
        trains: List[Dict[str, Any]],
        block_start_min: int,
        block_end_min: int
    ) -> List[Dict[str, Any]]:
        """
        Calculates dynamic turnout diversion for trains conflicting with maintenance blocks (V5-06).
        Under Indian Railways interlocking rules:
        If UP Fast line is isolated at KM 44-46:
        1. Approaching trains divert via crossover switch at nearest interlocked station/junction.
        2. Trains utilize parallel UP Slow / Common Loop line at restricted turnout speed (30 km/h).
        3. Trains rejoin primary line via trailing crossover after block clear point.
        4. Incurs turnout negotiation penalty of ~3.5 min, avoiding full section closure.
        """
        rerouted = []
        direction = "UP" if "UP" in block_section else "DOWN"
        parallel_line = f"{direction}_SLOW"

        for tr in trains:
            if tr.get("section_id") == block_section:
                t_arr = int(tr.get("entry_minute", 0))
                t_dep = int(tr.get("exit_minute", 60))
                if max(block_start_min, t_arr) < min(block_end_min, t_dep):
                    crossover_km = max(0.0, math.floor(start_km) - 2.0)
                    rejoin_km = math.ceil(end_km) + 2.0
                    rerouted.append({
                        "train_number": tr.get("train_number", "TR_UNKNOWN"),
                        "train_name": tr.get("train_name", "Express"),
                        "diverted_line": parallel_line,
                        "crossover_switch_km": crossover_km,
                        "rejoin_switch_km": rejoin_km,
                        "turnout_transit_speed_kmh": 30,
                        "turnout_transit_penalty_minutes": 3.5,
                        "detention_prevented_minutes": max(0, block_end_min - t_arr),
                        "status": "DIVERTED_VIA_CROSSOVER_TURNOUT"
                    })
        return rerouted

    def _group_into_super_blocks(
        self,
        scheduled_tasks: List[Dict[str, Any]],
        trains: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Merges co-located overlapping tasks on the same section into Combined Super-Blocks
        and computes ABS track circuits, signal envelopes, and turnout routing.
        """
        grouped = []
        processed = set()

        for i, task1 in enumerate(scheduled_tasks):
            if i in processed:
                continue

            current_group = [task1]
            sec = task1["section_id"]
            start = task1["start_minute"]
            end = task1["end_minute"]

            for j, task2 in enumerate(scheduled_tasks[i+1:], start=i+1):
                if j in processed:
                    continue

                spans_overlap = (
                    max(float(task1.get("from_km", 0)), float(task2.get("from_km", 0)))
                    < min(float(task1.get("to_km", 0)), float(task2.get("to_km", 0)))
                )
                if task2["section_id"] == sec and spans_overlap:
                    # Check overlap
                    if max(start, task2["start_minute"]) < min(end, task2["end_minute"]):
                        current_group.append(task2)
                        processed.add(j)
                        start = min(start, task2["start_minute"])
                        end = max(end, task2["end_minute"])

            processed.add(i)
            depts = list(set(t["department"] for t in current_group))
            is_combined = len(current_group) > 1

            from_km_val = min(float(t.get("from_km", 0.0) or 0.0) for t in current_group)
            to_km_val = max(float(t.get("to_km", 0.0) or 0.0) for t in current_group)
            dir_str = "UP" if "UP" in sec else "DOWN"

            circuits = self._compute_abs_track_circuits(from_km_val, to_km_val, dir_str)
            aspects = self._compute_signal_aspect_envelope(from_km_val, dir_str)
            turnouts = self._evaluate_turnout_crossover_routes(sec, from_km_val, to_km_val, trains or [], start, end)

            grouped.append({
                "block_id": f"BLK_OPT_{len(grouped)+1:03d}",
                "section_id": sec,
                "start_minute": start,
                "end_minute": end,
                "total_duration_minutes": end - start,
                "from_km": from_km_val,
                "to_km": to_km_val,
                "is_combined": is_combined,
                "block_type": "COMBINED_SUPER_BLOCK" if is_combined else "SINGLE_DEPARTMENT",
                "departments": depts,
                "task_count": len(current_group),
                "isolated_track_circuits": circuits,
                "signal_aspect_envelopes": aspects,
                "crossover_turnout_routes": turnouts,
                "maintenance_tasks": current_group
            })

        return grouped
