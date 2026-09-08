import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["platform"] == "Indian Railways AI Block Planning Platform (PS 26027)"

def test_corridor_stations_api():
    response = client.get("/api/v1/corridor/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 5
    codes = [s["code"] for s in stations]
    assert "NDLS" in codes
    assert "CNB" in codes

def test_corridor_sections_api():
    response = client.get("/api/v1/corridor/sections")
    assert response.status_code == 200
    sections = response.json()
    assert len(sections) >= 4

def test_corridor_kpis_api():
    response = client.get("/api/v1/corridor/kpis")
    assert response.status_code == 200
    kpis = response.json()
    assert "asset_availability" in kpis
    assert "zonal_benchmarks" in kpis

def test_ml_predict_risk_api():
    payload = {
        "severity": "CRITICAL",
        "accumulated_gmt": 90.0,
        "tgi_score": 46.0
    }
    response = client.post("/api/v1/ml/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["result"]["risk_score"] > 75.0
