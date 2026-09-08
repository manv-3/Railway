"""
Tests for Kavach (TCAS) RDSO Packet 51/65 & Digital Braking Envelopes
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-08 Verification
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from api.main import app
from integrations.kavach_adapter import (
    KavachPacket51,
    KavachPacket65,
    KavachBrakingCurveCalculator,
    KavachSafetyEnvelopeGenerator,
)

client = TestClient(app)


def test_kavach_packet_51_tsr_creation():
    """Verify RDSO Packet 51 correctly serializes temporary speed restriction."""
    now = datetime.utcnow()
    p51 = KavachPacket51.create(
        tsr_id="TSR_DEMO_01",
        section_id="SEC_GZB_ALJN_UP",
        start_km=44.0,
        end_km=46.0,
        speed_kmh=45,
        effective_from=now,
        effective_until=now + timedelta(hours=2),
        direction="UP",
    )
    assert p51.packet_id == 51
    assert p51.allowed_speed_kmh == 45
    assert p51.start_km == 44.0
    assert p51.end_km == 46.0
    assert p51.hex_payload.startswith("AA55")
    assert p51.hex_payload.endswith("00FF")


def test_kavach_packet_65_movement_authority():
    """Verify RDSO Packet 65 truncates Movement Authority at block boundary."""
    p65 = KavachPacket65.create(
        ma_id="MA_DEMO_01",
        block_start_km=44.0,
        block_end_km=46.0,
    )
    assert p65.packet_id == 65
    assert p65.end_of_authority_km == 44.0
    assert p65.service_brake_distance_m == 1200.0
    assert p65.emergency_brake_distance_m == 500.0
    assert p65.target_speed_at_eoa_kmh == 0
    assert p65.hex_payload.startswith("AA55")


def test_kavach_braking_curve_profile():
    """Verify maximum safe approach speed decreases quadratically to 0 at EOA."""
    speed_2500m = KavachBrakingCurveCalculator.compute_max_safe_approach_speed(2500.0)
    speed_1200m = KavachBrakingCurveCalculator.compute_max_safe_approach_speed(1200.0)
    speed_500m = KavachBrakingCurveCalculator.compute_max_safe_approach_speed(500.0)
    speed_0m = KavachBrakingCurveCalculator.compute_max_safe_approach_speed(0.0)

    assert speed_2500m >= 130.0  # Line speed permitted
    assert 100.0 < speed_1200m <= 130.0
    assert 60.0 < speed_500m < 100.0
    assert speed_0m == 0.0


def test_kavach_locomotive_approach_evaluation():
    """Verify automatic brake trigger commands based on locomotive position and speed."""
    # Scenario A: Locomotive 3 km away at 120 km/h -> Normal
    eval_a = KavachBrakingCurveCalculator.evaluate_locomotive_approach(
        loco_km=41.0, loco_speed_kmh=120.0, block_start_km=44.0
    )
    assert eval_a["safety_status"] == "NORMAL_CLEAR"

    # Scenario B: Locomotive 800m away at 120 km/h (too fast for 800m) -> Service brake
    eval_b = KavachBrakingCurveCalculator.evaluate_locomotive_approach(
        loco_km=43.2, loco_speed_kmh=120.0, block_start_km=44.0
    )
    assert eval_b["kavach_command"] in ("AUTOMATIC_SERVICE_BRAKING", "AUTOMATIC_EMERGENCY_BRAKING")

    # Scenario C: Locomotive within 300m -> Emergency brake
    eval_c = KavachBrakingCurveCalculator.evaluate_locomotive_approach(
        loco_km=43.75, loco_speed_kmh=60.0, block_start_km=44.0
    )
    assert eval_c["kavach_command"] == "AUTOMATIC_EMERGENCY_BRAKING"


def test_kavach_block_api_envelope():
    """Verify API endpoint returns valid Kavach envelope for an active block."""
    # First fetch existing blocks to get a valid block_id
    blocks_res = client.get("/api/v1/blocks?division_id=DIV_DLI")
    assert blocks_res.status_code == 200
    blocks = blocks_res.json()
    if not blocks:
        pytest.skip("No blocks available in test database")

    target_id = blocks[0]["block_id"]
    kavach_res = client.get(f"/api/v1/blocks/{target_id}/kavach-envelope")
    assert kavach_res.status_code == 200
    data = kavach_res.json()
    assert data["status"] == "ACTIVE_KAVACH_ENVELOPE"
    assert "packet_65_movement_authority" in data
    assert "packet_51_possession_tsr" in data
    assert "geofenced_braking_curve" in data
    assert "envelope_sha256" in data
    assert len(data["geofenced_braking_curve"]) == 10
