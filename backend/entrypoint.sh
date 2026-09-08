#!/bin/bash
# ============================================================================
# Production Entrypoint - PS 26027 Railway AI Block Planning Platform
# Runs Alembic migrations then starts Uvicorn server
# ============================================================================

set -e

echo "=============================================="
echo "PS 26027 - Railway AI Block Planning Platform"
echo "Environment: ${APP_ENV:-development}"
echo "=============================================="

# Wait for PostgreSQL to be ready
echo "[1/3] Waiting for PostgreSQL..."
for i in {1..30}; do
    python -c "
import sys, os, time
try:
    import psycopg2
    conn = psycopg2.connect(os.environ.get('DATABASE_URL', ''))
    conn.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" && break || {
        echo "  PostgreSQL not ready yet (attempt $i/30)..."
        sleep 2
    }
done

# Run Alembic migrations (V3-01 - P0)
echo "[2/3] Running Alembic database migrations..."
alembic upgrade head
echo "  Migrations complete."

# Start Uvicorn (with multiple workers in production)
echo "[3/3] Starting FastAPI server..."
if [ "${APP_ENV}" = "production" ]; then
    exec uvicorn api.main:app \
        --host 0.0.0.0 \
        --port "${API_PORT:-8000}" \
        --workers "${UVICORN_WORKERS:-4}" \
        --log-level info \
        --access-log
else
    exec uvicorn api.main:app \
        --host 0.0.0.0 \
        --port "${API_PORT:-8000}" \
        --reload \
        --log-level debug
fi
