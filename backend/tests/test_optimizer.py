import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.generate_corridor_data import generate_corridor_dataset
from optimization.cpsat_optimizer import CPSATBlockOptimizer
from optimization.greedy_scheduler import GreedyBlockScheduler
from optimization.spatial_clusterer import SpatialRequestClusterer
from ml.priority_scorer import PriorityScorer
from simulation.train_delay_simulator import TrainDispatchSimulator

def test_full_optimization_pipeline():
    print("\n--- TEST 1: Generating Corridor Synthetic Data ---")
    data = generate_corridor_dataset()
    assert len(data["stations"]) == 7, "Expected 7 stations"
    assert len(data["sections"]) == 8, "Expected 8 directional sections"
    assert len(data["requests"]) >= 7, "Expected at least 7 requests"
    print(f"✓ Synthetic Data verified: {len(data['requests'])} requests across {len(data['sections'])} sections.")

    print("\n--- TEST 2: Testing ML Priority Scorer ---")
    scorer = PriorityScorer()
    sample_req = data["requests"][0]
    score, factors = scorer.calculate_priority(sample_req)
    assert 0.0 <= score <= 100.0, "Score out of range"
    assert len(factors) > 0, "Expected factor attribution"
    print(f"✓ Priority Scorer verified: Request {sample_req['request_id']} scored {score} with factors {factors}")

    print("\n--- TEST 3: Testing Spatial Request Clusterer ---")
    clusterer = SpatialRequestClusterer(spatial_buffer_km=2.0)
    candidates = clusterer.find_bundling_candidates(data["requests"])
    assert len(candidates) > 0, "Expected bundling candidates"
    bundled_groups = [c for c in candidates if len(c) > 1]
    print(f"✓ Spatial Clusterer verified: Identified {len(bundled_groups)} candidate multi-department bundling groups.")

    print("\n--- TEST 4: Running Baseline Greedy Scheduler ---")
    greedy = GreedyBlockScheduler(time_horizon_minutes=1440)
    greedy_res = greedy.schedule(data["requests"], data["trains"])
    assert greedy_res["status"] == "SUCCESS"
    print(f"✓ Greedy Baseline: Scheduled {greedy_res['scheduled_requests']} separate blocks (0 combined). Duration: {greedy_res['total_duration_hours']} hours.")

    print("\n--- TEST 5: Running Google OR-Tools CP-SAT Block Optimizer ---")
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=1440)
    opt_res = optimizer.solve(
        requests=data["requests"],
        trains=data["trains"],
        max_time_seconds=15.0
    )
    assert opt_res["status"] == "SUCCESS", f"Solver failed: {opt_res}"
    assert opt_res["combined_super_blocks"] >= 1, "Expected at least 1 combined super-block!"
    assert opt_res["time_saved_hours"] > 0, "Expected positive downtime savings!"

    print(f"✓ OR-Tools CP-SAT Optimizer SUCCESS in {opt_res['wall_time_seconds']}s:")
    print(f"  • Scheduled Requests: {opt_res['scheduled_requests']} / {opt_res['total_input_requests']}")
    print(f"  • Total Blocks Created: {opt_res['total_blocks_created']}")
    print(f"  • Combined Super-Blocks: {opt_res['combined_super_blocks']}")
    print(f"  • Separate Maintenance: {opt_res['separate_maintenance_hours']} hours")
    print(f"  • Optimized Block Time: {opt_res['optimized_block_hours']} hours")
    print(f"  • Net Time Saved: {opt_res['time_saved_hours']} hours ({opt_res['asset_availability_gain_percent']}% improvement!)")

    print("\n--- TEST 6: Running Train Dispatch Simulator ---")
    simulator = TrainDispatchSimulator()
    sample_block = opt_res["blocks"][0]
    impacts = simulator.simulate_impact(sample_block, data["trains"])
    print(f"✓ Train Impact Simulation: Simulated impact on {len(impacts)} trains for block {sample_block['block_id']}.")

    print("\n=======================================================")
    print("🎉 ALL CORE BACKEND OPTIMIZATION TESTS PASSED FLAWLESSLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_optimization_pipeline()
