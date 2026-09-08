"""
Tests for Continuous MLOps Pipeline & Kolmogorov-Smirnov Drift Monitor
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-10 Verification
"""

import numpy as np
import pytest
from fastapi.testclient import TestClient

from api.main import app
from ml.continuous_learner import (
    KolmogorovSmirnovDriftDetector,
    ChampionChallengerEvaluator,
    ContinuousRiskModelTrainer,
)
from ml.risk_explainer import risk_explainer

client = TestClient(app)


def test_kolmogorov_smirnov_drift_detection():
    """Verify Kolmogorov-Smirnov test correctly distinguishes stable vs drifted TGI distributions."""
    np.random.seed(42)
    baseline = np.random.normal(loc=70.0, scale=10.0, size=200).tolist()

    # Stable distribution with similar parameters
    stable_sample = np.random.normal(loc=70.5, scale=10.2, size=150).tolist()
    res_stable = KolmogorovSmirnovDriftDetector.detect_tgi_drift(baseline, stable_sample)
    assert res_stable["drift_detected"] is False
    assert res_stable["drift_severity"] == "STABLE"

    # Shifted/degraded distribution (mean drops to 45 with high variance)
    drifted_sample = np.random.normal(loc=45.0, scale=16.0, size=150).tolist()
    res_drifted = KolmogorovSmirnovDriftDetector.detect_tgi_drift(baseline, drifted_sample)
    assert res_drifted["drift_detected"] is True
    assert res_drifted["drift_severity"] == "HIGH_DISTRIBUTION_SHIFT"
    assert res_drifted["p_value"] < 0.05


def test_continuous_retraining_execution():
    """Verify continuous trainer fits Challenger, executes Champion-Challenger validation, and promotes."""
    trainer = ContinuousRiskModelTrainer()
    sample_trc = [
        {"km": 44.0, "tgi": 82.5},
        {"km": 44.5, "tgi": 78.3},
        {"km": 45.0, "tgi": 71.2},
        {"km": 45.5, "tgi": 65.0},
        {"km": 46.0, "tgi": 58.1},
        {"km": 46.5, "tgi": 45.3},
        {"km": 47.0, "tgi": 30.2},
    ]

    report = trainer.retrain_from_trc_measurements(
        parsed_trc_rows=sample_trc,
        base_samples=1000,
    )

    assert report["status"] == "SUCCESS"
    assert "champion_challenger_evaluation" in report
    eval_res = report["champion_challenger_evaluation"]
    assert "decision" in eval_res
    assert eval_res["metrics"]["challenger"]["r2_score"] >= 0.85
    assert trainer.last_retrain_time is not None

    # Verify risk_explainer still works and makes valid predictions after hot-reload
    pred = risk_explainer.explain_request({
        "severity": "CRITICAL",
        "accumulated_gmt": 70.0,
        "tgi_score": 55.0,
    })
    assert "risk_score" in pred
    assert 10.0 <= pred["risk_score"] <= 99.5


def test_retrain_api_endpoint():
    """Verify POST /api/v1/ml/retrain and GET /api/v1/ml/model-status endpoints."""
    csv_data = """KM,TGI
44.0,82.5
45.0,71.2
46.0,58.1
47.0,30.2
"""
    retrain_res = client.post(
        "/api/v1/ml/retrain",
        json={"csv_content": csv_data, "sample_count": 800}
    )
    assert retrain_res.status_code == 200
    rdata = retrain_res.json()
    assert rdata["status"] == "SUCCESS"
    assert "drift_analysis" in rdata
    assert "champion_challenger_evaluation" in rdata

    status_res = client.get("/api/v1/ml/model-status")
    assert status_res.status_code == 200
    sdata = status_res.json()
    assert sdata["model_ready"] is True
    assert sdata["last_retrain_time"] is not None
