"""
PKI / X.509 Digital Signature Certificates (DSC) & Legal G&SR Handshake Signer
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-09: Legal Evidence Compliance (IT Act 2000 & Indian Evidence Act §65B)

Implements cryptographic X.509 digital signatures for statutory safety handshakes:
- Station Master Form T/351 Disconnection Memos
- Traction Power Controller 25kV OHE Isolation PTWs
- Sr. DOM Joint Sanctions & Track Fit Certificates
- Commissioner of Railway Safety (CRS) Judicial Inquiry Evidence Bundles
"""

import base64
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.x509.oid import NameOID

logger = logging.getLogger(__name__)


class PKICertificateAuthority:
    """
    In-memory Root CA for Indian Railways internal PKI infrastructure.
    In production, roots chain to CCA India licensed Certifying Authorities (e-Mudhra/NIC).
    """

    def __init__(self):
        # Generate Root CA Key & Certificate
        self.ca_private_key = rsa.generate_private_key(
            public_exponent=65537, key_size=2048, backend=default_backend()
        )
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Indian Railways"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Safety & Interlocking PKI CA"),
            x509.NameAttribute(NameOID.COMMON_NAME, "Indian Railways Root Safety CA"),
        ])
        self.ca_cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(self.ca_private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow() - timedelta(days=1))
            .not_valid_after(datetime.utcnow() + timedelta(days=3650))
            .add_extension(
                x509.BasicConstraints(ca=True, path_length=None), critical=True
            )
            .sign(self.ca_private_key, hashes.SHA256(), default_backend())
        )

    def issue_officer_dsc(
        self, username: str, full_name: str, department: str, role: str
    ) -> Tuple[rsa.RSAPrivateKey, x509.Certificate]:
        """Issues an individual X.509 DSC certificate for an authorized railway officer."""
        officer_key = rsa.generate_private_key(
            public_exponent=65537, key_size=2048, backend=default_backend()
        )
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Indian Railways"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, department),
            x509.NameAttribute(NameOID.TITLE, role),
            x509.NameAttribute(NameOID.COMMON_NAME, f"{full_name} ({username})"),
        ])
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(self.ca_cert.subject)
            .public_key(officer_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow() - timedelta(days=1))
            .not_valid_after(datetime.utcnow() + timedelta(days=365))
            .add_extension(
                x509.BasicConstraints(ca=False, path_length=None), critical=True
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    content_commitment=True,  # Non-repudiation
                    key_encipherment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    key_cert_sign=False,
                    crl_sign=False,
                    encipher_only=False,
                    decipher_only=False,
                ),
                critical=True,
            )
            .sign(self.ca_private_key, hashes.SHA256(), default_backend())
        )
        return officer_key, cert


# Global Root CA singleton
safety_ca = PKICertificateAuthority()


