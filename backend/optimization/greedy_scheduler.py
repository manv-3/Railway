from typing import List, Dict, Any

class GreedyBlockScheduler:
    """
    Baseline sequential scheduler:
    Sorts maintenance requests strictly by priority and schedules them
    sequentially without intelligent multi-department bundling.
    Serves as the benchmark comparator against CP-SAT.
    """
    def __init__(self, time_horizon_minutes: int = 1440):
        self.horizon = time_horizon_minutes

    def schedule(self, requests: List[Dict[str, Any]], trains: List[Dict[str, Any]]) -> Dict[str, Any]:
        sorted_requests = sorted(
            requests,
            key=lambda r: float(r.get("priority_score", 50.0)),
            reverse=True
        )

        section_occupied_until = {}
        scheduled_blocks = []
        total_separate_duration = sum(int(r.get("estimated_duration_minutes", 60)) for r in requests)

        for req in sorted_requests:
            sec = req["section_id"]
            dur = int(req.get("estimated_duration_minutes", 60))
            earliest_start = section_occupied_until.get(sec, 60) # Start from minute 60

            # Check conflicts with trains (simple buffer)
            start_time = earliest_start
            while start_time + dur <= self.horizon:
                has_train_conflict = False
                for tr in trains:
                    if tr["section_id"] == sec:
                        if not (start_time + dur + 15 <= tr["entry_minute"] or tr["exit_minute"] + 15 <= start_time):
                            has_train_conflict = True
                            start_time = tr["exit_minute"] + 15
                            break
                if not has_train_conflict:
                    break

            if start_time + dur <= self.horizon:
                section_occupied_until[sec] = start_time + dur
                scheduled_blocks.append({
                    "request_id": req["request_id"],
                    "section_id": sec,
                    "department": req["department"],
                    "start_minute": start_time,
                    "end_minute": start_time + dur,
                    "duration_minutes": dur,
                    "is_combined": False,
                    "priority_score": req.get("priority_score", 50.0)
                })

        scheduled_duration = sum(b["duration_minutes"] for b in scheduled_blocks)

        return {
            "status": "SUCCESS",
            "algorithm": "GREEDY_SEQUENTIAL",
            "scheduled_requests": len(scheduled_blocks),
            "total_blocks_created": len(scheduled_blocks),
            "combined_blocks": 0,
            "total_duration_hours": round(scheduled_duration / 60.0, 2),
            "time_saved_hours": 0.0,
            "asset_availability_gain_percent": 0.0,
            "scheduled_blocks": scheduled_blocks
        }
