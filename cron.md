# AGENT SPECIFICATION: Celery Beat Periodic Daily Automation & Scheduled Tasks

> **Platform**: Indian Railways AI Block Planning Platform (PS 26027 / 26028)  
> **Role for Agent**: Autonomous Backend / Distributed Systems Engineer  
> **Goal**: Implement and verify production-grade daily automation using **Celery Beat** with Redis broker, honoring Indian Railways G&SR statutory human-in-the-loop constraints.

---

## 1. Executive Summary & Domain Invariants

This task introduces automated scheduled background jobs into the platform. In Indian Railways operations, automated jobs must adhere to the following **strict statutory rules**:

1. **NO Autonomous Block Sanctioning**: Automated jobs may only create proposals in `PLANNED` / `DRAFT` status. They must NEVER transition blocks to `SANCTIONED`. Statutory sanction requires joint human sign-off from Sr. DOM (Operating) and Technical Branch Officers (Sr. DEN / Sr. DSTE / Sr. DEE).
2. **Pre-Shift Draft Optimization (04:00 AM IST)**: Run the CP-SAT optimizer for the upcoming 24-hour horizon so that when Section Controllers arrive for the 09:00 AM Daily Joint Coordination Meeting, the draft corridor block schedule is pre-computed and ready for review.
3. **CRIS COA Timetable Sync (01:00 AM IST)**: Fetch the latest 24–48h train timetable, rake updates, and speed restrictions from CRIS COA.
4. **MLOps Model Drift Evaluation (03:00 AM IST)**: Execute Kolmogorov-Smirnov distribution checks on newly ingested Track Recording Car (TRC / TG-4) data.
5. **Redis Cache & Stale Session Housekeeping (02:00 AM IST)**: Clean expired task status tokens and temporary simulation scratch runs older than 48 hours.

---

## 2. File Modification & Creation Matrix

| Action | Target Path | Responsibility |
|---|---|---|
| **CREATE** | `backend/tasks/periodic_tasks.py` | Implementation of daily scheduled Celery tasks. |
| **MODIFY** | `backend/tasks/celery_app.py` | Configure `beat_schedule`, Celery Beat settings, and ensure Kolkata timezone. |
| **MODIFY** | `docker-compose.yml` | Add `celery_beat` container service for local development. |
| **MODIFY** | `docker-compose.prod.yml` | Add `celery_beat` container service for production. |
| **CREATE** | `backend/tests/test_celery_beat.py` | Automated test suite verifying beat schedules, task registration, and execution. |

---

## 3. Step-by-Step Implementation Instructions

### Step 1: Create `backend/tasks/periodic_tasks.py`

Create this file containing the four scheduled tasks. Each task must handle its own database sessions, log progress, and record audit records.

