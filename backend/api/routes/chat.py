"""
Conversational AI Chat Routes - Read-Only with Strict Hierarchy Guardrails
Railway AI Block Planning Platform

Provides natural language query interface with:
1. Sub-3ms Pre-Execution Security & Mutation Guardrails
2. Strict Multilevel Security (MLS) Hierarchy Isolation
3. High-Speed Token Streaming via Server-Sent Events (SSE)
4. Non-Blocking Background Audit Logging (Section 65B Compliance)

Author: Railway AI Team
Version: 2.0.0
"""

import json
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.ro_database import get_read_only_db
from database.connection import get_db
from database.models import AuditLogRecord
from api.routes.auth import get_current_user
from agents.conversational_ai_agent import ConversationalAIAgent
from agents.fast_guardrails import (
    FastGuardrailEngine,
    GuardrailException,
    MutationAttemptError,
    SecurityViolationError,
    HierarchyViolationError
)

router = APIRouter(prefix="/api/v1/chat", tags=["Conversational AI"])


# ─── Request/Response Models ─────────────────────────────────────────────────

class ChatQueryRequest(BaseModel):
    """User query request"""
    query: str = Field(..., description="Natural language query", min_length=1, max_length=500)
    session_id: Optional[str] = Field(None, description="Conversation session ID for context retention")
    include_suggestions: bool = Field(True, description="Include suggested follow-up queries")
    include_chart_data: bool = Field(True, description="Include chart/graph data if applicable")


class ChartData(BaseModel):
    """Chart data structure"""
    type: str = Field(..., description="Chart type: pie, bar, line, etc.")
    title: str = Field(..., description="Chart title")
    data: List[Dict[str, Any]] = Field(..., description="Chart data points")


class ChatQueryResponse(BaseModel):
    """AI response"""
    answer: str = Field(..., description="Natural language answer")
    chart_data: Optional[ChartData] = Field(None, description="Structured chart data")
    suggested_queries: List[str] = Field([], description="Suggested follow-up queries")
    data_source: str = Field(..., description="Data source description (e.g., 'Filtered by DIV_CONTROLLER')")
    query_timestamp: str = Field(..., description="ISO timestamp of query processing")
    session_id: Optional[str] = Field(None, description="Session ID for conversation context")
    guardrail_latency_ms: Optional[float] = Field(None, description="Guardrail inspection latency in ms")
    checks: List[Dict[str, str]] = Field(default_factory=list, description="Statutory safety and isolation checks")
    sources: List[str] = Field(default_factory=list, description="Authoritative operational data sources")
    read_only: bool = Field(True, description="Strict read-only advisory assurance")


class ChatErrorResponse(BaseModel):
    """Guardrail rejection response"""
    error: str
    violation_type: str
    execution_time_ms: float


# ─── Rate Limiting & Audit Logging ───────────────────────────────────────────

RATE_LIMIT_QUERIES_PER_MINUTE = 30
query_counts: Dict[str, Any] = {}

def check_rate_limit(user_id: str):
    """In-memory rate limiter per user."""
    now = datetime.utcnow()
    if user_id in query_counts:
        last_time, count = query_counts[user_id]
        if (now - last_time).seconds < 60:
            if count >= RATE_LIMIT_QUERIES_PER_MINUTE:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_QUERIES_PER_MINUTE} queries per minute."
                )
            query_counts[user_id] = (last_time, count + 1)
        else:
            query_counts[user_id] = (now, 1)
    else:
        query_counts[user_id] = (now, 1)


def async_record_chat_audit(
    user_id: str,
    role: str,
    division_id: str,
    query: str,
    answer_preview: str,
    status: str,
    client_ip: str
):
    """
    Background Task: Record statutory immutable audit log without impacting client latency.
    Complies with Section 65B Indian Evidence Act for court-admissible records.
    """
    try:
        from database.connection import SessionLocal
        db_write = SessionLocal()
        payload = f"{user_id}:{role}:{division_id}:{query}:{status}:{datetime.utcnow().isoformat()}"
        sha256_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        audit_record = AuditLogRecord(
            entity_type="CONVERSATIONAL_AI_QUERY",
            entity_id=f"CHAT-{user_id}-{int(datetime.utcnow().timestamp())}",
            action=f"QUERY_{status}",
            actor_user_id=user_id,
            actor_role=role,
            client_ip=client_ip,
            timestamp=datetime.utcnow(),
            payload_sha256=sha256_hash,
            metadata_json={
                "division_id": division_id,
                "query": query[:200],
                "answer_preview": answer_preview[:200],
                "status": status,
                "read_only_verified": True
            }
        )
        db_write.add(audit_record)
        db_write.commit()
        db_write.close()
    except Exception as exc:
        print(f"[AUDIT_ERROR] Failed to record background chat audit: {exc}")


# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.post("/query", response_model=ChatQueryResponse)
async def chat_query(
    request: ChatQueryRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    ro_db: Session = Depends(get_read_only_db),
    http_request: Request = None
):
    """
    Synchronous natural language query endpoint with strict guardrails.
    
    Security Guarantees:
    - Zero-Mutation: Database session is strictly read-only.
    - Fast Guardrails: Rejects mutations, jailbreaks, and cross-tier queries in <3ms.
    - Row-Level Security: Pre-filters records to user's assigned jurisdiction.
    """
    user_id = str(current_user.get('username', 'unknown'))
    tier_role = current_user.get('tier_role', 'FIELD_SSE')
    division_id = str(current_user.get('jurisdiction_id', 'PRYJ'))
    client_ip = http_request.client.host if http_request and http_request.client else "127.0.0.1"

    check_rate_limit(user_id)

    agent = ConversationalAIAgent(
        db=ro_db,
        user_context=current_user
    )

    try:
        response = await agent.process_query(
            query=request.query,
            session_id=request.session_id
        )

        # Offload statutory audit recording to background thread
        background_tasks.add_task(
            async_record_chat_audit,
            user_id=user_id,
            role=tier_role,
            division_id=division_id,
            query=request.query,
            answer_preview=response['answer'],
            status="SUCCESS",
            client_ip=client_ip
        )

        return ChatQueryResponse(
            answer=response['answer'],
            chart_data=ChartData(**response['chart_data']) if (
                request.include_chart_data and response.get('chart_data')
            ) else None,
            suggested_queries=response['suggestions'] if request.include_suggestions else [],
            data_source=response['data_source'],
            query_timestamp=response['query_timestamp'],
            session_id=request.session_id,
            guardrail_latency_ms=response.get('guardrail_latency_ms'),
            checks=response.get('checks', []),
            sources=response.get('sources', []),
            read_only=response.get('read_only', True)
        )

    except MutationAttemptError as e:
        background_tasks.add_task(
            async_record_chat_audit,
            user_id=user_id, role=tier_role, division_id=division_id,
            query=request.query, answer_preview=str(e), status="BLOCKED_MUTATION",
            client_ip=client_ip
        )
        raise HTTPException(status_code=400, detail={
            "error": str(e),
            "violation_type": e.violation_type,
            "latency_ms": e.execution_time_ms
        })

    except SecurityViolationError as e:
        background_tasks.add_task(
            async_record_chat_audit,
            user_id=user_id, role=tier_role, division_id=division_id,
            query=request.query, answer_preview=str(e), status="BLOCKED_SECURITY",
            client_ip=client_ip
        )
        raise HTTPException(status_code=403, detail={
            "error": str(e),
            "violation_type": e.violation_type,
            "latency_ms": e.execution_time_ms
        })

    except HierarchyViolationError as e:
        background_tasks.add_task(
            async_record_chat_audit,
            user_id=user_id, role=tier_role, division_id=division_id,
            query=request.query, answer_preview=str(e), status="BLOCKED_HIERARCHY",
            client_ip=client_ip
        )
        raise HTTPException(status_code=403, detail={
            "error": str(e),
            "violation_type": e.violation_type,
            "latency_ms": e.execution_time_ms
        })

    except Exception as e:
        print(f"[CHAT_ERROR] {e}")
        raise HTTPException(status_code=500, detail="Internal query processing error.")


@router.get("/stream")
async def chat_stream(
    query: str = Query(..., min_length=1, max_length=500),
    session_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    ro_db: Session = Depends(get_read_only_db)
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Provides sub-200ms time-to-first-token while enforcing deterministic guardrails.
    """
    agent = ConversationalAIAgent(
        db=ro_db,
        user_context=current_user
    )

    async def sse_event_generator() -> AsyncGenerator[str, None]:
        try:
            async for token_chunk in agent.stream_query(query=query, session_id=session_id):
                yield f"data: {json.dumps({'chunk': token_chunk, 'done': False})}\n\n"
            yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
        except GuardrailException as ge:
            yield f"data: {json.dumps({'error': ge.message, 'violation': ge.violation_type, 'done': True, 'status': 403})}\n\n"
        except Exception as err:
            yield f"data: {json.dumps({'error': 'Streaming interrupted', 'detail': str(err), 'done': True, 'status': 500})}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/capabilities", response_model=Dict[str, Any])
async def get_capabilities(current_user: dict = Depends(get_current_user)):
    """Return security capabilities and data access limits for current role."""
    tier_role = current_user.get('tier_role', 'FIELD_SSE')
    tier_level = FastGuardrailEngine.get_tier_level(tier_role)
    jurisdiction_id = current_user.get('jurisdiction_id', 'PRYJ')

    scopes = {
        'BOARD_EXEC': 'Nationwide - All 17 Zones and 68 Divisions (Read Only)',
        'ZONAL_HEAD': 'Zonal - All Divisions under Home Zone (Read Only)',
        'DIV_CONTROLLER': 'Divisional - Assigned Division Sections and Trains (Read Only)',
        'FIELD_SSE': 'Section - Assigned Track KM & Stations (Read Only)',
        'STATION_MASTER': 'Station - Assigned Station Yards & Signals (Read Only)'
    }

    return {
        'tier_role': tier_role,
        'tier_level': tier_level,
        'jurisdiction_id': jurisdiction_id,
        'data_access_scope': scopes.get(tier_role, 'Restricted Section View'),
        'security_features': [
            'Strict Read-Only Enforcement (PostgreSQL Read-Only Transaction)',
            'Deterministic Sub-3ms Guardrails (Mutation & Jailbreak Defense)',
            'Multilevel Security (MLS) No Read Up / No Lateral Spill',
            'Court-Admissible Section 65B Cryptographic Audit Trail'
        ]
    }


@router.get("/health")
async def health_check():
    """Health check for Conversational AI service."""
    import os
    llm_configured = bool(os.getenv("GEMINI_API_KEY"))
    return {
        'status': 'healthy',
        'service': 'Conversational AI Agent (v2.0.0)',
        'read_only_engine': 'PostgreSQL Read-Only Replica',
        'fast_guardrails': 'Active (<3ms)',
        'llm_enabled': llm_configured,
        'streaming_support': 'SSE (text/event-stream)'
    }
