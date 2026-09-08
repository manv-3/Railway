"""
FastAPI Application Entry Point - PS 26027 Railway AI Block Planning Platform
Production-ready configuration with:
- Redis rate limiting middleware (V3-02)
- Prometheus /metrics endpoint (V3-09)
- WebSocket real-time corridor feed
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import json
import os

from api.websocket_manager import manager

from api.routes import (
    corridor_router,
    maintenance_router,
    optimization_router,
    blocks_router,
    simulation_router,
    ml_router,
    telemetry_router,
)
from api.routes.auth import router as auth_router
from database.connection import engine, Base
from database import models

# Ensure all statutory and operational tables are initialized
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

# ─── Prometheus Instrumentation ───────────────────────────────────────────────
try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from prometheus_fastapi_instrumentator import Instrumentator
    PROMETHEUS_ENABLED = True
except ImportError:
    PROMETHEUS_ENABLED = False

# ─── Rate Limiter Middleware ──────────────────────────────────────────────────
try:
    from core.rate_limiter import RateLimiterMiddleware
    RATE_LIMITER_ENABLED = True
except ImportError:
    RATE_LIMITER_ENABLED = False

app = FastAPI(
    title="Indian Railways AI Block Planning Platform",
    description=(
        "AI-Powered Automatic Block Planning to Maximize Asset Availability "
        "for Train Operations (PS 26027/26028). "
        "Safety-critical system adhering to G&SR statutory protocols."
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── Rate Limiting Middleware (V3-02) ─────────────────────────────────────────
if RATE_LIMITER_ENABLED:
    app.add_middleware(RateLimiterMiddleware)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(corridor_router)
app.include_router(maintenance_router)
app.include_router(optimization_router)
app.include_router(blocks_router)
app.include_router(simulation_router)
app.include_router(ml_router)
app.include_router(telemetry_router)

# ─── Prometheus FastAPI Instrumentator (V3-09) ────────────────────────────────
if PROMETHEUS_ENABLED:
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# ─── WebSocket Endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws/corridor")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket feed for corridor events.
    Broadcasts: BLOCK_SANCTIONED, DISCONNECTION_ISSUED, PTW_GRANTED,
                TRACK_FIT_ISSUED, OPTIMIZATION_COMPLETED, SOLVER_PROGRESS
    """
    from core.metrics import railway_websocket_clients
    await manager.connect(websocket)
    railway_websocket_clients.inc()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"event": "ACK", "client_data": data}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        railway_websocket_clients.dec()

# ─── Health & Status Endpoints ────────────────────────────────────────────────
@app.get("/")
def root():
    """Platform root — basic status information."""
    return {
        "platform": "Indian Railways AI Block Planning Platform (PS 26027)",
        "version": "3.0.0",
        "status": "OPERATIONAL",
        "active_corridor": "New Delhi (NDLS) - Ghaziabad (GZB) - Kanpur Central (CNB)",
        "docs_url": "/docs",
        "metrics_url": "/metrics",
    }


@app.get("/health")
def health_check():
    """Kubernetes/Docker health probe endpoint."""
    from database.redis_client import redis_ping
    redis_ok = redis_ping()
    return {
        "status": "healthy",
        "service": "railway_backend",
        "version": "3.0.0",
        "redis": "connected" if redis_ok else "unavailable",
    }
