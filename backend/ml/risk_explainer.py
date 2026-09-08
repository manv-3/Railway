import os
import numpy as np
import pandas as pd
import xgboost as xgb
import shap
from typing import Dict, Any, Tuple

MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgboost_risk_model.json")
FEATURE_NAMES = [
    "accumulated_gmt",
    "tgi_score",
    "overdue_days",
    "severity_code",
    "asset_age_years",
    "operating_speed_kmh",
    "traffic_density_tpd"
]

DISPLAY_NAMES = {
    "accumulated_gmt": "High Gross Million Tonnes (GMT)",
    "tgi_score": "Track Geometry Degradation (TGI)",
    "overdue_days": "Overdue Inspection Days",
    "severity_code": "Defect Severity Classification",
    "asset_age_years": "Asset Age & Metallurgical Fatigue",
    "operating_speed_kmh": "Operating Line Speed (110-130 km/h)",
    "traffic_density_tpd": "Corridor High-Traffic Density"
}

class RiskExplainer:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RiskExplainer, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        self.model = xgb.XGBRegressor()
        if os.path.exists(MODEL_PATH):
            self.model.load_model(MODEL_PATH)
            self.explainer = shap.TreeExplainer(self.model)
            self.ready = True
        else:
            self.ready = False

    def explain_request(self, req: Dict[str, Any]) -> Dict[str, Any]:
        if not self.ready:
            return {
                "risk_score": 75.0,
                "shap_factors": {"Estimated Risk": 75.0},
                "primary_risk_driver": "Model uninitialized"
            }

        severity_map = {
            "ROUTINE": 1,
            "PLANNED_HIGH": 2,
            "CRITICAL": 3,
            "EMERGENCY": 4
        }
        sev_str = str(req.get("severity", "PLANNED_HIGH")).upper()
        severity_code = severity_map.get(sev_str, 2)

        input_data = {
            "accumulated_gmt": float(req.get("accumulated_gmt", 52.0)),
            "tgi_score": float(req.get("tgi_score", 62.0)),
            "overdue_days": int(req.get("overdue_days", 4)),
            "severity_code": severity_code,
            "asset_age_years": float(req.get("asset_age_years", 8.5)),
            "operating_speed_kmh": float(req.get("operating_speed_kmh", 130.0)),
            "traffic_density_tpd": float(req.get("traffic_density_tpd", 115.0))
        }

        df = pd.DataFrame([input_data])[FEATURE_NAMES]
        prediction = float(np.clip(self.model.predict(df)[0], 10.0, 99.5))

        shap_values = self.explainer.shap_values(df)[0]
        base_value = float(self.explainer.expected_value)

        attributions = {}
        for feature, val in zip(FEATURE_NAMES, shap_values):
            display_name = DISPLAY_NAMES.get(feature, feature)
            attributions[display_name] = round(float(val), 2)

        # Sort factors by impact magnitude
        sorted_factors = sorted(attributions.items(), key=lambda item: abs(item[1]), reverse=True)
        primary_driver = sorted_factors[0][0] if sorted_factors else "Defect Severity"

        return {
            "risk_score": round(prediction, 1),
            "base_risk": round(base_value, 1),
            "shap_attributions": dict(sorted_factors),
            "primary_risk_driver": primary_driver
        }

risk_explainer = RiskExplainer()
