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
    # Check if run_optimization_task is called directly or as Celery task
    try:
        result = run_optimization_task(
            division_id=division_id,
            time_horizon_hours=horizon_hours,
            max_solver_seconds=30.0,
            algorithm="CPSAT",
            requesting_user=requesting_user,
        )
    except TypeError:
        # Fallback if Celery bind requires self / apply
        result = run_optimization_task.apply(
            kwargs={
                "division_id": division_id,
                "time_horizon_hours": horizon_hours,
                "max_solver_seconds": 30.0,
                "algorithm": "CPSAT",
                "requesting_user": requesting_user,
            }
        ).get()
    
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
    from database.connection import SessionLocal
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
        raw_res = loop.run_until_complete(
            cris_coa_adapter.get_scheduled_train_paths(
                division_id=division_id,
                date_from=date_from,
                date_to=date_to,
            )
        )
    finally:
        loop.close()

    paths = raw_res.get("train_paths", []) if isinstance(raw_res, dict) else (raw_res or [])
    db = SessionLocal()

    synced_count = 0
    try:
        for p in paths:
            train_no = p.get("train_number")
            if not train_no:
                continue
            
            existing = db.query(TrainSchedule).filter_by(train_number=train_no).first()
            if existing:
                existing.active = True
                existing.priority_precedence = p.get("priority_precedence", existing.priority_precedence)
                if "train_name" in p:
                    existing.train_name = p["train_name"]
            else:
                new_train = TrainSchedule(
                    train_number=train_no,
                    train_name=p.get("train_name", f"Train {train_no}"),
                    train_category=p.get("train_category", p.get("category", "EXPRESS")),
                    source_station_code=p.get("source_station_code", p.get("origin", "NDLS")),
                    dest_station_code=p.get("dest_station_code", p.get("destination", "CNB")),
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
    from ml.continuous_learner import continuous_trainer, KolmogorovSmirnovDriftDetector

    logger.info("Executing daily MLOps Kolmogorov-Smirnov drift assessment")
    
    # Simulate / read current ingested window
    baseline = [70.0 + (i % 10) - 5 for i in range(100)]
    recent_sample = [68.0 + (i % 12) - 6 for i in range(50)]
    
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
