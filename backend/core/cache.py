"""
Redis Response Cache Decorator - PS 26027 Railway AI Platform.
Provides @cache_response decorator for caching FastAPI endpoint responses.
"""

import json
import hashlib
import logging
import functools
from typing import Any, Callable, Optional

from database.redis_client import get_redis

logger = logging.getLogger(__name__)


def cache_response(ttl_seconds: int = 300, prefix: str = "cache") -> Callable:
    """
    Decorator for caching endpoint responses in Redis.

    Usage:
        @cache_response(ttl_seconds=300, prefix="corridor")
        def get_corridor_stations(db: Session = Depends(get_db)):
            ...

    Args:
        ttl_seconds: Time-to-live for cached responses in seconds.
        prefix:      Cache key prefix (e.g. "corridor", "kpis").
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Build a deterministic cache key from prefix + function name + kwargs
            key_data = f"{prefix}:{func.__name__}:{json.dumps(kwargs, sort_keys=True, default=str)}"
            cache_key = f"{prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"

            client = get_redis()
            if client:
                try:
                    cached = client.get(cache_key)
                    if cached:
                        logger.debug("Cache HIT: %s", cache_key)
                        return json.loads(cached)
                except Exception as exc:
                    logger.warning("Cache GET error for key %s: %s", cache_key, exc)

            # Cache miss — call actual function
            result = func(*args, **kwargs)

            if client:
                try:
                    client.setex(cache_key, ttl_seconds, json.dumps(result, default=str))
                    logger.debug("Cache SET: %s (TTL=%ds)", cache_key, ttl_seconds)
                except Exception as exc:
                    logger.warning("Cache SET error for key %s: %s", cache_key, exc)

            return result

        return wrapper
    return decorator


def cache_invalidate_pattern(pattern: str) -> int:
    """
    Delete all Redis keys matching the given pattern.

    Args:
        pattern: Redis glob pattern, e.g. "corridor:*"

    Returns:
        Number of keys deleted.
    """
    client = get_redis()
    if client is None:
        return 0
    try:
        keys = client.keys(pattern)
        if keys:
            deleted = client.delete(*keys)
            logger.info("Cache invalidated %d keys matching pattern: %s", deleted, pattern)
            return deleted
        return 0
    except Exception as exc:
        logger.warning("Cache invalidation error for pattern %s: %s", pattern, exc)
        return 0
