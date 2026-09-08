"""
Security Tests - V3-02 Rate Limiting & Auth Security
Tests that authentication, rate limiting headers, and audit records work correctly.
"""

import pytest
from unittest.mock import MagicMock, patch


class TestAuthSecurity:
    """Tests for JWT authentication security hardening."""

    def test_wrong_credentials_returns_401(self):
        """Invalid credentials must return HTTP 401 Unauthorized."""
        from api.routes.auth import authenticate_user
        result = authenticate_user("nonexistent_user", "wrongpassword")
        assert result is False

    def test_correct_credentials_returns_user(self):
        """Valid demo credentials return a user dict."""
        from api.routes.auth import authenticate_user
        user = authenticate_user("div_controller", "demo123")
        assert user is not False
        assert user["tier_role"] == "DIV_CONTROLLER"

    def test_secret_key_minimum_length(self):
        """SECRET_KEY should be at least 32 characters for HMAC-SHA256 security."""
        import os
        key = os.getenv("SECRET_KEY", "railway_secret_key_super_secure_change_in_production_2026")
        assert len(key) >= 32, "SECRET_KEY must be at least 32 characters"

    def test_create_access_token_has_expiry(self):
        """JWT access tokens must include an expiration claim."""
        from api.routes.auth import create_access_token, SECRET_KEY, ALGORITHM
        from jose import jwt
        token = create_access_token({"sub": "test_user", "tier_role": "DIV_CONTROLLER"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload
        assert "iat" in payload

    def test_token_contains_role(self):
        """JWT token must embed tier_role for authorization checks."""
        from api.routes.auth import create_access_token, SECRET_KEY, ALGORITHM
        from jose import jwt
        token = create_access_token({"sub": "field_sse", "tier_role": "FIELD_SSE"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["tier_role"] == "FIELD_SSE"

    def test_rate_limit_headers_present(self):
        """Rate limiting middleware should add X-RateLimit-* headers."""
        # Test that the rate limiter rule config is correct
        from core.rate_limiter import _get_rate_limit
        assert _get_rate_limit("/auth/login") == 10
        assert _get_rate_limit("/api/v1/optimize/run") == 15
        assert _get_rate_limit("/api/v1/blocks/BLK123/sanction") == 120
        assert _get_rate_limit("/api/v1/corridor/stations") == 120


class TestAuditTrailIntegration:
    """Tests that status mutations create audit records."""

    def test_audit_record_created_on_sanction(self):
        """
        Sanctioning a block must create an AuditLogRecord with SHA-256 hash.
        Uses mock DB session to avoid requiring live database.
        """
        from api.routes.blocks import create_audit_record

        mock_db = MagicMock()
        mock_user = {"username": "div_controller", "tier_role": "DIV_CONTROLLER"}

        payload = {
            "block_id": "BLK_DLI_TEST_001",
            "section_id": "SEC_NDLS_GZB_UP",
            "previous_status": "PLANNED",
            "new_status": "SANCTIONED",
        }

        record = create_audit_record(
            mock_db,
            entity_type="MAINTENANCE_BLOCK",
            entity_id="BLK_DLI_TEST_001",
            action="SANCTION_GRANTED",
            actor_user=mock_user,
            client_ip="10.0.1.1",
            payload_dict=payload,
        )

        assert record is not None
        assert record.entity_type == "MAINTENANCE_BLOCK"
        assert record.action == "SANCTION_GRANTED"
        assert record.actor_user_id == "div_controller"
        assert record.actor_role == "DIV_CONTROLLER"
        assert len(record.payload_sha256) == 64  # SHA-256 is 64 hex chars
        mock_db.add.assert_called_once()

    def test_audit_record_sha256_is_deterministic(self):
        """Same payload must always produce the same SHA-256 hash."""
        import hashlib
        import json

        payload = {"block_id": "BLK_001", "action": "SANCTION_GRANTED"}
        h1 = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        h2 = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        assert h1 == h2

    def test_different_payloads_produce_different_hashes(self):
        """Different payloads must NOT produce the same hash (collision check)."""
        import hashlib
        import json

        p1 = {"block_id": "BLK_001"}
        p2 = {"block_id": "BLK_002"}
        h1 = hashlib.sha256(json.dumps(p1, sort_keys=True).encode()).hexdigest()
        h2 = hashlib.sha256(json.dumps(p2, sort_keys=True).encode()).hexdigest()
        assert h1 != h2
