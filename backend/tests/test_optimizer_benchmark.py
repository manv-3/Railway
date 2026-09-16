"""Unit tests for Optimizer Benchmark Runner (Manual vs Greedy vs AI CP-SAT)."""

from database.connection import SessionLocal
from optimization.optimizer_benchmark import OptimizerBenchmarkRunner


def test_optimizer_benchmark_runs_successfully():
    db = SessionLocal()
    runner = OptimizerBenchmarkRunner(db)
    result = runner.run_benchmark(division_id="DIV_DLI", time_horizon_hours=24)
    db.close()

    assert result["status"] == "SUCCESS"
    assert "comparative_summary" in result
    summary = result["comparative_summary"]

    # Verify key benchmark assertions
    assert summary["asset_availability_gain_percent"] > 0
    assert summary["track_possession_hours_saved"] > 0
    assert summary["train_delay_reduction_percent"] > 0

    # Verify all 3 algorithms are present
    algorithms = result["algorithms"]
    assert "manual_baseline" in algorithms
    assert "greedy_heuristic" in algorithms
    assert "ai_cpsat_solver" in algorithms

    # Verify CP-SAT outperforms Manual Baseline
    manual_hours = algorithms["manual_baseline"]["total_track_hours"]
    cpsat_hours = algorithms["ai_cpsat_solver"]["total_track_hours"]
    assert cpsat_hours < manual_hours

    # Verify CP-SAT train delay is lower than manual baseline
    manual_delays = algorithms["manual_baseline"]["total_train_delay_minutes"]
    cpsat_delays = algorithms["ai_cpsat_solver"]["total_train_delay_minutes"]
    assert cpsat_delays < manual_delays
