import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

class PriorityScorer:
    """
    ML-Driven Maintenance Priority & Failure Risk Scorer.
    Calculates priority score (0-100) based on accumulated tonnage (GMT),
    Track Geometry Index (TGI), defect severity, and overdue duration.
    """
    def __init__(self):
        self.feature_cols = [
            "asset_age_years", "accumulated_gmt", "track_geometry_index",
            "defect_severity_code", "overdue_days", "corridor_density_tpd",
            "department_code", "is_passenger_corridor"
        ]

    def calculate_priority(self, req: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        age = float(req.get("asset_age_years", 7.5))
        gmt = float(req.get("accumulated_gmt", 40.0))
        tgi = float(req.get("tgi", 68.0))
        severity = str(req.get("severity", "PLANNED_HIGH")).upper()
        overdue_days = max(0, int(req.get("overdue_days", 0)))
        corridor_density = float(req.get("corridor_density", 90.0))
        dept = str(req.get("department", "TMS")).upper()

        severity_weights = {
            "EMERGENCY": 40.0,
            "CRITICAL": 30.0,
            "PLANNED_HIGH": 18.0,
            "ROUTINE": 8.0
        }
        sev_score = severity_weights.get(severity, 15.0)

        # Indian Railways P-Way Degradation Component
        tgi_risk = max(0.0, (100.0 - tgi) * 0.35)
        overdue_risk = min(25.0, overdue_days * 1.8)
        tonnage_risk = min(15.0, gmt * 0.18)
        traffic_factor = min(10.0, corridor_density * 0.08)

        raw_score = sev_score + tgi_risk + overdue_risk + tonnage_risk + traffic_factor
        final_score = float(np.clip(raw_score, 12.0, 99.5))

        # Mathematical factor breakdown for SHAP / Explainability
        factors = {
            "Defect Severity": round(sev_score, 1),
            "Track Geometry Degradation (TGI)": round(tgi_risk, 1),
            "Overdue Inspection Days": round(overdue_risk, 1),
            "Accumulated Tonnage (GMT)": round(tonnage_risk, 1),
            "Corridor Traffic Density": round(traffic_factor, 1)
        }

        return round(final_score, 1), factors
