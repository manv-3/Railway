"""
Tests for ISRO NavIC / RTIS Satellite Telemetry Streaming & Kalman ETA Predictor
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-07 Verification
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from api.main import app
from integrations.rtis_stream import (
    NavICTransponderPacket,
    KalmanPositionFilter,
    RTISStreamIngester,
)

client = TestClient(app)


def test_navic_packet_creation():
    """Verify NavICTransponderPacket deserializes standard ISRO RTIS payload."""
    data = {
        "locomotive_number": "WAP7-30215",
        "train_number": "22436",
        "timestamp": "2026-09-08T06:30:00Z",
        "latitude": 28.6654,
        "longitude": 77.4321,
        "speed_kmh": 128.5,
        "heading_degrees": 118.0,
        "current_km_mark": 45.2,
        "section_id": "SEC_GZB_ALJN_UP",
        "gnss_fix_quality": "NAVIC_3D_FIX",
    }
    pkt = NavICTransponderPacket.from_dict(data)
    assert pkt.locomotive_number == "WAP7-30215"
    assert pkt.train_number == "22436"
    assert pkt.speed_kmh == 128.5
    assert pkt.current_km_mark == 45.2


def test_kalman_filter_smoothing():
    """Verify 1-D Kalman filter smooths noisy raw GPS measurements."""
    kf = KalmanPositionFilter(initial_km=40.0, initial_speed_kmh=120.0)

    # Ingest measurements with random jitter
    res1 = kf.update(measured_km=41.1, measured_speed_kmh=122.0, dt_seconds=30.0)
    assert 40.5 < res1["smoothed_km"] < 41.5
    assert res1["smoothed_speed_kmh"] > 0

    res2 = kf.update(measured_km=42.0, measured_speed_kmh=118.0, dt_seconds=30.0)
    assert res2["smoothed_km"] > res1["smoothed_km"]


def test_rtis_drift_threshold_replanning_trigger():
    """
    Verify that when train delay drift exceeds 10 minutes,
    the ingester flags drift_threshold_exceeded and generates a ReplanningOpportunity.
    """
    ingester = RTISStreamIngester()
    now = datetime.utcnow()

    # Train running at only 30 km/h instead of 130 km/h over 80 km remaining
    # Will arrive ~100 minutes later than timetabled
    packet = NavICTransponderPacket(
        locomotive_number="WAP7-30215",
        train_number="12002",
        timestamp=now,
        latitude=28.66,
        longitude=77.43,
        speed_kmh=30.0,
        heading_degrees=120.0,
        current_km_mark=45.0,
        section_id="SEC_GZB_ALJN_UP",
    )

    timetabled_arrival = now + timedelta(minutes=40)  # On-time expectation

    telemetry = ingester.ingest_packet(
        packet=packet,
        timetabled_arrival=timetabled_arrival,
        destination_km=131.2,
    )

    assert telemetry["drift_threshold_exceeded"] is True
    assert telemetry["eta_drift_minutes"] >= 10.0
    assert telemetry["replanning_opportunity"] is not None
    opp = telemetry["replanning_opportunity"]
    assert opp["opportunity_type"] == "VACATED_CORRIDOR_SLOT"
    assert opp["trigger_hot_restart"] is True
    assert opp["train_number"] == "12002"


def test_rtis_api_endpoints():
    """Verify HTTP API endpoints for live RTIS ingestion and queries."""
    payload = {
        "locomotive_number": "WAP7-9999",
        "train_number": "22438",
        "timestamp": datetime.utcnow().isoformat(),
        "latitude": 28.65,
        "longitude": 77.41,
        "speed_kmh": 125.0,
        "heading_degrees": 115.0,
        "current_km_mark": 50.0,
        "section_id": "SEC_GZB_ALJN_UP",
        "destination_km": 131.2,
    }

    # Ingest feed
    res = client.post("/api/v1/integrations/rtis/feed", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["telemetry"]["train_number"] == "22438"

    # Query tracked trains
    query_res = client.get("/api/v1/integrations/rtis/trains?train_number=22438")
    assert query_res.status_code == 200
    qdata = query_res.json()
    assert qdata["status"] == "SUCCESS"
    assert len(qdata["tracked_trains"]) >= 1
    assert qdata["tracked_trains"][0]["train_number"] == "22438"
