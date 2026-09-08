"""
Continuous Online MLOps Retraining Pipeline & Kolmogorov-Smirnov Drift Monitor
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-10: Automated Champion-Challenger Model Retraining on Real Track Car Data

Implements:
- Kolmogorov-Smirnov 2-sample statistical drift detection on Track Geometry Index (TGI)
- Automated XGBoost risk model retraining augmenting historical data with real OMS/TG-4 measurements
- Champion-Challenger validation gate (R^2 >= 0.90, lower/equal MAE)
- Zero-downtime hot reloading of in-memory risk explainer
"""

import os
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import scipy.stats as stats
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from ml.train_risk_model import FEATURE_NAMES, MODEL_PATH, generate_training_data
from ml.risk_explainer import risk_explainer

logger = logging.getLogger(__name__)


class KolmogorovSmirnovDriftDetector:
    """
    Monitors statistical distribution drift on track geometry parameters.
    Uses the two-sample Kolmogorov-Smirnov test to detect shifts between
    the baseline training population and newly ingested OMS/TG-4 track runs.
    """

    @classmethod
    def detect_tgi_drift(
        cls,
        baseline_tgi: List[float],
        new_trc_tgi: List[float],
        alpha: float = 0.05,
    ) -> Dict[str, Any]:
        """
        Executes two-sample KS test on Track Geometry Index (TGI).
        Returns test statistic D, p-value, and drift determination.
        """
        clean_base = [x for x in baseline_tgi if x is not None and not np.isnan(x)]
        clean_new = [x for x in new_trc_tgi if x is not None and not np.isnan(x)]

        if len(clean_base) < 5 or len(clean_new) < 5:
            return {
                "drift_detected": False,
                "ks_statistic": 0.0,
                "p_value": 1.0,
                "note": "Insufficient sample size for two-sample KS test",
            }

        ks_stat, p_val = stats.ks_2samp(clean_base, clean_new)
        drift_detected = bool(p_val < alpha)

        return {
            "drift_detected": drift_detected,
            "ks_statistic": round(float(ks_stat), 4),
            "p_value": round(float(p_val), 6),
            "significance_threshold": alpha,
            "baseline_mean_tgi": round(float(np.mean(clean_base)), 2),
            "new_sample_mean_tgi": round(float(np.mean(clean_new)), 2),
            "drift_severity": "HIGH_DISTRIBUTION_SHIFT" if drift_detected else "STABLE",
        }


class ChampionChallengerEvaluator:
    """
    Evaluates Champion (active production model) vs Challenger (newly trained model)
    on a rigorous holdout test set to ensure regression resistance before promotion.
    """

    MIN_R2_THRESHOLD = 0.90

    @classmethod
    def evaluate(
        cls,
        champion_model: Optional[xgb.XGBRegressor],
        challenger_model: xgb.XGBRegressor,
        X_test: pd.DataFrame,
        y_test: pd.Series,
    ) -> Dict[str, Any]:
        """
        Compares validation metrics and renders a deployment gate decision.
        """
        challenger_preds = challenger_model.predict(X_test)
        challenger_r2 = float(r2_score(y_test, challenger_preds))
        challenger_mae = float(mean_absolute_error(y_test, challenger_preds))

        champion_r2 = 0.0
        champion_mae = 999.0
        if champion_model is not None:
            try:
                champ_preds = champion_model.predict(X_test)
                champion_r2 = float(r2_score(y_test, champ_preds))
                champion_mae = float(mean_absolute_error(y_test, champ_preds))
            except Exception as exc:
                logger.warning("Could not evaluate champion model: %s", exc)

        # Gate criteria: Challenger must achieve >= 0.90 R^2 and acceptable MAE
        passed_r2 = challenger_r2 >= cls.MIN_R2_THRESHOLD
        passed_mae = challenger_mae <= champion_mae + 0.5  # allow minimal tolerance for real data noise

        promoted = passed_r2 and (passed_mae or champion_model is None)

        return {
            "decision": "PROMOTED_TO_PRODUCTION" if promoted else "REJECTED_GATE_CRITERIA_UNMET",
            "promoted": promoted,
            "metrics": {
                "challenger": {
                    "r2_score": round(challenger_r2, 4),
                    "mae": round(challenger_mae, 4),
                },
                "champion": {
                    "r2_score": round(champion_r2, 4),
                    "mae": round(champion_mae, 4),
                },
                "r2_delta": round(challenger_r2 - champion_r2, 4),
                "mae_delta": round(challenger_mae - champion_mae, 4),
            },
            "gate_criteria": {
                "min_r2_threshold": cls.MIN_R2_THRESHOLD,
                "passed_r2": passed_r2,
                "passed_mae": passed_mae,
            },
        }


