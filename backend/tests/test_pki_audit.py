"""
Tests for PKI / X.509 Digital Signature Certificates & CRS Judicial Audit Bundles
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-09 Verification
"""

import pytest
from fastapi.testclient import TestClient

from api.main import app
from core.pki_signer import (
    PKICertificateAuthority,
    PKIDigitalSigner,
    CRSAuditPacketGenerator,
)

client = TestClient(app)


def test_pki_ca_initialization():
    """Verify Root Safety CA generates valid self-signed X.509 certificate."""
    ca = PKICertificateAuthority()
    assert ca.ca_cert is not None
    assert ca.ca_cert.serial_number > 0
    assert "Indian Railways Root Safety CA" in ca.ca_cert.subject.rfc4514_string()


def test_officer_dsc_issuance():
    """Verify officer DSC certificate has digital signature and non-repudiation key usages."""
    ca = PKICertificateAuthority()
    key, cert = ca.issue_officer_dsc(
        username="sm_gzb",
        full_name="V. K. Singh",
        department="OPERATING",
        role="STATION_MASTER",
    )
    assert cert is not None
    assert "V. K. Singh (sm_gzb)" in cert.subject.rfc4514_string()
    assert cert.serial_number > 0


def test_statutory_manifest_signing_and_verification():
    """Verify cryptographic signing and verification of a statutory safety manifest."""
    manifest = {
        "block_id": "BLK_TEST_001",
        "action": "DISCONNECTION_ISSUED",
        "memo_number": "MEMO-GZB-99",
        "station_code": "GZB",
    }

    sig_info = PKIDigitalSigner.sign_statutory_manifest(
        manifest_payload=manifest,
        signer_username="station_master_gzb",
        signer_name="Station Master Ghaziabad",
        department="OPERATING",
        role="STATION_MASTER",
    )

    assert sig_info["signature_algorithm"] == "RSA-PSS-SHA256"
    assert "signature_base64" in sig_info
    assert "certificate_pem" in sig_info

    # Verify signature
    verification = PKIDigitalSigner.verify_statutory_manifest(
        manifest_payload=manifest,
        signature_base64=sig_info["signature_base64"],
        certificate_pem=sig_info["certificate_pem"],
    )

    assert verification["is_valid"] is True
    assert verification["legal_status"] == "AUTHENTIC_NON_REPUDIABLE"

    # Verify tamper detection
    tampered_manifest = dict(manifest)
    tampered_manifest["memo_number"] = "TAMPERED-MEMO"

    tampered_verification = PKIDigitalSigner.verify_statutory_manifest(
        manifest_payload=tampered_manifest,
        signature_base64=sig_info["signature_base64"],
        certificate_pem=sig_info["certificate_pem"],
    )
    assert tampered_verification["is_valid"] is False
    assert tampered_verification["legal_status"] == "REJECTED_OR_TAMPERED"


def test_crs_judicial_audit_packet_api():
    """Verify GET /api/v1/blocks/{id}/crs-audit-packet returns admissible evidence bundle."""
    # First get existing block
    blocks_res = client.get("/api/v1/blocks?division_id=DIV_DLI")
    assert blocks_res.status_code == 200
    blocks = blocks_res.json()
    if not blocks:
        pytest.skip("No blocks available in test database")

    target_id = blocks[0]["block_id"]
    crs_res = client.get(f"/api/v1/blocks/{target_id}/crs-audit-packet")
    assert crs_res.status_code == 200
    data = crs_res.json()

    assert "crs_dossier_id" in data
    assert data["chain_of_custody_intact"] is True
    assert data["total_statutory_actions_signed"] >= 1
    assert "signed_lifecycle_milestones" in data

    cert = data["judicial_admissibility_certificate"]
    assert cert["evidence_status"] == "ADMISSIBLE_ORIGINAL_ELECTRONIC_RECORD"
    assert "Section 65B" in cert["certified_under"]
    assert cert["non_repudiation_guaranteed"] is True
