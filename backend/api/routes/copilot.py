"""Read-only conversational operations copilot API."""

import os

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from agents.read_only_copilot import BOT_NAME, DEFAULT_MODEL, ReadOnlyOperationsCopilot
from api.routes.auth import get_current_user
from database.connection import get_db

router = APIRouter(prefix="/api/v1/copilot", tags=["Read-only Operations Copilot"])
copilot = ReadOnlyOperationsCopilot()


class CopilotQuestion(BaseModel):
    question: str = Field(min_length=2, max_length=2000)


@router.post("/chat")
def chat(
    payload: CopilotQuestion,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Answer a question using live read-only operational data."""
    return copilot.answer(payload.question, db, current_user)


@router.get("/capabilities")
def capabilities(current_user: dict = Depends(get_current_user)):
    """Expose the copilot's explicit read-only contract to the UI."""
    return {
        "bot_name": BOT_NAME,
        "read_only": True,
        "model": os.getenv("RAIL_SARTHI_MODEL", DEFAULT_MODEL),
        "tools": [
            "get_operational_snapshot",
            "get_recent_blocks",
            "get_pending_requests",
            "get_active_trains",
        ],
        "write_actions_available": [],
        "viewer_role": current_user["tier_role"],
    }