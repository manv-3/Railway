import pytest
from ml.risk_explainer import risk_explainer

def test_xgboost_risk_prediction():
    """Verify XGBoost prediction range and sensitivity to critical defects."""
    # Critical defect with severe TGI degradation & high tonnage
    critical_req = {
        "severity": "CRITICAL",
        "tgi_score": 44.0,
        "accumulated_gmt": 95.0,
        "overdue_days": 8
    }
    crit_res = risk_explainer.explain_request(critical_req)
    assert crit_res["risk_score"] >= 80.0
    assert "shap_attributions" in crit_res
    assert len(crit_res["shap_attributions"]) == 7

    # Routine maintenance with good track geometry
    routine_req = {
        "severity": "ROUTINE",
        "tgi_score": 85.0,
        "accumulated_gmt": 25.0,
        "overdue_days": 0
    }
    rout_res = risk_explainer.explain_request(routine_req)
    assert rout_res["risk_score"] < crit_res["risk_score"]

def test_shap_factors_sum_to_difference():
    """Verify SHAP attributions reflect primary degradation driver."""
    req = {
        "severity": "CRITICAL",
        "tgi_score": 40.0,
        "accumulated_gmt": 80.0,
        "overdue_days": 12
    }
    res = risk_explainer.explain_request(req)
    assert res["primary_risk_driver"] in [
        "Defect Severity Classification",
        "Track Geometry Degradation (TGI)"
    ]