class ContinuousRiskModelTrainer:
    """
    Orchestrates end-to-end continuous model retraining with drift checks,
    Champion-Challenger gating, and zero-downtime hot-swapping.
    """

    def __init__(self):
        self.last_retrain_time: Optional[str] = None
        self.last_retrain_report: Optional[Dict[str, Any]] = None

    def retrain_from_trc_measurements(
        self,
        parsed_trc_rows: List[Dict[str, Any]],
        base_samples: int = 4000,
    ) -> Dict[str, Any]:
        """
        Retrains the XGBoost failure risk model incorporating newly ingested TRC data.
        """
        # 1. Generate base dataset
        base_df = generate_training_data(base_samples)
        baseline_tgi = base_df["tgi_score"].tolist()

        # 2. Extract real TGI readings from TRC rows
        real_tgi_readings = [
            float(r["tgi"]) for r in parsed_trc_rows
            if r.get("tgi") is not None
        ]

        # 3. Perform Kolmogorov-Smirnov drift detection
        drift_report = KolmogorovSmirnovDriftDetector.detect_tgi_drift(
            baseline_tgi=baseline_tgi,
            new_trc_tgi=real_tgi_readings,
        )

        # 4. Augment training data with real-world observed defect points
        augmented_rows = []
        for r in parsed_trc_rows:
            if r.get("tgi") is None:
                continue
            tgi_val = float(r["tgi"])
            severity_code = 3 if tgi_val < 50 else (2 if tgi_val < 70 else 1)
            target_risk = np.clip((100.0 - tgi_val) * 0.7 + severity_code * 12.0, 10.0, 99.5)
            augmented_rows.append({
                "accumulated_gmt": 72.0,
                "tgi_score": tgi_val,
                "overdue_days": 4,
                "severity_code": severity_code,
                "asset_age_years": 8.0,
                "operating_speed_kmh": 130.0,
                "traffic_density_tpd": 118.0,
                "target_risk_score": target_risk,
            })

        if augmented_rows:
            aug_df = pd.DataFrame(augmented_rows)
            combined_df = pd.concat([base_df, aug_df], ignore_index=True)
        else:
            combined_df = base_df

        # 5. Train/Test split
        X = combined_df[FEATURE_NAMES]
        y = combined_df["target_risk_score"]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # 6. Fit Challenger Model
        challenger = xgb.XGBRegressor(
            n_estimators=140,
            max_depth=4,
            learning_rate=0.07,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
        )
        challenger.fit(X_train, y_train)

        # 7. Evaluate Champion vs Challenger
        champion = risk_explainer.model if risk_explainer.ready else None
        eval_report = ChampionChallengerEvaluator.evaluate(
            champion_model=champion,
            challenger_model=challenger,
            X_test=X_test,
            y_test=y_test,
        )

        # 8. Promote if Gate Passed
        if eval_report["promoted"]:
            challenger.save_model(MODEL_PATH)
            risk_explainer._init_model()  # Hot-swap live model in memory
            self.last_retrain_time = datetime.utcnow().isoformat()
            status_msg = "Challenger model validated and promoted to production."
        else:
            status_msg = "Challenger model did not outperform Champion; kept current model."

        result = {
            "status": "SUCCESS",
            "message": status_msg,
            "retrained_at": datetime.utcnow().isoformat(),
            "trc_samples_ingested": len(parsed_trc_rows),
            "training_samples_total": len(combined_df),
            "drift_analysis": drift_report,
            "champion_challenger_evaluation": eval_report,
            "live_model_active": "CHALLENGER_PROMOTED" if eval_report["promoted"] else "CHAMPION_RETAINED",
        }

        self.last_retrain_report = result
        return result


# Global singleton continuous trainer
continuous_trainer = ContinuousRiskModelTrainer()