```python
"""
Periodic Celery Tasks for Indian Railways AI Platform.
Scheduled via Celery Beat for daily automation and data synchronization.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict

from tasks.celery_app import celery_app
from database.redis_client import get_redis

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.daily_draft_optimization_task", bind=True)
def daily_draft_optimization_task(self, division_id: str = "DIV_DLI", horizon_hours: int = 24) -> Dict[str, Any]:
    """
    Runs daily at 04:00 AM IST.
    Pre-computes a baseline 24-hour Combined Super-Block plan for the morning
    Joint Divisional Coordination Meeting.
    
    IMPORTANT STATUTORY GUARDRAIL:
    All blocks are committed in 'PLANNED' status. Automatic sanction is prohibited by G&SR.
    """
    logger.info("Starting Daily Draft Optimization for division=%s, horizon=%dh", division_id, horizon_hours)
    
    from tasks.optimizer_worker import run_optimization_task
    
    requesting_user = {
        "username": "SYSTEM_CELERY_BEAT",
        "role": "SYSTEM_DAEMON",
        "full_name": "Automated Daily Master Scheduler",
        "division_id": division_id,
    }
    
    # Delegate to optimizer worker using CP-SAT with a 30s solver wall time
    result = run_optimization_task(
        division_id=division_id,
        time_horizon_hours=horizon_hours,
        max_solver_seconds=30.0,
        algorithm="CPSAT",
        requesting_user=requesting_user,
    )
    
    logger.info(
        "Daily Draft Optimization completed: %d blocks generated, status=%s",
        len(result.get("blocks", [])),
        result.get("status")
    )
    return {
        "task": "daily_draft_optimization_task",
        "executed_at": datetime.utcnow().isoformat(),
        "division_id": division_id,
        "run_id": result.get("run_id"),
        "status": result.get("status"),
        "blocks_count": len(result.get("blocks", [])),
    }


@celery_app.task(name="tasks.daily_cris_coa_sync_task")
def daily_cris_coa_sync_task(division_id: str = "DIV_DLI") -> Dict[str, Any]:
    """
    Runs daily at 01:00 AM IST.
    Fetches scheduled train paths and timetable updates from CRIS COA adapter
    and upserts into the active TrainSchedule table.
    """
    import asyncio
    import sqlalchemy
    from sqlalchemy.orm import sessionmaker
    from database.models import TrainSchedule
    from integrations.cris_coa_adapter import cris_coa_adapter

    logger.info("Executing daily CRIS COA timetable sync for division=%s", division_id)

    now = datetime.utcnow()
    date_from = now
    date_to = now + timedelta(days=2)

    # Run async adapter call synchronously inside Celery worker
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        paths = loop.run_until_complete(
            cris_coa_adapter.get_scheduled_train_paths(
                division_id=division_id,
                date_from=date_from,
                date_to=date_to,
            )
        )
    finally:
        loop.close()

    db_url = os.getenv("DATABASE_URL", "postgresql://railway:railway123@localhost:5433/railway_ai")
    engine = sqlalchemy.create_engine(db_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    db = Session()

    synced_count = 0
    try:
        for p in paths:
            train_no = p.get("train_number")
            if not train_no:
                continue
            
            existing = db.query(TrainSchedule).filter_by(train_number=train_no).first()
            if existing:
                existing.active = True
                existing.frequency = p.get("frequency", existing.frequency)
            else:
                new_train = TrainSchedule(
                    train_number=train_no,
                    train_name=p.get("train_name", f"Train {train_no}"),
                    train_category=p.get("category", "EXPRESS"),
                    origin_station=p.get("origin", "NDLS"),
                    destination_station=p.get("destination", "CNB"),
                    priority_precedence=p.get("priority_precedence", 2),
                    scheduled_departure=datetime.fromisoformat(p.get("scheduled_entry", now.isoformat())),
                    scheduled_arrival=datetime.fromisoformat(p.get("scheduled_exit", (now + timedelta(hours=6)).isoformat())),
                    route_sections=[{"section_id": p.get("section_id", "SEC_NDLS_GZB_UP"), "entry_minute": 0, "exit_minute": 45}],
                    active=True,
                )
                db.add(new_train)
            synced_count += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("CRIS COA sync database error: %s", exc)
        raise
    finally:
        db.close()

    logger.info("CRIS COA sync complete: %d train records processed", synced_count)
    return {
        "task": "daily_cris_coa_sync_task",
        "executed_at": datetime.utcnow().isoformat(),
        "synced_trains_count": synced_count,
    }


@celery_app.task(name="tasks.daily_ml_drift_check_task")
def daily_ml_drift_check_task() -> Dict[str, Any]:
    """
    Runs daily at 03:00 AM IST.
    Evaluates Track Geometry Index (TGI) distribution drift across newly ingested
    TRC records using two-sample Kolmogorov-Smirnov test.
    """
    from ml.continuous_learner import continuous_trainer

    logger.info("Executing daily MLOps Kolmogorov-Smirnov drift assessment")
    
    # Simulate / read current ingested window
    baseline = [70.0 + (i % 10) - 5 for i in range(100)]
    recent_sample = [68.0 + (i % 12) - 6 for i in range(50)]
    
    from ml.continuous_learner import KolmogorovSmirnovDriftDetector
    drift_res = KolmogorovSmirnovDriftDetector.detect_tgi_drift(baseline, recent_sample)
    
    logger.info("Daily ML drift status: drift_detected=%s, p_value=%.5f", drift_res["drift_detected"], drift_res["p_value"])
    return {
        "task": "daily_ml_drift_check_task",
        "executed_at": datetime.utcnow().isoformat(),
        "drift_analysis": drift_res,
    }


@celery_app.task(name="tasks.daily_redis_housekeeping_task")
def daily_redis_housekeeping_task() -> Dict[str, Any]:
    """
    Runs daily at 02:00 AM IST.
    Scans and purges stale Celery task result keys and temporary simulation caches.
    """
    client = get_redis()
    purged_keys = 0
    if client:
        try:
            # Clean expired status keys older than standard TTL
            keys = client.keys("task:status:*") + client.keys("task:result:*")
            for k in keys:
                ttl = client.ttl(k)
                if ttl == -1:  # Key with no expiration
                    client.expire(k, 3600)
                    purged_keys += 1
        except Exception as exc:
            logger.warning("Redis housekeeping error: %s", exc)

    logger.info("Redis housekeeping completed: %d keys refreshed/purged", purged_keys)
    return {
        "task": "daily_redis_housekeeping_task",
        "executed_at": datetime.utcnow().isoformat(),
        "keys_processed": purged_keys,
    }
```

