#!/bin/bash
# ============================================================================
# Production Entrypoint - PS 26027 Railway AI Block Planning Platform
# Runs Alembic migrations then starts Uvicorn server
# ============================================================================

set -e

# If arguments passed, execute them directly (e.g. Celery workers)
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

PORT_TO_USE="${PORT:-${API_PORT:-8000}}"

echo "=============================================="
echo "PS 26027 - Railway AI Block Planning Platform"
echo "Environment: ${APP_ENV:-development}"
echo "Port: ${PORT_TO_USE}"
echo "=============================================="

# Wait for PostgreSQL to be ready (if DATABASE_URL is set)
if [ -n "${DATABASE_URL}" ]; then
    echo "[1/3] Waiting for PostgreSQL..."
    for i in {1..30}; do
        python -c "
import sys, os
try:
    import psycopg2
    url = os.environ.get('DATABASE_URL', '')
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    conn = psycopg2.connect(url)
    conn.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" && break || {
            echo "  PostgreSQL not ready yet (attempt $i/30)..."
            sleep 2
        }
    done

    # Run Alembic migrations or create tables if fresh DB
    echo "[2/3] Running database migrations & initialization..."
    alembic upgrade head || python -c "from database.connection import engine, Base; import database.models; Base.metadata.create_all(bind=engine)"
    python scripts/seed_all_data.py || echo "  Seeding skipped or already populated."
    echo "  Database ready."
else
    echo "DATABASE_URL not set; skipping database initialization."
fi

# Start Uvicorn (with multiple workers in production)
echo "[3/3] Starting FastAPI server on port ${PORT_TO_USE}..."
if [ "${APP_ENV}" = "production" ]; then
    exec uvicorn api.main:app \
        --host 0.0.0.0 \
        --port "${PORT_TO_USE}" \
        --workers "${UVICORN_WORKERS:-2}" \
        --log-level info \
        --access-log
else
    exec uvicorn api.main:app \
        --host 0.0.0.0 \
        --port "${PORT_TO_USE}" \
        --reload \
        --log-level debug
fi

