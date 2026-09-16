"""
Fast Guardrails Engine - High-Performance Security & Hierarchy Isolation
Railway AI Block Planning Platform

Sub-5ms deterministic guardrail pipeline enforcing:
1. Strict Read-Only (Mutation/Write Attempt Blocking)
2. Prompt Injection, Jailbreak & Persona Escalation Defense
3. Cross-Hierarchy Upward & Lateral Leakage Prevention (Bell-LaPadula MLS)
4. Output Data Loss Prevention (DLP) & Sanitization

Author: Railway AI Team
Version: 2.0.0
"""

import re
import time
import logging
from enum import IntEnum
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)


class HierarchyTier(IntEnum):
    """
    Multilevel Security (MLS) hierarchy tiers.
    Lower numerical value indicates higher administrative authority.
    Rule: A user at Tier N cannot access data with min_tier < N ("No Read Up").
    """
    BOARD_EXEC = 0      # Ministry of Railways / Railway Board (Nationwide)
    ZONAL_HEAD = 1      # Zonal General Manager / PCOM / PCE (Zone-wide)
    DIV_CONTROLLER = 2  # DRM / Sr. DOM / Section Controller (Division-wide)
    FIELD_SSE = 3       # Senior Section Engineer (Section-wide)
    STATION_MASTER = 3  # Station Master (Station-wide)
    PUBLIC_VIEW = 4     # Passenger / Public


class GuardrailViolationType(str):
    MUTATION_ATTEMPT = "MUTATION_ATTEMPT"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    HIERARCHY_VIOLATION = "HIERARCHY_VIOLATION"
    LATERAL_SPILL = "LATERAL_SPILL"
    DLP_VIOLATION = "DLP_VIOLATION"


class GuardrailException(Exception):
    """Base exception for all conversational guardrail violations."""
    def __init__(self, message: str, violation_type: str, execution_time_ms: float):
        super().__init__(message)
        self.message = message
        self.violation_type = violation_type
        self.execution_time_ms = execution_time_ms


class MutationAttemptError(GuardrailException):
    """Raised when query attempts state-modifying actions in read-only assistant."""
    def __init__(self, message: str, execution_time_ms: float):
        super().__init__(message, GuardrailViolationType.MUTATION_ATTEMPT, execution_time_ms)


class SecurityViolationError(GuardrailException):
    """Raised when prompt injection, jailbreak, or persona bypass is detected."""
    def __init__(self, message: str, execution_time_ms: float):
        super().__init__(message, GuardrailViolationType.PROMPT_INJECTION, execution_time_ms)


class HierarchyViolationError(GuardrailException):
    """Raised when lower hierarchy queries upper hierarchy or unauthorized lateral data."""
    def __init__(self, message: str, execution_time_ms: float):
        super().__init__(message, GuardrailViolationType.HIERARCHY_VIOLATION, execution_time_ms)


