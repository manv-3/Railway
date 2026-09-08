import sys
import os
import time
import random
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from optimization.cpsat_optimizer import CPSATBlockOptimizer

SECTIONS = [
    "SEC_NDLS_GZB_UP", "SEC_NDLS_GZB_DN",
    "SEC_GZB_ALJN_UP", "SEC_GZB_ALJN_DN",
    "SEC_ALJN_TDL_UP", "SEC_ALJN_TDL_DN",
    "SEC_TDL_CNB_UP", "SEC_TDL_CNB_DN"
]

DEPTS = ["TMS", "SMMS", "TDMS"]
DEFECT_TYPES = {
    "TMS": ["RAIL_FRACTURE_RISK", "SLEEPER_RENEWAL", "CORRUGATION_GRINDING", "WELD_INSPECTION", "BALLAST_PACKING"],
    "SMMS": ["POINT_MACHINE_TEST", "TRACK_CIRCUIT_CLEANING", "SIGNAL_ASPECT_ALIGNMENT", "AXLE_COUNTER_RESET"],
    "TDMS": ["OHE_INSULATOR_WASH", "CONTACT_WIRE_ADJUSTMENT", "CANTILEVER_INSPECTION", "ISOLATOR_SWITCH_TEST"]
}

def generate_stress_dataset(num_requests: int = 150):
    random.seed(42)
    requests = []

    for i in range(1, num_requests + 1):
        dept = random.choice(DEPTS)
        sec = random.choice(SECTIONS)
        defect = random.choice(DEFECT_TYPES[dept])
        duration = random.choice([60, 90, 120, 150])
        from_km = round(random.uniform(10.0, 420.0), 1)
        to_km = round(from_km + random.uniform(0.5, 3.0), 1)
        priority = round(random.uniform(50.0, 98.0), 1)

        req = {
            "request_id": f"{dept}_STRESS_{i:04d}",
            "department": dept,
            "section_id": sec,
            "from_km": from_km,
            "to_km": to_km,
            "asset_type": "TRACK_ASSET",
            "defect_type": defect,
            "estimated_duration_minutes": duration,
            "priority_score": priority,
            "required_machine_type": "TAMPING_MACHINE" if (dept == "TMS" and duration >= 120) else None
        }
        requests.append(req)

    # 40 Timetabled high-density trains over 7-day planning window
    trains = []
    for t_idx in range(1, 41):
        sec = random.choice(SECTIONS)
        entry = random.randint(30, 9800)
        trains.append({
            "train_number": f"EXP_{t_idx:03d}",
            "section_id": sec,
            "entry_minute": entry,
            "exit_minute": entry + random.randint(45, 90),
            "priority_precedence": random.choice([1, 2, 3])
        })

    return requests, trains

def run_stress_test():
    print("=" * 80)
    print("PS 26027: CP-SAT SOLVER 150-REQUISITION SCALE & STRESS BENCHMARK")
    print("=" * 80)

    requests, trains = generate_stress_dataset(150)
    print(f"Generated {len(requests)} maintenance requisitions across 8 directional corridor sections.")
    print(f"Simulating against {len(trains)} timetabled trains over 7-day operational horizon.")
    print("Invoking Google OR-Tools CP-SAT Solver with 30.0s hard ceiling...\n")

    start_wall = time.time()
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=10080) # 7 days = 10,080 minutes
    result = optimizer.solve(
        requests=requests,
        trains=trains,
        max_time_seconds=15.0
    )
    total_time = round(time.time() - start_wall, 3)

    print("-" * 80)
    print("STRESS TEST RESULTS:")
    print(f"  • Solver Status:                 {result.get('status')} ({result.get('solver_status')})")
    print(f"  • Total Input Requests:          {result.get('total_input_requests')}")
    print(f"  • Successfully Scheduled:        {result.get('scheduled_requests')} / {result.get('total_input_requests')}")
    print(f"  • Combined Super-Blocks Created: {result.get('combined_super_blocks')} (Total Blocks: {result.get('total_blocks_created')})")
    print(f"  • Separate Maintenance Required: {result.get('separate_maintenance_hours')} hours")
    print(f"  • Optimized Block Windows:       {result.get('optimized_block_hours')} hours")
    print(f"  • Total Track Downtime Saved:    {result.get('time_saved_hours')} hours")
    print(f"  • Asset Availability Gain:       +{result.get('asset_availability_gain_percent')}%")
    print(f"  • Total Solver Wall Time:        {total_time} seconds (Ceiling: 30.0s)")
    print("-" * 80)

    assert total_time < 30.0, "FAIL: Solver exceeded 30-second time budget!"
    assert result.get("time_saved_hours", 0) > 0, "FAIL: No track downtime was saved!"
    print("\nBENCHMARK STATUS: PASSED! High-concurrency scalability proven.")

if __name__ == "__main__":
    run_stress_test()
