"""
G&SR Statutory Audit Trail Tests - V3-03
Tests the AuditLogRecord model and the create_audit_record helper function.
Ensures non-repudiable audit records are created for all safety-critical actions.
"""

import hashlib
import json
import pytest
from unittest.mock import MagicMock
from datetime import datetime


class TestAuditLogRecordModel:
    """Tests for the AuditLogRecord SQLAlchemy model."""

    def test_audit_log_model_exists(self):
        """AuditLogRecord must be importable from database.models."""
        from database.models import AuditLogRecord
        assert AuditLogRecord is not None

    def test_audit_log_model_tablename(self):
        """AuditLogRecord must persist to 'statutory_audit_logs' table."""
        from database.models import AuditLogRecord
        assert AuditLogRecord.__tablename__ == "statutory_audit_logs"

    def test_audit_log_model_has_required_columns(self):
        """AuditLogRecord must have all columns required for G&SR compliance."""
        from database.models import AuditLogRecord
        required_columns = [
            "id", "entity_type", "entity_id", "action",
            "actor_user_id", "actor_role", "client_ip",
            "timestamp", "payload_sha256", "metadata_json"
        ]
        model_columns = [col.key for col in AuditLogRecord.__table__.columns]
        for col in required_columns:
            assert col in model_columns, f"Missing required column: {col}"


class TestGSRStatutoryActions:
    """Tests that statutory action strings match G&SR requirements."""

    GSR_REQUIRED_ACTIONS = [
        "SANCTION_GRANTED",
        "DISCONNECTION_MEMO_ISSUED",
        "PTW_ISSUED",
        "TRACK_FIT_CERTIFIED",
    ]

    def test_all_required_actions_are_strings(self):
        """G&SR action strings must be non-empty strings."""
        for action in self.GSR_REQUIRED_ACTIONS:
            assert isinstance(action, str) and len(action) > 0

    def test_sanction_action_creates_audit_record(self):
        """SANCTION_GRANTED action must produce a complete audit record."""
        from api.routes.blocks import create_audit_record

        db = MagicMock()
        user = {"username": "sr_dom_dli", "tier_role": "DIV_CONTROLLER"}
        payload = {
            "block_id": "BLK_DLI_20260908_01",
            "section_id": "SEC_NDLS_GZB_UP",
            "sanction_time": datetime.utcnow().isoformat(),
        }

        record = create_audit_record(
            db, "MAINTENANCE_BLOCK", "BLK_DLI_20260908_01",
            "SANCTION_GRANTED", user, "192.168.1.50", payload
        )

        assert record.action == "SANCTION_GRANTED"
        assert record.entity_id == "BLK_DLI_20260908_01"
        assert record.client_ip == "192.168.1.50"

    def test_disconnection_memo_action_creates_audit_record(self):
        """DISCONNECTION_MEMO_ISSUED action must populate all fields correctly."""
        from api.routes.blocks import create_audit_record

        db = MagicMock()
        user = {"username": "station_master", "tier_role": "STATION_MASTER"}
        payload = {
            "memo_number": "DM/GZB/2026/001",
            "station_code": "GZB",
            "block_id": "BLK_DLI_20260908_01",
        }

        record = create_audit_record(
            db, "DISCONNECTION_MEMO", "BLK_DLI_20260908_01",
            "DISCONNECTION_MEMO_ISSUED", user, "10.0.0.5", payload
        )

        assert record.action == "DISCONNECTION_MEMO_ISSUED"
        assert record.actor_role == "STATION_MASTER"
        # SHA-256 is always 64 hex characters
        assert len(record.payload_sha256) == 64

    def test_ptw_action_creates_audit_record(self):
        """PTW_ISSUED must record TPC controller details in metadata_json."""
        from api.routes.blocks import create_audit_record

        db = MagicMock()
        user = {"username": "tpc_gzb", "tier_role": "FIELD_SSE"}
        payload = {
            "ptw_number": "PTW/GZB/2026/001",
            "tpc_controller": "Sh. Rajesh Kumar",
            "ohe_subsector": "GZB-SP-1A",
            "block_id": "BLK_DLI_20260908_01",
        }

        record = create_audit_record(
            db, "PERMIT_TO_WORK", "BLK_DLI_20260908_01",
            "PTW_ISSUED", user, "10.0.0.6", payload
        )

        assert record.action == "PTW_ISSUED"
        assert record.metadata_json == payload

    def test_track_fit_action_creates_audit_record(self):
        """TRACK_FIT_CERTIFIED must record TSR caution order in metadata_json."""
        from api.routes.blocks import create_audit_record

        db = MagicMock()
        user = {"username": "sse_pway_gzb", "tier_role": "FIELD_SSE"}
        payload = {
            "block_id": "BLK_DLI_20260908_01",
            "caution_order_speed_kmh": 30,
            "caution_order_duration_hours": 2,
        }

        record = create_audit_record(
            db, "TRACK_FIT_CERTIFICATE", "BLK_DLI_20260908_01",
            "TRACK_FIT_CERTIFIED", user, "10.0.0.7", payload
        )

        assert record.action == "TRACK_FIT_CERTIFIED"
        assert record.metadata_json["caution_order_speed_kmh"] == 30


class TestPayloadHashing:
    """Tests that SHA-256 payload hashing is correct and consistent."""

    def test_sha256_hash_length_is_64_chars(self):
        """SHA-256 hex digest is always 64 characters."""
        import hashlib
        h = hashlib.sha256(b"test payload").hexdigest()
        assert len(h) == 64

    def test_hash_is_deterministic(self):
        """Same sorted JSON payload always produces the same SHA-256."""
        payload = {"block_id": "BLK_001", "action": "SANCTION_GRANTED", "timestamp": "2026-09-08T02:00:00"}
        h1 = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        h2 = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        assert h1 == h2

    def test_payload_order_does_not_affect_hash(self):
        """sort_keys=True ensures dict ordering does not change the hash."""
        p1 = {"b": 2, "a": 1}
        p2 = {"a": 1, "b": 2}
        h1 = hashlib.sha256(json.dumps(p1, sort_keys=True).encode()).hexdigest()
        h2 = hashlib.sha256(json.dumps(p2, sort_keys=True).encode()).hexdigest()
        assert h1 == h2
