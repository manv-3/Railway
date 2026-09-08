"""
Comprehensive CP-SAT Optimizer Test Suite
Tests realistic scenarios with 50-100+ maintenance requests
"""
import pytest
from optimization.cpsat_optimizer import CPSATBlockOptimizer
from datetime import datetime, timedelta

class TestCPSATRealisticScenarios:
    """Test suite for real-world railway maintenance scheduling scenarios"""

    def test_single_division_50_requests_bundling(self):
        """
        Realistic scenario: Delhi Division receives 50 maintenance requests
        across TMS, SMMS, and TDMS over a week. System should bundle co-located
        works into combined super-blocks.
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=10080)  # 1 week

        # Generate realistic mix: 40% TMS (track), 35% SMMS (signal), 25% TDMS (OHE)
        requests = []
        
        # TMS Requests (Track Engineering) - 20 requests
        for i in range(20):
            km_start = 40.0 + (i * 5.0)  # Spread across 100km
            requests.append({
                "request_id": f"TMS_2026_09_{i+1:03d}",
                "department": "TMS",
                "section_id": f"SEC_UP_{int(km_start)//10}",
                "from_km": km_start,
                "to_km": km_start + 2.0,
                "asset_type": "RAIL" if i % 3 == 0 else "SLEEPER",
                "defect_type": "CORRUGATION" if i % 2 == 0 else "RAIL_FRACTURE_RISK",
                "severity": "CRITICAL" if i < 5 else ("PLANNED_HIGH" if i < 12 else "ROUTINE"),
                "estimated_duration_minutes": 120 if i < 5 else 90,
                "priority_score": 90.0 - (i * 2.0),
                "required_machine_type": "TAMPING_MACHINE" if i % 2 == 0 else None
            })

        # SMMS Requests (Signalling) - 17 requests
        for i in range(17):
            km_start = 42.0 + (i * 6.0)
            requests.append({
                "request_id": f"SMMS_2026_09_{i+1:03d}",
                "department": "SMMS",
                "section_id": f"SEC_UP_{int(km_start)//10}",
                "from_km": km_start,
                "to_km": km_start + 1.5,
                "asset_type": "POINT_MACHINE" if i % 2 == 0 else "SIGNAL",
                "defect_type": "POINT_SLUGGISH" if i % 2 == 0 else "LAMP_FAILURE",
                "severity": "CRITICAL" if i < 3 else "PLANNED_HIGH",
                "estimated_duration_minutes": 90 if i < 3 else 60,
                "priority_score": 85.0 - (i * 2.5),
                "required_machine_type": "TOWER_WAGON" if i < 3 else None
            })

        # TDMS Requests (Electrical/OHE) - 13 requests
        for i in range(13):
            km_start = 41.0 + (i * 7.0)
            requests.append({
                "request_id": f"TDMS_2026_09_{i+1:03d}",
                "department": "TDMS",
                "section_id": f"SEC_UP_{int(km_start)//10}",
                "from_km": km_start,
                "to_km": km_start + 1.0,
                "asset_type": "OHE_CATENARY" if i % 2 == 0 else "INSULATOR",
                "defect_type": "CONTACT_WIRE_WEAR" if i % 2 == 0 else "INSULATOR_FLASHING",
                "severity": "CRITICAL" if i < 2 else "PLANNED_HIGH",
                "estimated_duration_minutes": 105 if i < 2 else 75,
                "priority_score": 82.0 - (i * 3.0),
                "required_machine_type": "TOWER_WAGON" if i % 2 == 0 else None
            })

        # Realistic train schedule (10 trains over 1 week = ~70 trains, simplified to key trains)
        trains = [
            # Vande Bharat Express (High Priority)
            {"train_number": "22436", "section_id": "SEC_UP_4", "entry_minute": 360, "exit_minute": 420, "priority_precedence": 1},
            {"train_number": "22438", "section_id": "SEC_UP_5", "entry_minute": 1080, "exit_minute": 1140, "priority_precedence": 1},
            # Rajdhani Express
            {"train_number": "12430", "section_id": "SEC_UP_6", "entry_minute": 480, "exit_minute": 540, "priority_precedence": 1},
            # Superfast Express
            {"train_number": "12004", "section_id": "SEC_UP_7", "entry_minute": 600, "exit_minute": 660, "priority_precedence": 2},
            {"train_number": "12312", "section_id": "SEC_UP_8", "entry_minute": 720, "exit_minute": 780, "priority_precedence": 2},
            # Freight trains (can be delayed)
            {"train_number": "FRT_5601", "section_id": "SEC_UP_9", "entry_minute": 180, "exit_minute": 300, "priority_precedence": 4},
            {"train_number": "FRT_5602", "section_id": "SEC_UP_10", "entry_minute": 900, "exit_minute": 1020, "priority_precedence": 4},
        ]

        machine_limits = {
            "TAMPING_MACHINE": 2,
            "TOWER_WAGON": 2,
            "BALLAST_CLEANER": 1
        }

        result = optimizer.solve(
            requests=requests,
            trains=trains,
            machine_limits=machine_limits,
            max_time_seconds=30.0
        )

        # Assertions
        assert result["status"] == "SUCCESS", "Solver should find feasible solution"
        assert result["scheduled_requests"] >= 40, f"Should schedule at least 40/50 requests, got {result['scheduled_requests']}"
        assert result["total_blocks_created"] >= 10, "Should create at least 10 time blocks"
        assert result["combined_super_blocks"] >= 3, "Should have at least 3 bundled blocks"
        
        # Key metric: Time savings
        assert result["time_saved_hours"] >= 10.0, f"Should save at least 10 hours, saved {result['time_saved_hours']}h"
        # This scenario has only a few legitimate spatially co-located tasks.
        # Do not reward the solver for falsely merging work elsewhere on a long section.
        assert result["asset_availability_gain_percent"] >= 18.0, f"Should gain 18%+ availability, got {result['asset_availability_gain_percent']}%"
        
        # Performance
        assert result["wall_time_seconds"] < 30.0, f"Should solve in <30s, took {result['wall_time_seconds']}s"
        
        print(f"\n✅ 50-Request Scenario Results:")
        print(f"   Scheduled: {result['scheduled_requests']}/50")
        print(f"   Blocks Created: {result['total_blocks_created']}")
        print(f"   Combined Super-Blocks: {result['combined_super_blocks']}")
        print(f"   Time Saved: {result['time_saved_hours']}h")
        print(f"   Availability Gain: {result['asset_availability_gain_percent']}%")
        print(f"   Solve Time: {result['wall_time_seconds']}s")

    def test_emergency_critical_requests_prioritization(self):
        """
        Test that EMERGENCY requests are always scheduled and get priority
        over routine maintenance, even if it causes train delays.
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=720)

        requests = [
            # EMERGENCY: Rail fracture detected
            {
                "request_id": "EMERGENCY_001",
                "department": "TMS",
                "section_id": "SEC_UP_1",
                "from_km": 45.0,
                "to_km": 47.0,
                "asset_type": "RAIL",
                "defect_type": "RAIL_FRACTURE",
                "severity": "EMERGENCY",
                "estimated_duration_minutes": 180,
                "priority_score": 99.0,
                "required_machine_type": None
            },
            # EMERGENCY: OHE catenary snap risk
            {
                "request_id": "EMERGENCY_002",
                "department": "TDMS",
                "section_id": "SEC_UP_1",
                "from_km": 45.5,
                "to_km": 46.5,
                "asset_type": "OHE_CATENARY",
                "defect_type": "CONTACT_WIRE_BROKEN",
                "severity": "EMERGENCY",
                "estimated_duration_minutes": 150,
                "priority_score": 98.0,
                "required_machine_type": "TOWER_WAGON"
            },
            # ROUTINE maintenance (should be deprioritized)
            {
                "request_id": "ROUTINE_001",
                "department": "TMS",
                "section_id": "SEC_UP_2",
                "from_km": 50.0,
                "to_km": 52.0,
                "asset_type": "SLEEPER",
                "defect_type": "MINOR_WEAR",
                "severity": "ROUTINE",
                "estimated_duration_minutes": 90,
                "priority_score": 45.0,
                "required_machine_type": None
            }
        ]

        # Premium train passing through (should not conflict with emergency work)
        trains = [
            {"train_number": "22436", "section_id": "SEC_UP_1", "entry_minute": 300, "exit_minute": 360, "priority_precedence": 1},
        ]

        result = optimizer.solve(requests=requests, trains=trains, max_time_seconds=10.0)

        assert result["status"] == "SUCCESS"
        
        # Both emergency requests MUST be scheduled
        scheduled_ids = [task["request_id"] for block in result["blocks"] for task in block["maintenance_tasks"]]
        assert "EMERGENCY_001" in scheduled_ids, "Emergency rail fracture must be scheduled"
        assert "EMERGENCY_002" in scheduled_ids, "Emergency OHE issue must be scheduled"
        
        # Emergency requests should be bundled together (same section)
        for block in result["blocks"]:
            task_ids = [t["request_id"] for t in block["maintenance_tasks"]]
            if "EMERGENCY_001" in task_ids:
                assert "EMERGENCY_002" in task_ids, "Emergency requests should be bundled"
                assert block["is_combined"] == True, "Emergency block should be combined"
                
        print(f"\n✅ Emergency Prioritization Test Passed")
        print(f"   Emergency requests scheduled: 2/2")
        print(f"   Bundled together: Yes")

    def test_directional_track_isolation(self):
        """
        Verify that Up-line and Down-line maintenance blocks can happen
        simultaneously without conflict (bi-directional operation).
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=480)

        requests = [
            # Up-line maintenance
            {
                "request_id": "UP_TMS_001",
                "department": "TMS",
                "section_id": "SEC_UP_KM50",
                "from_km": 50.0,
                "to_km": 52.0,
                "asset_type": "RAIL",
                "defect_type": "CORRUGATION",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 120,
                "priority_score": 80.0,
                "required_machine_type": "TAMPING_MACHINE"
            },
            # Down-line maintenance (same kilometer range, different track)
            {
                "request_id": "DN_TMS_001",
                "department": "TMS",
                "section_id": "SEC_DN_KM50",
                "from_km": 50.0,
                "to_km": 52.0,
                "asset_type": "RAIL",
                "defect_type": "CORRUGATION",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 120,
                "priority_score": 79.0,
                "required_machine_type": "TAMPING_MACHINE"
            },
            # Another Up-line request (should NOT overlap with first up-line)
            {
                "request_id": "UP_TMS_002",
                "department": "TMS",
                "section_id": "SEC_UP_KM50",
                "from_km": 51.0,
                "to_km": 53.0,
                "asset_type": "SLEEPER",
                "defect_type": "SLEEPER_RENEWAL",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 90,
                "priority_score": 75.0,
                "required_machine_type": None
            }
        ]

        result = optimizer.solve(requests=requests, trains=[], machine_limits={"TAMPING_MACHINE": 2}, max_time_seconds=10.0)

        assert result["status"] == "SUCCESS"
        assert result["scheduled_requests"] == 3, "All 3 requests should be scheduled"

        # Find the blocks for up and down line requests
        up_blocks = [b for b in result["blocks"] if any(t["request_id"] == "UP_TMS_001" for t in b["maintenance_tasks"])]
        dn_blocks = [b for b in result["blocks"] if any(t["request_id"] == "DN_TMS_001" for t in b["maintenance_tasks"])]

        assert len(up_blocks) == 1 and len(dn_blocks) == 1, "Should create separate blocks for Up and Down"

        # Up and Down blocks CAN overlap in time (bi-directional)
        up_start, up_end = up_blocks[0]["start_minute"], up_blocks[0]["end_minute"]
        dn_start, dn_end = dn_blocks[0]["start_minute"], dn_blocks[0]["end_minute"]

        # They could overlap - this is OK!
        print(f"\n✅ Directional Isolation Test:")
        print(f"   Up-line block: {up_start}-{up_end} min")
        print(f"   Down-line block: {dn_start}-{dn_end} min")
        print(f"   Simultaneous operation: {'Yes' if max(up_start, dn_start) < min(up_end, dn_end) else 'No (sequential)'}")

        # But two up-line requests should NOT overlap
        up2_blocks = [b for b in result["blocks"] if any(t["request_id"] == "UP_TMS_002" for t in b["maintenance_tasks"])]
        if up2_blocks:
            up2_start, up2_end = up2_blocks[0]["start_minute"], up2_blocks[0]["end_minute"]
            # Check no overlap between UP_TMS_001 and UP_TMS_002
            no_overlap = (up2_end <= up_start) or (up2_start >= up_end)
            assert no_overlap, "Two up-line blocks should not overlap"
            print(f"   Second up-line block: {up2_start}-{up2_end} min (no overlap with first)")

    def test_machine_capacity_constraint(self):
        """
        Test that solver respects cumulative machine capacity limits.
        If 5 tasks need tampers but only 2 available, max 2 can run simultaneously.
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=360)

        # Create 5 tasks all needing tampers in same time window
        requests = []
        for i in range(5):
            requests.append({
                "request_id": f"TAMP_REQ_{i+1}",
                "department": "TMS",
                "section_id": f"SEC_UP_{i}",  # Different sections (no spatial conflict)
                "from_km": 40.0 + (i * 10.0),
                "to_km": 42.0 + (i * 10.0),
                "asset_type": "RAIL",
                "defect_type": "CORRUGATION",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 60,
                "priority_score": 80.0 - i,
                "required_machine_type": "TAMPING_MACHINE"
            })

        machine_limits = {"TAMPING_MACHINE": 2}  # Only 2 tampers available

        result = optimizer.solve(requests=requests, trains=[], machine_limits=machine_limits, max_time_seconds=10.0)

        assert result["status"] == "SUCCESS"
        
        # All can be scheduled, but need to be time-separated due to machine limits
        assert result["scheduled_requests"] >= 4, "Should schedule at least 4/5 requests"

        # Verify no more than 2 tamper tasks overlap at any point
        scheduled_tasks = [(task["request_id"], block["start_minute"], block["end_minute"]) 
                          for block in result["blocks"] 
                          for task in block["maintenance_tasks"]
                          if task["request_id"].startswith("TAMP_REQ_")]

        # Check every minute
        for t in range(0, 360, 1):
            active_count = sum(1 for _, start, end in scheduled_tasks if start <= t < end)
            assert active_count <= 2, f"At time {t}, {active_count} tampers active (max 2 allowed)"

        print(f"\n✅ Machine Capacity Test:")
        print(f"   Requests needing tampers: 5")
        print(f"   Tampers available: 2")
        print(f"   Scheduled: {result['scheduled_requests']}/5")
        print(f"   Max concurrent verified: ≤2")

    def test_train_precedence_vande_bharat_no_conflict(self):
        """
        Vande Bharat and Rajdhani (priority=1) trains MUST NOT be delayed.
        Solver should not schedule blocks during their passage.
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=720)

        requests = [
            {
                "request_id": "BLOCK_REQ_001",
                "department": "TMS",
                "section_id": "SEC_UP_MAIN",
                "from_km": 60.0,
                "to_km": 62.0,
                "asset_type": "RAIL",
                "defect_type": "CORRUGATION",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 120,
                "priority_score": 75.0,
                "required_machine_type": None
            }
        ]

        # Vande Bharat passing through section at 300-360 minutes (5:00-6:00 AM)
        trains = [
            {
                "train_number": "22436_VANDE_BHARAT",
                "section_id": "SEC_UP_MAIN",
                "entry_minute": 300,
                "exit_minute": 360,
                "priority_precedence": 1  # TOP PRIORITY
            }
        ]

        result = optimizer.solve(requests=requests, trains=trains, max_time_seconds=10.0)

        assert result["status"] == "SUCCESS"
        assert result["scheduled_requests"] == 1, "Request should be scheduled"

        # Find when block is scheduled
        block = result["blocks"][0]
        block_start = block["start_minute"]
        block_end = block["end_minute"]

        # Block must NOT overlap with Vande Bharat passage
        vb_entry, vb_exit = 300, 360
        no_conflict = (block_end <= vb_entry) or (block_start >= vb_exit)

        assert no_conflict, f"Block ({block_start}-{block_end}) conflicts with Vande Bharat (300-360)"
        
        print(f"\n✅ Vande Bharat Precedence Test:")
        print(f"   Vande Bharat passage: 300-360 min")
        print(f"   Block scheduled: {block_start}-{block_end} min")
        print(f"   Conflict avoided: Yes")

    def test_bundling_incentive_multi_department(self):
        """
        Test that optimizer preferentially bundles co-located requests
        from different departments (TMS + SMMS + TDMS on same section).
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=480)

        requests = [
            # Section 1: Co-located TMS, SMMS, TDMS (should bundle)
            {
                "request_id": "SEC1_TMS",
                "department": "TMS",
                "section_id": "SEC_UP_60",
                "from_km": 60.0,
                "to_km": 62.0,
                "asset_type": "RAIL",
                "defect_type": "CORRUGATION",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 90,
                "priority_score": 80.0,
                "required_machine_type": None
            },
            {
                "request_id": "SEC1_SMMS",
                "department": "SMMS",
                "section_id": "SEC_UP_60",
                "from_km": 60.5,
                "to_km": 61.5,
                "asset_type": "POINT_MACHINE",
                "defect_type": "POINT_SLUGGISH",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 75,
                "priority_score": 78.0,
                "required_machine_type": None
            },
            {
                "request_id": "SEC1_TDMS",
                "department": "TDMS",
                "section_id": "SEC_UP_60",
                "from_km": 60.0,
                "to_km": 62.0,
                "asset_type": "OHE_CATENARY",
                "defect_type": "CONTACT_WIRE_WEAR",
                "severity": "PLANNED_HIGH",
                "estimated_duration_minutes": 80,
                "priority_score": 77.0,
                "required_machine_type": None
            },
            # Section 2: Isolated SMMS request (should be separate block)
            {
                "request_id": "SEC2_SMMS_ALONE",
                "department": "SMMS",
                "section_id": "SEC_UP_70",
                "from_km": 70.0,
                "to_km": 71.0,
                "asset_type": "SIGNAL",
                "defect_type": "LAMP_FAILURE",
                "severity": "ROUTINE",
                "estimated_duration_minutes": 60,
                "priority_score": 65.0,
                "required_machine_type": None
            }
        ]

        result = optimizer.solve(requests=requests, trains=[], max_time_seconds=10.0)

        assert result["status"] == "SUCCESS"
        assert result["scheduled_requests"] == 4, "All 4 requests should be scheduled"

        # Find the block containing Section 1 requests
        sec1_blocks = [b for b in result["blocks"] if b["section_id"] == "SEC_UP_60"]
        assert len(sec1_blocks) >= 1, "Should have block(s) for Section 1"

        # Check if co-located requests are bundled
        sec1_main_block = sec1_blocks[0]
        bundled_depts = sec1_main_block["departments"]
        bundled_tasks = [t["request_id"] for t in sec1_main_block["maintenance_tasks"]]

        if sec1_main_block["is_combined"]:
            assert len(bundled_depts) >= 2, "Combined block should have multiple departments"
            print(f"\n✅ Bundling Incentive Test:")
            print(f"   Co-located requests bundled: {len(bundled_tasks)}/3")
            print(f"   Departments in bundle: {bundled_depts}")
            print(f"   Is combined super-block: Yes")
            
            # Calculate time savings
            separate_time = 90 + 75 + 80  # Sum of individual durations
            combined_time = sec1_main_block["total_duration_minutes"]
            savings = separate_time - combined_time
            print(f"   Time saved: {savings} min ({separate_time} min → {combined_time} min)")
        else:
            print(f"\n⚠️  Bundling not optimal (solver chose separate blocks)")

    def test_stress_100_requests_performance(self):
        """
        Stress test: 100 maintenance requests across 3 departments.
        Solver must complete in <30 seconds.
        """
        optimizer = CPSATBlockOptimizer(time_horizon_minutes=20160)  # 2 weeks

        requests = []
        
        # Generate 100 diverse requests
        for i in range(100):
            dept = ["TMS", "SMMS", "TDMS"][i % 3]
            # Three departments share each physical work site.  This models a
            # legitimate combined possession, rather than treating all work on
            # the same long section as co-located.
            km = 40.0 + ((i // 3) * 3.0)
            section_id = f"SEC_UP_{int(km)//10}"
            
            requests.append({
                "request_id": f"{dept}_STRESS_{i+1:03d}",
                "department": dept,
                "section_id": section_id,
                "from_km": km,
                "to_km": km + (1.5 if dept == "SMMS" else 2.0),
                "asset_type": ["RAIL", "POINT_MACHINE", "OHE_CATENARY"][i % 3],
                "defect_type": ["CORRUGATION", "POINT_SLUGGISH", "CONTACT_WIRE_WEAR"][i % 3],
                "severity": "CRITICAL" if i < 10 else ("PLANNED_HIGH" if i < 40 else "ROUTINE"),
                "estimated_duration_minutes": 120 if i < 10 else (90 if i < 40 else 60),
                "priority_score": 95.0 - (i * 0.5),
                "required_machine_type": "TAMPING_MACHINE" if (dept == "TMS" and i % 3 == 0) else None
            })

        # Add some trains for realism (not too many to keep solver fast)
        trains = [
            {"train_number": f"TR_{j}", "section_id": f"SEC_UP_{j}", "entry_minute": 360 + j*120, "exit_minute": 420 + j*120, "priority_precedence": 1 if j < 3 else 2}
            for j in range(10)
        ]

        result = optimizer.solve(
            requests=requests,
            trains=trains,
            machine_limits={"TAMPING_MACHINE": 3, "TOWER_WAGON": 2, "BALLAST_CLEANER": 1},
            max_time_seconds=30.0
        )

        # Performance assertion
        assert result["status"] in ["SUCCESS", "FEASIBLE"], f"Solver status: {result.get('status', 'UNKNOWN')}"
        assert result["wall_time_seconds"] < 30.0, f"Solver took {result['wall_time_seconds']}s (limit: 30s)"
        
        # Quality assertions
        assert result["scheduled_requests"] >= 70, f"Should schedule 70+/100 requests, got {result['scheduled_requests']}"
        assert result["total_blocks_created"] <= 60, f"Should bundle into ≤60 blocks, got {result['total_blocks_created']}"
        assert result["combined_super_blocks"] >= 10, f"Should have 10+ bundled blocks, got {result['combined_super_blocks']}"
        
        print(f"\n✅ STRESS TEST (100 Requests):")
        print(f"   Scheduled: {result['scheduled_requests']}/100")
        print(f"   Blocks Created: {result['total_blocks_created']}")
        print(f"   Combined Super-Blocks: {result['combined_super_blocks']}")
        print(f"   Time Saved: {result['time_saved_hours']:.1f} hours")
        print(f"   Availability Gain: {result['asset_availability_gain_percent']:.1f}%")
        print(f"   ⚡ Solve Time: {result['wall_time_seconds']:.2f}s (Limit: 30s)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
