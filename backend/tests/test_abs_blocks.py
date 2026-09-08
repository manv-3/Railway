"""
Tests for 1.0 km Automatic Block Signalling (ABS) Discretization & Interlocking Turnouts
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-05 & V5-06 Verification
"""

import pytest
from optimization.cpsat_optimizer import CPSATBlockOptimizer


def test_abs_track_circuit_discretization():
    """Verify physical track kilometer range is discretized into 1.0 km ABS circuits."""
    optimizer = CPSATBlockOptimizer()
    circuits = optimizer._compute_abs_track_circuits(from_km=44.2, to_km=46.8, direction="UP")
    assert len(circuits) == 3
    assert circuits == ["TC_044_UP", "TC_045_UP", "TC_046_UP"]

    # Boundary test for sub-km work
    single_circuit = optimizer._compute_abs_track_circuits(from_km=52.1, to_km=52.9, direction="DN")
    assert single_circuit == ["TC_052_DN"]


def test_four_aspect_signal_protection_envelope():
    """
    Verify 4-aspect signal protection envelope per Indian Railways G&SR Rule 9.02.
    Block boundary at KM 44 must project:
    - RED at KM 44 (Stop)
    - YELLOW at KM 43 (Caution)
    - DOUBLE_YELLOW at KM 42 (Attention)
    """
    optimizer = CPSATBlockOptimizer()
    envelope = optimizer._compute_signal_aspect_envelope(from_km=44.0, direction="UP")
    assert len(envelope) == 3
    aspect_map = {item["km"]: item["aspect"] for item in envelope}
    assert aspect_map[44] == "RED"
    assert aspect_map[43] == "YELLOW"
    assert aspect_map[42] == "DOUBLE_YELLOW"


def test_dynamic_crossover_turnout_routing():
    """
    Verify that trains conflicting with an active block are diverted via crossover turnouts
    onto parallel slow lines with realistic transit speed (30 km/h) and penalty.
    """
    optimizer = CPSATBlockOptimizer()
    trains = [
        {"train_number": "12002", "train_name": "Shatabdi Express", "section_id": "SEC_GZB_ALJN_UP", "entry_minute": 100, "exit_minute": 160},
        {"train_number": "22436", "train_name": "Vande Bharat Express", "section_id": "SEC_GZB_ALJN_UP", "entry_minute": 120, "exit_minute": 150},
    ]
    rerouted = optimizer._evaluate_turnout_crossover_routes(
        block_section="SEC_GZB_ALJN_UP",
        start_km=44.0,
        end_km=46.0,
        trains=trains,
        block_start_min=90,
        block_end_min=180,
    )
    assert len(rerouted) == 2
    for diversion in rerouted:
        assert diversion["diverted_line"] == "UP_SLOW"
        assert diversion["turnout_transit_speed_kmh"] == 30
        assert diversion["turnout_transit_penalty_minutes"] == 3.5
        assert diversion["crossover_switch_km"] == 42.0
        assert diversion["rejoin_switch_km"] == 48.0
        assert diversion["status"] == "DIVERTED_VIA_CROSSOVER_TURNOUT"


def test_abs_full_solver_integration():
    """
    Verify complete CP-SAT solve() attaches ABS track circuits, signal aspect envelopes,
    and crossover turnout routes to all generated super-blocks.
    """
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=720)
    requests = [
        {"request_id": "REQ_01", "department": "TMS", "section_id": "SEC_GZB_ALJN_UP", "from_km": 44.0, "to_km": 46.0, "estimated_duration_minutes": 120, "priority_score": 90.0},
        {"request_id": "REQ_02", "department": "SMMS", "section_id": "SEC_GZB_ALJN_UP", "from_km": 44.5, "to_km": 45.5, "estimated_duration_minutes": 90, "priority_score": 85.0},
    ]
    trains = [
        {"train_number": "22436", "train_name": "Vande Bharat Express", "section_id": "SEC_GZB_ALJN_UP", "entry_minute": 60, "exit_minute": 120, "priority_precedence": 1}
    ]

    result = optimizer.solve(requests=requests, trains=trains, max_time_seconds=10.0)
    assert result["status"] == "SUCCESS"
    assert len(result["blocks"]) >= 1

    block = result["blocks"][0]
    assert "isolated_track_circuits" in block
    assert "signal_aspect_envelopes" in block
    assert "crossover_turnout_routes" in block

    # Verify track circuits span KM 44-46
    assert "TC_044_UP" in block["isolated_track_circuits"]
    assert "TC_045_UP" in block["isolated_track_circuits"]

    # Verify 4-aspect signal protection
    aspects = block["signal_aspect_envelopes"]
    assert any(a["aspect"] == "RED" for a in aspects)
    assert any(a["aspect"] == "YELLOW" for a in aspects)
    assert any(a["aspect"] == "DOUBLE_YELLOW" for a in aspects)