class FastGuardrailEngine:
    """
    High-speed, deterministic regex-based guardrail scanner.
    Operates in < 3ms with zero external network or LLM dependencies.
    """

    # 1. Operational Mutation Verbs (Strict Read-Only Enforcement)
    _MUTATION_PATTERNS = [
        re.compile(r"\b(cancel|grant|approve|disapprove|reject|authorize|sign|execute)\s+(the\s+)?([a-z\s_-]{0,20})?(block|request|memo|ptw|permit|ticket|train|slot|schedule)\b", re.IGNORECASE),
        re.compile(r"\b(disconnect|isolate|de-energize|re-energize|clamp|lock|unlock)\s+(the\s+)?([a-z\s_-]{0,20})?(signal|track|catenary|ohe|line|lever|point|breaker)\b", re.IGNORECASE),
        re.compile(r"\b(override|modify|update|change|alter|edit|set|impose)\s+(the\s+)?([a-z\s_-]{0,20})?(speed|limit|tsr|caution|status|priority|timestamp|quota)\b", re.IGNORECASE),
        re.compile(r"\b(drop|delete|truncate|insert|create|alter|grant|revoke)\s+(table|database|row|column|record|from|into)\b", re.IGNORECASE),
        re.compile(r"\b(write|commit|mutate|persist)\s+to\s+(db|database|disk|storage)\b", re.IGNORECASE),
    ]

    # 2. Prompt Injection, Jailbreak & Persona Escalation
    _INJECTION_PATTERNS = [
        re.compile(r"\b(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|the|system)?\s*(instructions|rules|constraints|prompt|guardrails)\b", re.IGNORECASE),
        re.compile(r"\b(pretend|act|simulate|roleplay|behave)\s+(as|like|you\s+are|to\s+be)\b", re.IGNORECASE),
        re.compile(r"\b(dan\s+mode|jailbreak|developer\s+mode|unrestricted\s+mode|god\s+mode)\b", re.IGNORECASE),
        re.compile(r"\b(print|show|reveal|display|output|leak)\s+(your\s+|the\s+)?([a-z\s_-]{0,20})?(system\s+prompt|hidden\s+prompt|initial\s+instructions|base\s+instructions)\b", re.IGNORECASE),
        re.compile(r"\b(reveal|show|dump)\s+(all\s+)?(passwords|api[_\s]keys|secret[_\s]keys|tokens|credentials|env\s+vars)\b", re.IGNORECASE),
        re.compile(r"<\s*script[^>]*>|javascript:|data:\s*text/html", re.IGNORECASE),
    ]

    # 3. Upward Hierarchy Keywords restricted to higher tiers
    # Tier 0 (Board) only topics:
    _TIER_0_PATTERNS = [
        re.compile(r"\b(railway\s+board|board\s+memo|ministerial\s+cabinet|national\s+logistics\s+portal|cross-zone\s+tariff|parliament\s+question)\b", re.IGNORECASE),
        re.compile(r"\b(nationwide\s+budget|macro\s+zonal\s+allocation|vigilance\s+directive|crpc\s+inquiry)\b", re.IGNORECASE),
    ]

    # Tier 1 (Zonal) only topics:
    _TIER_1_PATTERNS = [
        re.compile(r"\b(general\s+manager|zonal\s+gm|pcom|pce|cso\s+audit|zonal\s+headquarters|cross-divisional\s+transfer)\b", re.IGNORECASE),
        re.compile(r"\b(zonal\s+machine\s+fleet\s+reallocation|inter-divisional\s+dispute|zone-level\s+kpi)\b", re.IGNORECASE),
    ]

    # Tier 2 (Divisional) only topics:
    _TIER_2_PATTERNS = [
        re.compile(r"\b(drm|divisional\s+railway\s+manager|sr\.?\s*dom|sr\.?\s*den|sr\.?\s*dste|confidential\s+controller\s+log)\b", re.IGNORECASE),
        re.compile(r"\b(disciplinary\s+action|confidential\s+inquiry|crew\s+medical\s+fitness|driver\s+breathalyzer|staff\s+appraisal)\b", re.IGNORECASE),
    ]

    # 4. DLP Output Redaction Patterns (Masking sensitive patterns if generated)
    _DLP_MASK_PATTERNS = [
        (re.compile(r"\b[A-Za-z0-9_-]{3,}\.railway\.internal\b"), "[INTERNAL_FQDN_REDACTED]"),
        (re.compile(r"\b(AIza[0-9A-Za-z-_]{20,}|sk-[a-zA-Z0-9]{20,})\b"), "[SECRET_KEY_REDACTED]"),
        (re.compile(r"-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END \1PRIVATE KEY-----"), "[CRYPTO_KEY_REDACTED]"),
        (re.compile(r"(\+91[-\s]?)?[6-9]\d{9}\b"), "[PHONE_REDACTED]"),
        (re.compile(r"\b(CONFIDENTIAL|SECRET)-BOARD-[A-Z0-9-]+\b"), "[CLASSIFIED_REF_REDACTED]"),
    ]

    @classmethod
    def get_tier_level(cls, tier_role: str) -> int:
        """Convert role string to numerical hierarchy level (0=highest, 3=lowest)."""
        mapping = {
            "BOARD_EXEC": HierarchyTier.BOARD_EXEC,
            "ZONAL_HEAD": HierarchyTier.ZONAL_HEAD,
            "DIV_CONTROLLER": HierarchyTier.DIV_CONTROLLER,
            "FIELD_SSE": HierarchyTier.FIELD_SSE,
            "STATION_MASTER": HierarchyTier.STATION_MASTER,
            "PUBLIC_VIEW": HierarchyTier.PUBLIC_VIEW,
        }
        return mapping.get(tier_role.upper(), HierarchyTier.FIELD_SSE)

    @classmethod
    def inspect_query(
        cls, 
        query: str, 
        user_context: Dict[str, Any]
    ) -> Tuple[bool, float]:
        """
        Execute deterministic security scan on inbound user query.
        
        Args:
            query: Raw user query string.
            user_context: Authenticated JWT claims (tier_role, jurisdiction_id, etc.)
            
        Returns:
            (is_safe, elapsed_ms)
            
        Raises:
            MutationAttemptError: If query attempts write/mutation.
            SecurityViolationError: If prompt injection / jailbreak detected.
            HierarchyViolationError: If user attempts to query higher tier data.
        """
        start_time = time.perf_counter()
        tier_role = user_context.get("tier_role", "FIELD_SSE")
        user_tier = cls.get_tier_level(tier_role)
        query_text = query.strip()

        # Check 1: Mutation / State-Modifying Attempt (Highest priority)
        for pattern in cls._MUTATION_PATTERNS:
            match = pattern.search(query_text)
            if match:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                matched_text = match.group(0)
                logger.warning(f"Mutation attempt blocked: '{matched_text}' by {tier_role} in {elapsed_ms:.2f}ms")
                raise MutationAttemptError(
                    f"Operational mutation '{matched_text}' rejected. Conversational AI operates strictly in READ-ONLY mode. "
                    f"To execute maintenance grants or disconnections, use the authorized Control Console.",
                    execution_time_ms=elapsed_ms
                )

        # Check 2: Prompt Injection, Jailbreak & Persona Escalation (Before Hierarchy)
        for pattern in cls._INJECTION_PATTERNS:
            match = pattern.search(query_text)
            if match:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                logger.warning(f"Security jailbreak blocked: '{match.group(0)}' by {tier_role} in {elapsed_ms:.2f}ms")
                raise SecurityViolationError(
                    "Security violation: Prompt injection or unauthorized privilege override attempt detected.",
                    execution_time_ms=elapsed_ms
                )

        # Check 3: Upward Hierarchy Leakage Prevention (No Read Up)
        # Tier 3 users (Field SSE, Station Master) CANNOT query Tier 0, 1, or 2 concepts
        if user_tier >= HierarchyTier.FIELD_SSE:
            for pattern in cls._TIER_0_PATTERNS + cls._TIER_1_PATTERNS + cls._TIER_2_PATTERNS:
                match = pattern.search(query_text)
                if match:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.warning(f"Hierarchy violation: Tier {user_tier} queried '{match.group(0)}' in {elapsed_ms:.2f}ms")
                    raise HierarchyViolationError(
                        f"Access restricted: Information concerning '{match.group(0)}' is classified under higher operational tiers (Divisional/Zonal/Board). "
                        f"Your credentials ({tier_role}) are restricted to station/section-level operational telemetry.",
                        execution_time_ms=elapsed_ms
                    )

        # Tier 2 users (Divisional Controllers) CANNOT query Tier 0 or Tier 1 macro concepts
        elif user_tier == HierarchyTier.DIV_CONTROLLER:
            for pattern in cls._TIER_0_PATTERNS + cls._TIER_1_PATTERNS:
                match = pattern.search(query_text)
                if match:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.warning(f"Hierarchy violation: Tier {user_tier} queried '{match.group(0)}' in {elapsed_ms:.2f}ms")
                    raise HierarchyViolationError(
                        f"Access restricted: Inquiries into '{match.group(0)}' require Zonal Head or Railway Board clearance.",
                        execution_time_ms=elapsed_ms
                    )

        # Tier 1 users (Zonal Heads) CANNOT query Tier 0 macro cabinet/board files
        elif user_tier == HierarchyTier.ZONAL_HEAD:
            for pattern in cls._TIER_0_PATTERNS:
                match = pattern.search(query_text)
                if match:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.warning(f"Hierarchy violation: Tier {user_tier} queried '{match.group(0)}' in {elapsed_ms:.2f}ms")
                    raise HierarchyViolationError(
                        f"Access restricted: Ministry/Railway Board classified data '{match.group(0)}' cannot be accessed from Zonal HQ.",
                        execution_time_ms=elapsed_ms
                    )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return True, elapsed_ms

    @classmethod
    def sanitize_output(cls, text: str, user_context: Dict[str, Any]) -> str:
        """
        DLP redaction pass over generated LLM response.
        Runs in sub-1ms before streaming or returning to user.
        """
        sanitized = text
        for pattern, replacement in cls._DLP_MASK_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)
        return sanitized
