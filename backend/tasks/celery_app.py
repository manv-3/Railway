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
