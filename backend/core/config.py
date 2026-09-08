"""
Production Configuration Module - PS 26027 Railway AI Platform
Enforces required environment variables; process exits fatally if missing in production.
"""

import os
import sys
import logging
import secrets

logger = logging.getLogger(__name__)


def get_required_env(key: str, fatal: bool = True) -> str:
    """
    Retrieve a required environment variable.
    In production (APP_ENV=production), missing variables cause a fatal exit.
    In development, a warning is logged and a random fallback is generated.
    """
    value = os.getenv(key)
    if value:
        return value

    app_env = os.getenv("APP_ENV", "development")

    if app_env == "production" and fatal:
        logger.critical(
            "FATAL: Required environment variable '%s' is missing. "
            "Cannot start in production mode without it. Exiting.", key
        )
        sys.exit(1)
    else:
        # Development only: generate a random fallback and warn loudly
        fallback = secrets.token_hex(32)
        logger.warning(
            "WARNING: Environment variable '%s' is not set. "
            "Using a randomly generated value for this session only. "
            "This is NOT safe for production!", key
        )
        return fallback


# ─── Application Environment ──────────────────────────────────────────────────
APP_ENV = os.getenv("APP_ENV", "development")
IS_PRODUCTION = APP_ENV == "production"

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://railway:railway123@localhost:5433/railway_ai"
)
if IS_PRODUCTION and not os.getenv("DATABASE_URL"):
    logger.critical("FATAL: DATABASE_URL must be set in production. Exiting.")
    sys.exit(1)

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6380/0")

# ─── JWT / Security ───────────────────────────────────────────────────────────
SECRET_KEY: str = get_required_env("SECRET_KEY", fatal=IS_PRODUCTION)
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

# Short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# ─── Rate Limits ──────────────────────────────────────────────────────────────
RATE_LIMIT_AUTH: int = int(os.getenv("RATE_LIMIT_AUTH", "10"))           # /auth/login per min
RATE_LIMIT_OPTIMIZER: int = int(os.getenv("RATE_LIMIT_OPTIMIZER", "15")) # /optimize per min
RATE_LIMIT_QUERY: int = int(os.getenv("RATE_LIMIT_QUERY", "120"))        # /blocks /corridor per min

# ─── Gemini LLM ───────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
