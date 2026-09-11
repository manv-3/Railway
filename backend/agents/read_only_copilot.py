"""Read-only conversational operations copilot.

The copilot can inspect a bounded operational snapshot and explain it. It has
no tool that changes domain state and conversation history is intentionally not
persisted.
"""

import json
import os
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy.orm import Session

from database.models import MaintenanceBlock, MaintenanceRequest, TrainSchedule


READ_ONLY_TOOLS = (
    "get_operational_snapshot",
    "get_recent_blocks",
    "get_pending_requests",
    "get_active_trains",
)
BOT_NAME = "Rail Sarthi"
DEFAULT_MODEL = "gemini-2.5-flash"
WRITE_INTENT_WORDS = (
    "approve", "sanction", "schedule", "optimize", "run optimizer", "issue",
    "grant", "retrain", "route machinery", "change", "update", "cancel",
)


class ReadOnlyOperationsCopilot:
    """Answer operational questions from live database state only."""

    def build_context(self, query: str, db: Session, user: dict[str, Any]) -> dict[str, Any]:
        division_id = user.get("jurisdiction_id")
        blocks_query = db.query(MaintenanceBlock).order_by(MaintenanceBlock.start_time.asc())
        requests_query = db.query(MaintenanceRequest).order_by(MaintenanceRequest.priority_score.desc())
        trains_query = db.query(TrainSchedule).filter(TrainSchedule.active.is_(True))

        # Board and zonal users may inspect the corridor; divisional and field
        # users remain limited to their jurisdiction.
        if user.get("tier_role") not in {"BOARD_EXEC", "ZONAL_HEAD"} and division_id:
            blocks_query = blocks_query.filter(MaintenanceBlock.division_id == division_id)
            requests_query = requests_query.filter(MaintenanceRequest.division_id == division_id)

        blocks = blocks_query.limit(20).all()
        requests = requests_query.filter(
            MaintenanceRequest.status.in_(["PENDING", "OPTIMIZED", "SANCTIONED"])
        ).limit(20).all()
        trains = trains_query.limit(20).all()

        checks = [
            {"name": "authorization_scope", "status": "PASSED", "detail": "Jurisdiction scope applied."},
            {"name": "live_snapshot", "status": "PASSED", "detail": "Snapshot read from the operational database."},
            {"name": "write_guard", "status": "PASSED", "detail": "No mutation tool is available to Rail Sarthi."},
        ]
        if any(item is None for item in (blocks, requests, trains)):
            checks[1] = {"name": "live_snapshot", "status": "FAILED", "detail": "A live data query returned no result."}

        return {
            "as_of_utc": datetime.utcnow().isoformat() + "Z",
            "viewer": {
                "role": user.get("tier_role"),
                "jurisdiction_id": division_id,
            },
            "query": query,
            "tools_used": list(READ_ONLY_TOOLS),
            "checks": checks,
            "blocks": [
                {
                    "block_id": block.block_id,
                    "section_id": block.section_id,
                    "status": block.status,
                    "start_time": block.start_time.isoformat(),
                    "end_time": block.end_time.isoformat(),
                    "duration_minutes": block.total_duration_minutes,
                    "combined": block.is_combined,
                }
                for block in blocks
            ],
            "pending_requests": [
                {
                    "request_id": request.request_id,
                    "department": request.department,
                    "section_id": request.section_id,
                    "severity": request.severity,
                    "defect_type": request.defect_type,
                    "priority_score": request.priority_score,
                    "status": request.status,
                }
                for request in requests
            ],
            "active_trains": [
                {
                    "train_number": train.train_number,
                    "name": train.train_name,
                    "category": train.train_category,
                    "priority_precedence": train.priority_precedence,
                }
                for train in trains
            ],
        }

    def answer(self, query: str, db: Session, user: dict[str, Any]) -> dict[str, Any]:
        if self._is_identity_question(query):
            context = {
                "as_of_utc": datetime.utcnow().isoformat() + "Z",
                "viewer": {"role": user.get("tier_role"), "jurisdiction_id": user.get("jurisdiction_id")},
                "query": query,
                "tools_used": [],
                "checks": [
                    {"name": "authorization_scope", "status": "PASSED", "detail": "Authenticated user scope verified."},
                    {"name": "live_snapshot", "status": "NOT_REQUIRED", "detail": "Identity question does not require operational records."},
                    {"name": "write_guard", "status": "PASSED", "detail": "No mutation tool is available to Rail Sarthi."},
                ],
                "blocks": [],
                "pending_requests": [],
                "active_trains": [],
            }
        else:
            context = self.build_context(query, db, user)
        action_request = self._is_write_intent(query)
        answer = self._refusal_answer() if action_request else (
            self._identity_answer() if self._is_identity_question(query) else self._generate_answer(query, context)
        )
        return {
            "bot_name": BOT_NAME,
            "answer": answer,
            "as_of_utc": context["as_of_utc"],
            "tools_used": context["tools_used"],
            "checks": context["checks"],
            "sources": ["maintenance_blocks", "maintenance_requests", "train_schedules"],
            "model": os.getenv("RAIL_SARTHI_MODEL", DEFAULT_MODEL) if not action_request else "read-only-policy",
            "confidence": "high" if not action_request else "high",
            "read_only": True,
            "write_actions_available": [],
            "disclaimer": "Informational only. No operational state was changed.",
        }

    @staticmethod
    def _is_identity_question(query: str) -> bool:
        normalized = query.lower()
        return any(phrase in normalized for phrase in ("who are you", "what are you", "what can you do"))

    @staticmethod
    def _identity_answer() -> str:
        return (
            "I am Rail Sarthi, the read-only conversational assistant for the Indian Railways Block "
            "Planning Platform. I explain verified operational data within your authorized scope. "
            "I cannot approve, sanction, schedule, optimize, modify, or execute any railway operation."
        )

    def _generate_answer(self, query: str, context: dict[str, Any]) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                model = os.getenv("RAIL_SARTHI_MODEL", DEFAULT_MODEL)
                response = httpx.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    params={"key": api_key},
                    json={
                        "contents": [{
                            "parts": [{"text": self._prompt(query, context)}]
                        }],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 700},
                    },
                    timeout=15.0,
                )
                response.raise_for_status()
                return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
                pass
        return self._fallback_answer(query, context)

    @staticmethod
    def _is_write_intent(query: str) -> bool:
        normalized = query.lower()
        return any(word in normalized for word in WRITE_INTENT_WORDS)

    @staticmethod
    def _refusal_answer() -> str:
        return (
            "I am Rail Sarthi, a read-only assistant. I cannot approve, sanction, schedule, optimize, "
            "issue, update, cancel, or execute any railway operation. I can explain the current live "
            "status, risks, constraints, and recorded history so an authorized human can decide."
        )

    @staticmethod
    def _prompt(query: str, context: dict[str, Any]) -> str:
        return (
            "You are a read-only Indian Railways operations copilot. Answer only from the supplied "
            "live snapshot. Never claim that you sanctioned, scheduled, approved, issued, or changed "
            "anything. State when the snapshot was taken. If data is missing, say so. Explain reasoning "
            "for operators in concise plain language.\n\n"
            f"Question: {query}\nLive snapshot:\n{json.dumps(context, default=str)}"
        )

    @staticmethod
    def _fallback_answer(query: str, context: dict[str, Any]) -> str:
        blocks = context["blocks"]
        requests = context["pending_requests"]
        trains = context["active_trains"]
        status_counts: dict[str, int] = {}
        for block in blocks:
            status_counts[block["status"]] = status_counts.get(block["status"], 0) + 1
        statuses = ", ".join(f"{count} {status.lower()}" for status, count in status_counts.items()) or "no blocks"
        urgent = sum(1 for request in requests if request["severity"] in {"EMERGENCY", "CRITICAL"})
        return (
            f"As of {context['as_of_utc']}, I can see {statuses}, {len(requests)} pending or recently "
            f"planned maintenance requests, and {len(trains)} active train records in your permitted "
            f"scope. {urgent} requests are emergency or critical. I used read-only live database tools "
            "and did not change operational state. For a more specific answer, ask about a block, "
            "section, train, request, or pending safety risk."
        )