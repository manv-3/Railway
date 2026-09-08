"""
Redis Client - Singleton with connection pooling for Railway AI Platform.
Provides graceful degradation when Redis is unavailable.
"""

import os
import logging
from typing import Optional

import redis
from redis import Redis
from redis.connection import ConnectionPool

logger = logging.getLogger(__name__)

_pool: Optional[ConnectionPool] = None
_client: Optional[Redis] = None


def get_redis_pool() -> ConnectionPool:
    """Create or return the Redis connection pool (singleton)."""
    global _pool
    if _pool is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6380/0")
        _pool = redis.ConnectionPool.from_url(
            redis_url,
            max_connections=20,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
            retry_on_timeout=True,
        )
    return _pool


def get_redis() -> Optional[Redis]:
    """
    Return a Redis client instance.
    Returns None if Redis is unavailable (graceful degradation).
    """
    global _client
    try:
        if _client is None:
            _client = redis.Redis(connection_pool=get_redis_pool())
        # Ping to verify connectivity
        _client.ping()
        return _client
    except (redis.ConnectionError, redis.TimeoutError) as exc:
        logger.warning("Redis unavailable: %s. Proceeding without cache/rate-limiting.", exc)
        _client = None
        return None


def redis_ping() -> bool:
    """Health check - returns True if Redis is reachable."""
    client = get_redis()
    if client is None:
        return False
    try:
        return client.ping()
    except Exception:
        return False
