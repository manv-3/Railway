"""
Tests for OMS-2000 / TG-4 Telemetry Ingestion and CRIS COA Adapter Endpoints
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-04 Verification
"""

import io
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

SAMPLE_OMS_CSV = """KM,TGI,TWIST_MM,GAUGE_MM,ALIGNMENT_MM,UNEVENNESS_MM
44.0,82.5,2.1,1676.2,1.8,3.2
44.5,78.3,2.8,1675.9,2.3,4.1
45.0,71.2,3.5,1676.0,2.9,5.0
45.5,65.0,4.2,1675.7,3.1,5.8
46.0,58.1,5.0,1675.4,3.8,7.2
46.5,45.3,6.1,1675.0,4.5,8.9
47.0,30.2,8.2,1674.5,5.8,11.0
"""


def test_tg4_upload_json():
    """Verify TG-4 CSV upload via JSON body recalculates section requests."""
    response = client.post(
        "/api/v1/telemetry/upload-tg4",
        json={"csv_content": SAMPLE_OMS_CSV, "section_id": "SEC_GZB_ALJN_UP"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["total_rows_parsed"] == 7
    assert data["attention_required_count"] >= 1
    assert data["affected_sections_count"] >= 1
    assert "sections_updated" in data


def test_tg4_upload_multipart():
    """Verify TG-4 CSV upload via multipart/form-data file upload."""
    file_bytes = io.BytesIO(SAMPLE_OMS_CSV.encode("utf-8"))
    response = client.post(
        "/api/v1/telemetry/upload-tg4",
        files={"file": ("oms_measurements.csv", file_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["total_rows_parsed"] == 7
    assert data["filename"] == "oms_measurements.csv"


def test_tg4_upload_empty():
    """Empty CSV should return 400 Bad Request."""
    response = client.post(
        "/api/v1/telemetry/upload-tg4",
        json={"csv_content": ""}
    )
    assert response.status_code == 400


def test_section_telemetry_metrics():
    """Verify section geometry telemetry metrics query."""
    response = client.get("/api/v1/telemetry/sections/SEC_GZB_ALJN_UP/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["section_id"] == "SEC_GZB_ALJN_UP"
    assert "speed_limit_kmh" in data
    assert "active_maintenance_requests" in data


def test_coa_active_trains():
    """Verify CRIS COA active train paths endpoint."""
    response = client.get("/api/v1/integrations/coa/active-trains?division_id=DIV_DLI")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "train_paths" in data
    assert data["total_trains"] >= 1


def test_coa_section_occupancy():
    """Verify CRIS COA section occupancy endpoint."""
    response = client.get("/api/v1/integrations/coa/occupancy/SEC_GZB_ALJN_UP")
    assert response.status_code == 200
    data = response.json()
    assert data["section_id"] == "SEC_GZB_ALJN_UP"
    assert data["occupancy_status"] in ("CLEAR", "OCCUPIED")
    assert "signal_aspects" in data


def test_coa_export_block_sanction():
    """Verify export of sanctioned block to CRIS COA Line Block Register."""
    payload = {
        "section_id": "SEC_GZB_ALJN_UP",
        "duration_minutes": 180,
        "sanctioned_by": "Sr. DOM - Delhi Division",
    }
    response = client.post(
        "/api/v1/integrations/coa/block-sanction/BLK_OPT_TEST_001",
        json=payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "coa_reference_number" in data
    assert data["line_block_register_entry"] == "CREATED"
