"""
Redis Token-Bucket Rate Limiter Middleware - PS 26027 Railway AI Platform.
Applies per-endpoint rate limits; gracefully degrades if Redis is unavailable.
"""

import os
import time
import logging
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from database.redis_client import get_redis

logger = logging.getLogger(__name__)

# ─── Rate Limit Rules ──────────────────────────────────────────────────────────
# (path_prefix, max_requests_per_minute)
RATE_LIMIT_RULES: list[tuple[str, int]] = [
    ("/auth/login",                  10),   # Brute-force protection
    ("/api/v1/optimize/run",         15),   # Heavy compute
    ("/api/v1/simulation/what-if",   15),   # Heavy compute
    ("/api/v1/blocks",              120),   # Standard queries
    ("/api/v1/corridor",            120),   # Standard queries
    ("/api/v1/maintenance",         120),   # Standard queries
    ("/api/v1/ml",                  120),   # ML queries
]

WINDOW_SECONDS = 60


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For header from proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _get_rate_limit(path: str) -> int:
    """Return the rate limit (req/min) for a given endpoint path."""
    for prefix, limit in RATE_LIMIT_RULES:
        if path.startswith(prefix):
            return limit
    return 300  # Default: 300 req/min for unlisted endpoints


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Redis sliding-window rate limiter middleware.
    Returns HTTP 429 with Retry-After header when limits are exceeded.
    Gracefully skips rate limiting if Redis is unavailable.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for OPTIONS preflight and health/metrics endpoints
        if request.method == "OPTIONS" or request.url.path in ("/health", "/metrics", "/", "/docs", "/openapi.json"):
            return await call_next(request)

        client = get_redis()
        if client is None:
            # Graceful degradation: allow request if Redis is down
            return await call_next(request)

        client_ip = _get_client_ip(request)
        path = request.url.path
        limit = _get_rate_limit(path)
        if os.getenv("APP_ENV", "development") != "production" and path.startswith("/auth/login"):
            limit = 120
        window = WINDOW_SECONDS

        # Sliding window key: <ip>:<path_prefix>:<current_window>
        window_key = int(time.time()) // window
        cache_key = f"rate:{client_ip}:{path.split('/')[3] if path.count('/') >= 3 else path}:{window_key}"

        try:
            pipe = client.pipeline()
            pipe.incr(cache_key)
            pipe.expire(cache_key, window + 1)
            results = pipe.execute()
            current_count = results[0]

            if current_count > limit:
                retry_after = window - (int(time.time()) % window)
                logger.warning(
                    "Rate limit exceeded: IP=%s Path=%s Count=%d Limit=%d",
                    client_ip, path, current_count, limit
                )
                origin = request.headers.get("origin", "*")
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "detail": f"Too many requests. Limit is {limit} requests per minute.",
                        "retry_after_seconds": retry_after
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(time.time()) + retry_after),
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Credentials": "true",
                    }
                )

            remaining = max(0, limit - current_count)
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response

        except Exception as exc:
            logger.warning("Rate limiter error (allowing request): %s", exc)
            return await call_next(request)