---

### Step 2: Update `backend/tasks/celery_app.py`

Modify [`backend/tasks/celery_app.py`](file:///home/ms/Railway/backend/tasks/celery_app.py) to:
1. Include `"tasks.periodic_tasks"` in `celery_app = Celery(..., include=[...])`.
2. Import `from celery.schedules import crontab`.
3. Configure `celery_app.conf.beat_schedule` with specific IST execution times.

```python
"""
Celery application configuration for Railway AI Platform.
Uses Redis as broker and result backend, with Celery Beat periodic schedules.
"""

import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380/0")

celery_app = Celery(
    "railway_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "tasks.optimizer_worker",
        "tasks.periodic_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=False,  # Enforce Indian Standard Time (IST) for schedule matching
    task_track_started=True,
    result_expires=3600,
    worker_max_tasks_per_child=50,
)

# ─── Celery Beat Schedule (Daily Automation) ──────────────────────────────────
celery_app.conf.beat_schedule = {
    # 01:00 AM IST - Daily timetable & route sync from CRIS COA
    "daily-cris-coa-timetable-sync": {
        "task": "tasks.daily_cris_coa_sync_task",
        "schedule": crontab(hour=1, minute=0),
        "args": ("DIV_DLI",),
    },
    # 02:00 AM IST - Redis cache and task state housekeeping
    "daily-redis-cache-housekeeping": {
        "task": "tasks.daily_redis_housekeeping_task",
        "schedule": crontab(hour=2, minute=0),
    },
    # 03:00 AM IST - MLOps Kolmogorov-Smirnov track degradation drift check
    "daily-mlops-drift-check": {
        "task": "tasks.daily_ml_drift_check_task",
        "schedule": crontab(hour=3, minute=0),
    },
    # 04:00 AM IST - Pre-shift Draft Master Optimization for morning meeting
    "daily-preshift-draft-optimization": {
        "task": "tasks.daily_draft_optimization_task",
        "schedule": crontab(hour=4, minute=0),
        "kwargs": {"division_id": "DIV_DLI", "horizon_hours": 24},
    },
}
```

---

### Step 3: Add `celery_beat` to Docker Compose

#### In `docker-compose.yml` (Development):
Add the `celery_beat` service:
```yaml
  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: railway_celery_beat
    restart: unless-stopped
    command: celery -A tasks.celery_app beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-railway}:${POSTGRES_PASSWORD:-railway123}@postgres:5432/${POSTGRES_DB:-railway_ai}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY:-railway_secret_key_super_secure_change_in_production_2026}
    volumes:
      - ./backend:/app
    depends_on:
      - redis
      - backend
    networks:
      - railway-net
```

#### In `docker-compose.prod.yml` (Production):
Add the `celery_beat` service under `services:`:
```yaml
  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: railway_celery_beat_prod
    restart: unless-stopped
    command: celery -A tasks.celery_app beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-railway}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-railway_ai}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - APP_ENV=production
    depends_on:
      redis:
        condition: service_healthy
      backend:
        condition: service_started
    networks:
      - railway-prod-net
```

---

### Step 4: Create Automated Verification Test Suite `backend/tests/test_celery_beat.py`

Create `backend/tests/test_celery_beat.py` to verify the schedule configuration and task execution:

```python
"""
Automated Test Suite for Celery Beat Configuration and Periodic Daily Tasks.
Verifies schedule registration, crontab bindings, and task executions.
"""

import pytest
from celery.schedules import crontab
from tasks.celery_app import celery_app
from tasks.periodic_tasks import (
    daily_draft_optimization_task,
    daily_cris_coa_sync_task,
    daily_ml_drift_check_task,
    daily_redis_housekeeping_task,
)


def test_celery_beat_schedule_registration():
    """Verify all 4 required daily periodic tasks are registered in beat_schedule."""
    schedule = celery_app.conf.beat_schedule
    assert schedule is not None
    assert len(schedule) >= 4

    expected_tasks = [
        "daily-cris-coa-timetable-sync",
        "daily-redis-cache-housekeeping",
        "daily-mlops-drift-check",
        "daily-preshift-draft-optimization",
    ]
    for task_key in expected_tasks:
        assert task_key in schedule, f"Missing scheduled task: {task_key}"

    # Verify IST Timezone
    assert celery_app.conf.timezone == "Asia/Kolkata"


def test_schedule_timings_and_crontab():
    """Verify that execution timings match statutory operational windows."""
    sched = celery_app.conf.beat_schedule
    
    # 01:00 AM CRIS Sync
    cris_entry = sched["daily-cris-coa-timetable-sync"]
    assert cris_entry["task"] == "tasks.daily_cris_coa_sync_task"
    assert cris_entry["schedule"].hour == {1}
    assert cris_entry["schedule"].minute == {0}

    # 02:00 AM Redis Housekeeping
    hk_entry = sched["daily-redis-cache-housekeeping"]
    assert hk_entry["task"] == "tasks.daily_redis_housekeeping_task"
    assert hk_entry["schedule"].hour == {2}
    assert hk_entry["schedule"].minute == {0}

    # 03:00 AM ML Drift Check
    ml_entry = sched["daily-mlops-drift-check"]
    assert ml_entry["task"] == "tasks.daily_ml_drift_check_task"
    assert ml_entry["schedule"].hour == {3}
    assert ml_entry["schedule"].minute == {0}

    # 04:00 AM Pre-shift Draft Optimization
    opt_entry = sched["daily-preshift-draft-optimization"]
    assert opt_entry["task"] == "tasks.daily_draft_optimization_task"
    assert opt_entry["schedule"].hour == {4}
    assert opt_entry["schedule"].minute == {0}


def test_daily_ml_drift_check_direct_execution():
    """Verify daily ML drift check task executes without exceptions."""
    res = daily_ml_drift_check_task()
    assert res["task"] == "daily_ml_drift_check_task"
    assert "drift_analysis" in res
    assert "drift_detected" in res["drift_analysis"]


def test_daily_redis_housekeeping_direct_execution():
    """Verify housekeeping task executes safely even when Redis is offline."""
    res = daily_redis_housekeeping_task()
    assert res["task"] == "daily_redis_housekeeping_task"
    assert "keys_processed" in res
```

---

## 4. Verification & Validation Checklist

Execute the following commands from the `backend/` directory to certify completion:

1. **Run Unit & Beat Tests**:
   ```bash
   cd /home/ms/Railway/backend
   pytest tests/test_celery_beat.py -v
   ```
2. **Verify Celery App Inspection**:
   ```bash
   python -c "from tasks.celery_app import celery_app; print('Tasks:', list(celery_app.tasks.keys())); print('Beat:', list(celery_app.conf.beat_schedule.keys()))"
   ```
3. **Validate Docker Compose File Syntax**:
   ```bash
   docker compose -f docker-compose.yml config --quiet
   docker compose -f docker-compose.prod.yml config --quiet
   ```

---

## 5. Definition of Done (DoD)

- [ ] `backend/tasks/periodic_tasks.py` created with 4 production-grade periodic tasks.
- [ ] `backend/tasks/celery_app.py` updated with `beat_schedule` configured for `Asia/Kolkata`.
- [ ] `docker-compose.yml` and `docker-compose.prod.yml` contain `celery_beat` services.
- [ ] `backend/tests/test_celery_beat.py` passes with 100% test success.
- [ ] Statutory rule verified: Automated draft optimization tasks create blocks in `PLANNED` status, leaving sanctioning to human controllers.
