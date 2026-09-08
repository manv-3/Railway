"""
Track Recording Car Parser Tests - V3-07
Tests for the IRPWM OMS-2000 / TG-4 CSV parser.
Verifies correct parsing, section aggregation, and graceful error handling.
"""

import io
import os
import tempfile
import pytest
from integrations.track_recording_car_parser import TrackRecordingCarParser, TGI_QUALITY_BANDS

# ─── Sample OMS-2000 CSV Data ──────────────────────────────────────────────────
SAMPLE_OMS_CSV = """KM,TGI,TWIST_MM,GAUGE_MM,ALIGNMENT_MM,UNEVENNESS_MM
44.0,82.5,2.1,1676.2,1.8,3.2
44.5,78.3,2.8,1675.9,2.3,4.1
45.0,71.2,3.5,1676.0,2.9,5.0
45.5,65.0,4.2,1675.7,3.1,5.8
46.0,58.1,5.0,1675.4,3.8,7.2
46.5,45.3,6.1,1675.0,4.5,8.9
47.0,30.2,8.2,1674.5,5.8,11.0
"""

MALFORMED_CSV = """KM,TGI,TWIST_MM
44.0,82.5,2.1
44.5,bad_value,2.8
45.0,,3.5
45.5,71.2,not_a_number
46.0,65.0,4.1
"""


class TestTrackRecordingCarParserBasic:
    """Basic parsing functionality tests."""

    def _write_temp_csv(self, content: str) -> str:
        """Write CSV content to a temp file and return path."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(content)
            return f.name

    def test_parse_file_returns_list(self):
        """parse_file() must return a list of measurement rows."""
        parser = TrackRecordingCarParser(section_id="SEC_NDLS_GZB_UP")
        path = self._write_temp_csv(SAMPLE_OMS_CSV)
        try:
            rows = parser.parse_file(path)
            assert isinstance(rows, list)
            assert len(rows) > 0
        finally:
            os.unlink(path)

    def test_parsed_row_has_required_fields(self):
        """Each parsed row must contain km, tgi, and tgi_quality fields."""
        parser = TrackRecordingCarParser()
        path = self._write_temp_csv(SAMPLE_OMS_CSV)
        try:
            rows = parser.parse_file(path)
            for row in rows:
                assert "km" in row
                assert "tgi" in row
                assert "tgi_quality" in row
                assert "requires_attention" in row
        finally:
            os.unlink(path)

    def test_tgi_quality_bands_assigned_correctly(self):
        """TGI = 82.5 should be GOOD quality (band B: 65–85)."""
        parser = TrackRecordingCarParser()
        rows = parser.parse_csv_string(SAMPLE_OMS_CSV)
        first_row = rows[0]
        assert first_row["km"] == 44.0
        assert first_row["tgi"] == 82.5
        assert first_row["tgi_quality"] == "GOOD"
        assert first_row["requires_attention"] is False

    def test_critical_tgi_requires_attention(self):
        """TGI < 35 (CRITICAL) must set requires_attention=True."""
        parser = TrackRecordingCarParser()
        rows = parser.parse_csv_string(SAMPLE_OMS_CSV)
        critical_row = next((r for r in rows if r["tgi"] is not None and r["tgi"] < 35), None)
        assert critical_row is not None
        assert critical_row["requires_attention"] is True
        assert critical_row["tgi_quality"] == "CRITICAL"

    def test_malformed_rows_are_skipped_gracefully(self):
        """Malformed TGI values should be skipped without crashing."""
        parser = TrackRecordingCarParser()
        rows = parser.parse_csv_string(MALFORMED_CSV)
        # Should have at least the valid rows (44.0 and 46.0)
        assert len(rows) >= 2
        # All returned rows must have valid km values
        for row in rows:
            assert row["km"] is not None

    def test_missing_file_raises_file_not_found(self):
        """Non-existent file path must raise FileNotFoundError."""
        parser = TrackRecordingCarParser()
        with pytest.raises(FileNotFoundError):
            parser.parse_file("/tmp/nonexistent_trc_file.csv")


class TestSectionMetricsAggregation:
    """Tests for aggregate_section_metrics() output structure."""

    def test_aggregate_returns_dict_with_xgboost_fields(self):
        """aggregate_section_metrics must return xgboost_ready=True with all feature fields."""
        parser = TrackRecordingCarParser(section_id="SEC_NDLS_GZB_UP")
        rows = parser.parse_csv_string(SAMPLE_OMS_CSV)
        metrics = parser.aggregate_section_metrics(rows, from_km=44.0, to_km=46.0)

        assert metrics["xgboost_ready"] is True
        assert metrics["section_id"] == "SEC_NDLS_GZB_UP"
        assert metrics["from_km"] == 44.0
        assert metrics["to_km"] == 46.0
        assert "tgi_mean" in metrics
        assert "tgi_std" in metrics
        assert "tgi_min" in metrics
        assert "data_points" in metrics

    def test_tgi_mean_is_correct(self):
        """tgi_mean must be the arithmetic mean of TGI values in the km range."""
        parser = TrackRecordingCarParser()
        rows = parser.parse_csv_string(SAMPLE_OMS_CSV)
        # KM 44.0–46.0 has TGI values: 82.5, 78.3, 71.2, 65.0, 58.1
        metrics = parser.aggregate_section_metrics(rows, from_km=44.0, to_km=46.0)
        expected_mean = (82.5 + 78.3 + 71.2 + 65.0 + 58.1) / 5
        assert abs(metrics["tgi_mean"] - expected_mean) < 0.01

    def test_empty_km_range_returns_not_ready(self):
        """KM range with no data must return xgboost_ready=False."""
        parser = TrackRecordingCarParser()
        rows = parser.parse_csv_string(SAMPLE_OMS_CSV)
        metrics = parser.aggregate_section_metrics(rows, from_km=100.0, to_km=110.0)
        assert metrics["xgboost_ready"] is False
        assert metrics["data_points"] == 0

    def test_attention_km_count_is_accurate(self):
        """attention_km_count must reflect the number of km points needing maintenance."""
        parser = TrackRecordingCarParser()
        rows = parser.parse_csv_string(SAMPLE_OMS_CSV)
        # KM 44.0–47.0: TGI 30.2 (CRITICAL) at km 47.0 requires attention
        metrics = parser.aggregate_section_metrics(rows, from_km=44.0, to_km=47.0)
        assert metrics["attention_km_count"] >= 1
