import pytest
from optimization.cpsat_optimizer import CPSATBlockOptimizer

def test_cpsat_bundling_math():
    """Verify CP-SAT solver collapses co-located tasks and enforces non-overlap."""
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=720)

    requests = [
        {"request_id": "R1", "department": "TMS", "section_id": "SEC_UP", "from_km": 40.0, "to_km": 42.0, "estimated_duration_minutes": 120, "priority_score": 90.0, "required_machine_type": None},
        {"request_id": "R2", "department": "SMMS", "section_id": "SEC_UP", "from_km": 40.5, "to_km": 41.5, "estimated_duration_minutes": 90, "priority_score": 80.0, "required_machine_type": None},
        {"request_id": "R3", "department": "TDMS", "section_id": "SEC_UP", "from_km": 40.0, "to_km": 42.0, "estimated_duration_minutes": 90, "priority_score": 75.0, "required_machine_type": None},
    ]

    trains = [
        {"train_number": "22436", "section_id": "SEC_UP", "entry_minute": 300, "exit_minute": 360, "priority_precedence": 1}
    ]

    result = optimizer.solve(requests=requests, trains=trains, max_time_seconds=10.0)

    assert result["status"] == "SUCCESS"
    assert result["scheduled_requests"] == 3
    # All 3 requests should be consolidated into a single Combined Super-Block
    assert result["total_blocks_created"] == 1
    assert result["combined_super_blocks"] == 1
    # Separate maintenance time: 120 + 90 + 90 = 300 min (5.0 hrs)
    # Optimized combined time: 120 min (2.0 hrs)
    assert result["time_saved_hours"] >= 3.0
    assert result["asset_availability_gain_percent"] >= 50.0

def test_directional_isolation():
    """Verify Up-line blocks do not conflict with Down-line blocks."""
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=720)

    requests = [
        {"request_id": "R_UP", "department": "TMS", "section_id": "SEC_UP", "from_km": 50.0, "to_km": 52.0, "estimated_duration_minutes": 120, "priority_score": 85.0, "required_machine_type": None},
        {"request_id": "R_DN", "department": "TMS", "section_id": "SEC_DN", "from_km": 50.0, "to_km": 52.0, "estimated_duration_minutes": 120, "priority_score": 85.0, "required_machine_type": None}
    ]

    result = optimizer.solve(requests=requests, trains=[], max_time_seconds=10.0)
    assert result["status"] == "SUCCESS"
    assert result["total_blocks_created"] == 2