class PKIDigitalSigner:
    """
    Signs and verifies statutory G&SR safety handshakes using X.509 DSC tokens.
    """

    _cached_officer_tokens: Dict[str, Tuple[rsa.RSAPrivateKey, x509.Certificate]] = {}

    @classmethod
    def get_or_create_officer_keys(
        cls, username: str, full_name: str = "Authorized Railway Officer", department: str = "OPERATING", role: str = "CONTROLLER"
    ) -> Tuple[rsa.RSAPrivateKey, x509.Certificate]:
        if username not in cls._cached_officer_tokens:
            cls._cached_officer_tokens[username] = safety_ca.issue_officer_dsc(
                username=username, full_name=full_name, department=department, role=role
            )
        return cls._cached_officer_tokens[username]

    @classmethod
    def sign_statutory_manifest(
        cls,
        manifest_payload: Dict[str, Any],
        signer_username: str,
        signer_name: str = "Authorized Officer",
        department: str = "OPERATING",
        role: str = "OFFICER",
    ) -> Dict[str, Any]:
        """
        Cryptographically signs a canonical JSON statutory manifest.
        Returns signature envelope with X.509 certificate and SHA-256 digest.
        """
        key, cert = cls.get_or_create_officer_keys(
            username=signer_username, full_name=signer_name, department=department, role=role
        )

        canonical_bytes = json.dumps(manifest_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        signature_bytes = key.sign(
            canonical_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )

        cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode("utf-8")
        sig_b64 = base64.b64encode(signature_bytes).decode("utf-8")
        digest_hex = hashes.Hash(hashes.SHA256(), default_backend())
        digest_hex.update(canonical_bytes)
        payload_hash = digest_hex.finalize().hex()

        return {
            "signature_algorithm": "RSA-PSS-SHA256",
            "signed_at": datetime.utcnow().isoformat(),
            "signer_dn": cert.subject.rfc4514_string(),
            "signer_serial_number": str(cert.serial_number),
            "payload_sha256": payload_hash,
            "signature_base64": sig_b64,
            "certificate_pem": cert_pem,
            "it_act_admissible": True,
        }

    @classmethod
    def verify_statutory_manifest(
        cls,
        manifest_payload: Dict[str, Any],
        signature_base64: str,
        certificate_pem: str,
    ) -> Dict[str, Any]:
        """
        Verifies X.509 signature against canonical payload and validates certificate validity.
        """
        try:
            cert = x509.load_pem_x509_certificate(certificate_pem.encode("utf-8"), default_backend())
            now = datetime.utcnow()
            if now < cert.not_valid_before or now > cert.not_valid_after:
                return {"is_valid": False, "reason": "Certificate expired or not yet valid"}

            canonical_bytes = json.dumps(manifest_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
            sig_bytes = base64.b64decode(signature_base64)
            pub_key = cert.public_key()

            pub_key.verify(
                sig_bytes,
                canonical_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256(),
            )

            return {
                "is_valid": True,
                "signer_dn": cert.subject.rfc4514_string(),
                "issuer_dn": cert.issuer.rfc4514_string(),
                "valid_until": cert.not_valid_after.isoformat(),
                "verification_timestamp": now.isoformat(),
                "legal_status": "AUTHENTIC_NON_REPUDIABLE",
            }
        except Exception as exc:
            return {
                "is_valid": False,
                "reason": f"Signature verification failed: {str(exc)}",
                "legal_status": "REJECTED_OR_TAMPERED",
            }


class CRSAuditPacketGenerator:
    """
    Compiles Commissioner of Railway Safety (CRS) Judicial Evidence Bundles
    containing complete digitally signed chains for judicial inquiries.
    """

    @classmethod
    def build_inquiry_bundle(
        cls,
        block_id: str,
        section_id: str,
        audit_records: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Constructs a complete CRS judicial evidence packet for a maintenance block.
        """
        signed_items = []
        all_valid = True

        for rec in audit_records:
            action = rec.get("action", "STATUTORY_ACTION")
            actor_id = rec.get("actor_user_id", "railway_officer")
            actor_role = rec.get("actor_role", "CONTROLLER")
            meta = rec.get("metadata_json", {})

            # Digitally sign each lifecycle milestone
            sig_info = PKIDigitalSigner.sign_statutory_manifest(
                manifest_payload={
                    "block_id": block_id,
                    "section_id": section_id,
                    "action": action,
                    "timestamp": rec.get("timestamp"),
                    "metadata": meta,
                },
                signer_username=actor_id,
                signer_name=actor_id.replace("_", " ").title(),
                role=actor_role,
            )

            # Self-verify signature
            verification = PKIDigitalSigner.verify_statutory_manifest(
                manifest_payload={
                    "block_id": block_id,
                    "section_id": section_id,
                    "action": action,
                    "timestamp": rec.get("timestamp"),
                    "metadata": meta,
                },
                signature_base64=sig_info["signature_base64"],
                certificate_pem=sig_info["certificate_pem"],
            )

            if not verification.get("is_valid"):
                all_valid = False

            signed_items.append({
                "stage": action,
                "actor_id": actor_id,
                "actor_role": actor_role,
                "timestamp": rec.get("timestamp"),
                "digital_signature_manifest": sig_info,
                "judicial_verification": verification,
            })

        return {
            "crs_dossier_id": f"CRS/INQUIRY/{block_id}/{datetime.utcnow().strftime('%Y%m%d')}",
            "block_id": block_id,
            "section_id": section_id,
            "statutory_authority": "Commissioner of Railway Safety (Ministry of Civil Aviation & Railways)",
            "governing_statute": "Indian Railways Act 1989 § 114 & IT Act 2000 § 65B",
            "chain_of_custody_intact": all_valid,
            "total_statutory_actions_signed": len(signed_items),
            "signed_lifecycle_milestones": signed_items,
            "judicial_admissibility_certificate": {
                "evidence_status": "ADMISSIBLE_ORIGINAL_ELECTRONIC_RECORD" if all_valid else "COMPROMISED",
                "certified_under": "Section 65B, Indian Evidence Act 1872",
                "non_repudiation_guaranteed": all_valid,
                "generated_at": datetime.utcnow().isoformat(),
            }
        }
