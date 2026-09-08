import pytest
import time
from optimization.cpsat_optimizer import CPSATBlockOptimizer

def test_emergency_rail_fracture_replanning_speed():
    """Verify emergency rail fracture re-solve converges in under 1 second."""
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=720)

    requests = [
        {"request_id": "REQ_01", "department": "TMS", "section_id": "SEC_UP", "from_km": 50.0, "to_km": 52.0, "estimated_duration_minutes": 120, "priority_score": 75.0, "required_machine_type": None},
        {"request_id": "REQ_02", "department": "SMMS", "section_id": "SEC_UP", "from_km": 50.5, "to_km": 51.5, "estimated_duration_minutes": 90, "priority_score": 70.0, "required_machine_type": None},
        # Emergency injection
        {"request_id": "EMERGENCY_FRACTURE", "department": "TMS", "section_id": "SEC_UP", "from_km": 52.4, "to_km": 52.8, "estimated_duration_minutes": 90, "priority_score": 100.0, "required_machine_type": None}
    ]

    start_time = time.time()
    result = optimizer.solve(requests=requests, trains=[], max_time_seconds=3.0)
    elapsed = time.time() - start_time

    assert result["status"] == "SUCCESS"
    assert elapsed < 1.0 # Sub-second replanning guarantee
    assert result["scheduled_requests"] == 3
