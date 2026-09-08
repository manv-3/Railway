"""
IRPWM Track Recording Car (OMS / TG-4) Ingestion Pipeline
PS 26027 - Indian Railways AI Block Planning Platform

Implements CSV parser for standard Indian Railways:
- OMS-2000: Oscillation Monitoring System
- TG-4: Track Geometry Car

These instruments traverse the entire railway network on measurement runs and
produce CSV files with per-kilometer geometry measurements. This parser extracts
real-world track geometry indices directly into the XGBoost risk feature pipeline,
eliminating dependence on synthetic data for training.

IRPWM Reference: Indian Railways Permanent Way Manual, Para 7.220–7.230
"""

import csv
import logging
import math
import io
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ─── OMS-2000 / TG-4 Column Schema ───────────────────────────────────────────
# Standard Indian Railways TRC CSV headers
TRC_COLUMNS = {
    "km": ["KM", "KILOMETER", "CHAINAGE", "DISTANCE_KM"],
    "tgi": ["TGI", "TRACK_GEOMETRY_INDEX", "TGI_VALUE"],
    "twist": ["TWIST_MM", "TWIST", "TW_MM"],
    "gauge": ["GAUGE_MM", "GAUGE", "GA_MM"],
    "alignment": ["ALIGNMENT_MM", "ALIGNMENT", "AL_MM"],
    "unevenness": ["UNEVENNESS_MM", "UNEVENNESS", "UN_MM"],
    "cross_level": ["CROSS_LEVEL_MM", "CROSS_LEVEL", "CL_MM"],
}

# Track quality categories per Indian Railways IRPWM
TGI_QUALITY_BANDS = {
    "A": (85, 100, "EXCELLENT"),   # No attention required
    "B": (65, 85,  "GOOD"),        # Routine maintenance
    "C": (50, 65,  "FAIR"),        # Enhanced maintenance attention
    "D": (35, 50,  "POOR"),        # Priority maintenance / speed restriction
    "E": (0,  35,  "CRITICAL"),    # Emergency possession required
}


class TrackRecordingCarParser:
    """
    Parser for OMS-2000 and TG-4 Track Geometry Car output CSV files.

    Usage:
        parser = TrackRecordingCarParser()
        rows = parser.parse_file("path/to/tg4_output.csv")
        metrics = parser.aggregate_section_metrics(rows, from_km=44.0, to_km=46.0)
        # metrics is ready to inject into XGBoost feature pipeline
    """

    def __init__(self, section_id: str = "UNKNOWN"):
        self.section_id = section_id

    def _normalize_headers(self, raw_headers: list[str]) -> dict[str, str]:
        """
        Map raw CSV column names (case-insensitive) to canonical field names.
        Returns mapping: canonical_name -> actual_csv_column.
        """
        header_map: dict[str, str] = {}
        normalized = {h.upper().replace(" ", "_"): h for h in raw_headers}

        for canonical, variants in TRC_COLUMNS.items():
            for variant in variants:
                if variant in normalized:
                    header_map[canonical] = normalized[variant]
                    break

        return header_map

    def _safe_float(self, value: str, field: str, row_num: int) -> float | None:
        """Parse a float value from CSV, logging warnings for malformed data."""
        if value is None or str(value).strip() in ("", "N/A", "NA", "-", "--"):
            return None
        try:
            return float(str(value).strip())
        except ValueError:
            logger.warning(
                "Row %d: Cannot parse '%s' as float for field '%s'. Skipping.",
                row_num, value, field
            )
            return None

    def parse_file(self, filepath: str) -> list[dict[str, Any]]:
        """
        Parse an OMS-2000 or TG-4 CSV file and return structured rows.

        Args:
            filepath: Absolute path to the TRC CSV output file.

        Returns:
            List of dicts, one per valid measurement row, with fields:
            {km, tgi, twist_mm, gauge_mm, alignment_mm, unevenness_mm,
             cross_level_mm, tgi_quality, requires_attention}
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"TRC file not found: {filepath}")

        parsed_rows: list[dict[str, Any]] = []
        errors = 0

        try:
            with open(path, newline="", encoding="utf-8-sig") as csvfile:
                reader = csv.DictReader(csvfile)
                if reader.fieldnames is None:
                    raise ValueError(f"Empty or headerless CSV file: {filepath}")

                header_map = self._normalize_headers(list(reader.fieldnames))

                if "km" not in header_map:
                    raise ValueError(
                        f"TRC CSV missing kilometer/chainage column. "
                        f"Available columns: {list(reader.fieldnames)}"
                    )

                for row_num, raw_row in enumerate(reader, start=2):
                    try:
                        row_result = self._parse_row(raw_row, header_map, row_num)
                        if row_result is not None:
                            parsed_rows.append(row_result)
                    except Exception as exc:
                        errors += 1
                        logger.warning("Row %d parse error: %s", row_num, exc)
                        if errors > 100:
                            logger.error("Too many parse errors. Stopping at row %d.", row_num)
                            break

        except UnicodeDecodeError:
            # Retry with latin-1 encoding (some older OMS files use this)
            with open(path, newline="", encoding="latin-1") as csvfile:
                reader = csv.DictReader(csvfile)
                header_map = self._normalize_headers(list(reader.fieldnames or []))
                for row_num, raw_row in enumerate(reader, start=2):
                    row_result = self._parse_row(raw_row, header_map, row_num)
                    if row_result is not None:
                        parsed_rows.append(row_result)

        logger.info(
            "TRC parse complete: file=%s parsed_rows=%d errors=%d",
            path.name, len(parsed_rows), errors
        )
        return parsed_rows

    def parse_csv_string(self, csv_content: str) -> list[dict[str, Any]]:
        """
        Parse OMS/TG-4 data from a CSV string (for API upload endpoints).

        Args:
            csv_content: Raw CSV string content.

        Returns:
            List of parsed measurement rows.
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        if reader.fieldnames is None:
            return []

        header_map = self._normalize_headers(list(reader.fieldnames))
        parsed_rows = []

        for row_num, raw_row in enumerate(reader, start=2):
            try:
                row_result = self._parse_row(raw_row, header_map, row_num)
                if row_result is not None:
                    parsed_rows.append(row_result)
            except Exception as exc:
                logger.warning("Row %d parse error: %s", row_num, exc)

        return parsed_rows

    def _parse_row(
        self,
        raw_row: dict,
        header_map: dict[str, str],
        row_num: int
    ) -> dict[str, Any] | None:
        """Parse a single CSV row into a structured measurement record."""
        km_val = self._safe_float(
            raw_row.get(header_map.get("km", ""), ""), "km", row_num
        )
        if km_val is None:
            return None  # Skip rows with no kilometer reading

        tgi_val = self._safe_float(
            raw_row.get(header_map.get("tgi", ""), ""), "tgi", row_num
        )
        twist_val = self._safe_float(
            raw_row.get(header_map.get("twist", ""), ""), "twist_mm", row_num
        )
        gauge_val = self._safe_float(
            raw_row.get(header_map.get("gauge", ""), ""), "gauge_mm", row_num
        )
        alignment_val = self._safe_float(
            raw_row.get(header_map.get("alignment", ""), ""), "alignment_mm", row_num
        )
        unevenness_val = self._safe_float(
            raw_row.get(header_map.get("unevenness", ""), ""), "unevenness_mm", row_num
        )
        cross_level_val = self._safe_float(
            raw_row.get(header_map.get("cross_level", ""), ""), "cross_level_mm", row_num
        )

        # Determine TGI quality band
        tgi_quality = "UNKNOWN"
        requires_attention = False
        if tgi_val is not None:
            for band, (low, high, label) in TGI_QUALITY_BANDS.items():
                if low <= tgi_val < high:
                    tgi_quality = label
                    requires_attention = band in ("C", "D", "E")
                    break

        return {
            "km": km_val,
            "tgi": tgi_val,
            "twist_mm": twist_val,
            "gauge_mm": gauge_val,
            "alignment_mm": alignment_val,
            "unevenness_mm": unevenness_val,
            "cross_level_mm": cross_level_val,
            "tgi_quality": tgi_quality,
            "requires_attention": requires_attention,
        }

    def aggregate_section_metrics(
        self,
        parsed_rows: list[dict[str, Any]],
        from_km: float,
        to_km: float,
    ) -> dict[str, Any]:
        """
        Aggregate TRC measurements for a specific track section.

        Computes mean, standard deviation, and worst-case values for each
        geometry parameter — matching the feature vector expected by the
        XGBoost safety risk prediction model.

        Args:
            parsed_rows: Output from parse_file()
            from_km:     Section start kilometer mark
            to_km:       Section end kilometer mark

        Returns:
            Feature dict ready for XGBoost pipeline injection, e.g.:
            {
                "section_id": ...,
                "from_km": ...,
                "to_km": ...,
                "tgi_mean": 72.4,
                "tgi_std": 8.1,
                "tgi_min": 51.2,
                "twist_std": 3.2,
                ...
                "xgboost_ready": True
            }
        """
        section_rows = [
            r for r in parsed_rows
            if r["km"] is not None and from_km <= r["km"] <= to_km
        ]

        if not section_rows:
            logger.warning(
                "No TRC data found for section KM %.1f–%.1f. "
                "Returning empty metrics.", from_km, to_km
            )
            return {
                "section_id": self.section_id,
                "from_km": from_km,
                "to_km": to_km,
                "data_points": 0,
                "xgboost_ready": False,
                "warning": "No TRC measurements found in this km range"
            }

        def _stats(field: str) -> dict[str, float | None]:
            vals = [r[field] for r in section_rows if r.get(field) is not None]
            if not vals:
                return {"mean": None, "std": None, "min": None, "max": None}
            mean = sum(vals) / len(vals)
            variance = sum((v - mean) ** 2 for v in vals) / len(vals)
            return {
                "mean": round(mean, 3),
                "std": round(math.sqrt(variance), 3),
                "min": round(min(vals), 3),
                "max": round(max(vals), 3),
            }

        tgi_stats = _stats("tgi")
        attention_count = sum(1 for r in section_rows if r.get("requires_attention"))

        return {
            "section_id": self.section_id,
            "from_km": from_km,
            "to_km": to_km,
            "data_points": len(section_rows),
            # XGBoost features
            "tgi_mean": tgi_stats["mean"],
            "tgi_std": tgi_stats["std"],
            "tgi_min": tgi_stats["min"],
            "tgi_max": tgi_stats["max"],
            "twist_std": _stats("twist_mm")["std"],
            "gauge_mean": _stats("gauge_mm")["mean"],
            "gauge_std": _stats("gauge_mm")["std"],
            "alignment_std": _stats("alignment_mm")["std"],
            "unevenness_std": _stats("unevenness_mm")["std"],
            "cross_level_std": _stats("cross_level_mm")["std"],
            # Derived safety indicators
            "attention_km_count": attention_count,
            "attention_km_percent": round(100 * attention_count / len(section_rows), 1),
            "worst_tgi_quality": (
                min(
                    (r["tgi_quality"] for r in section_rows if r["tgi_quality"] != "UNKNOWN"),
                    key=lambda q: {"EXCELLENT": 5, "GOOD": 4, "FAIR": 3, "POOR": 2, "CRITICAL": 1}.get(q, 0),
                    default="UNKNOWN"
                )
            ),
            "xgboost_ready": True,
        }
