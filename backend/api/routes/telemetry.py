"""
Telemetry Ingestion & Integration Routes - PS 26027 Railway AI Platform
V5-04:
- POST /api/v1/telemetry/upload-tg4: Ingests IRPWM OMS-2000 / TG-4 Track Recording Car CSVs.
  Parses track geometry standards (TGI, twist, gauge, cross-level), correlates measurements
  with corridor track sections, updates maintenance request safety risk scores via XGBoost,
  and broadcasts updates over WebSocket.
- GET /api/v1/integrations/coa/active-trains: Real-time CRIS COA timetabled train stream.
- GET /api/v1/integrations/coa/occupancy/{section_id}: Real-time section occupancy & signal aspects.
- POST /api/v1/integrations/coa/block-sanction/{block_id}: Exports block sanction to COA register.
"""

import io
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import MaintenanceRequest, Section
from integrations.cris_coa_adapter import CRISCOAAdapter
from integrations.track_recording_car_parser import TrackRecordingCarParser
from ml.risk_explainer import risk_explainer
from api.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Telemetry & CRIS COA Integrations"])


class TG4StringPayload(BaseModel):
    csv_content: str
    section_id: Optional[str] = None
    recording_car_id: Optional[str] = "OMS-2000-DLI-01"


# ─── Telemetry Ingestion Endpoints ───────────────────────────────────────────

@router.post("/api/v1/telemetry/upload-tg4")
async def upload_tg4_telemetry(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Ingest OMS-2000 / TG-4 Track Geometry Car CSV output.
    Accepts:
      1. multipart/form-data: file upload field named 'file'
      2. application/json: {"csv_content": "...", "section_id": "..."}
      3. text/csv: raw CSV body string
    
    Correlates per-kilometer geometry metrics with corridor track sections,
    re-computes XGBoost risk for active maintenance requisitions, and broadcasts
    updates over the WebSocket corridor feed.
    """
    content_type = request.headers.get("content-type", "")
    filename = "telemetry.csv"
    csv_text = ""

    if "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file")
        if file_obj is not None and hasattr(file_obj, "read"):
            content_bytes = await file_obj.read()
            filename = getattr(file_obj, "filename", "uploaded_trc.csv") or "uploaded_trc.csv"
            try:
                csv_text = content_bytes.decode("utf-8-sig")
            except UnicodeDecodeError:
                csv_text = content_bytes.decode("latin-1")
    elif "application/json" in content_type:
        try:
            body = await request.json()
            csv_text = body.get("csv_content", "")
            sec_id = body.get("section_id", "corridor")
            filename = f"payload_{sec_id}.csv"
        except Exception:
            csv_text = ""
    else:
        body_bytes = await request.body()
        if body_bytes:
            try:
                csv_text = body_bytes.decode("utf-8-sig")
            except UnicodeDecodeError:
                csv_text = body_bytes.decode("latin-1")
            filename = "raw_stream.csv"

    if not csv_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No CSV content provided. Send multipart/form-data with 'file' or JSON with 'csv_content'."
        )

    parser = TrackRecordingCarParser()
    try:
        parsed_rows = parser.parse_csv_string(csv_text)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse TRC CSV: {str(exc)}")

    if not parsed_rows:
        raise HTTPException(
            status_code=422,
            detail="CSV parsed successfully but contained 0 valid measurement rows."
        )

    # Correlate measurements across sections
    sections = db.query(Section).all()
    sections_updated = []
    total_requests_updated = 0
    sample_metrics = None

    for sec in sections:
        min_km = min(sec.start_km, sec.end_km)
        max_km = max(sec.start_km, sec.end_km)
        sec_metrics = parser.aggregate_section_metrics(parsed_rows, min_km, max_km)

        if sec_metrics.get("data_points", 0) > 0:
            if sample_metrics is None:
                sample_metrics = sec_metrics

            # Find maintenance requests on this section and update risk score
            requests_on_sec = db.query(MaintenanceRequest).filter(
                MaintenanceRequest.section_id == sec.id
            ).all()

            for req in requests_on_sec:
                tgi_val = sec_metrics.get("tgi_mean") or 62.0
                req_data = {
                    "severity": req.severity,
                    "accumulated_gmt": 68.0,
                    "tgi_score": tgi_val,
                    "overdue_days": 6 if req.severity in ("CRITICAL", "EMERGENCY") else 3,
                    "asset_age_years": 8.5,
                    "operating_speed_kmh": float(sec.speed_limit_kmh or 130),
                    "traffic_density_tpd": 115.0,
                }
                explanation = risk_explainer.explain_request(req_data)
                req.safety_risk_index = explanation["risk_score"]
                req.priority_score = round(explanation["risk_score"] * 1.2, 1)
                total_requests_updated += 1

            sections_updated.append({
                "section_id": sec.id,
                "section_name": sec.name,
                "km_range": f"{min_km} - {max_km}",
                "measurement_points": sec_metrics["data_points"],
                "mean_tgi": sec_metrics.get("tgi_mean"),
                "min_tgi": sec_metrics.get("tgi_min"),
                "requires_attention_count": sec_metrics.get("attention_km_count", 0),
            })

    db.commit()

    # Invalidate cache if available
    try:
        from core.cache import invalidate_cache
        invalidate_cache("corridor*")
    except Exception:
        pass

    attention_total = sum(1 for r in parsed_rows if r.get("requires_attention"))

    response_payload = {
        "status": "SUCCESS",
        "filename": filename,
        "total_rows_parsed": len(parsed_rows),
        "attention_required_count": attention_total,
        "affected_sections_count": len(sections_updated),
        "sections_updated": sections_updated,
        "maintenance_requests_recalculated": total_requests_updated,
        "sample_geometry_stats": sample_metrics,
        "message": f"Successfully ingested {len(parsed_rows)} TRC telemetry rows across {len(sections_updated)} corridor sections."
    }

    # Broadcast real-time update
    try:
        await manager.broadcast("TELEMETRY_INGESTED", {
            "source": "OMS_TG4_INGESTION",
            "filename": filename,
            "rows_parsed": len(parsed_rows),
            "critical_points": attention_total,
            "sections_affected": len(sections_updated),
            "timestamp": datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    return response_payload


@router.get("/api/v1/telemetry/sections/{section_id}/metrics")
def get_section_telemetry_metrics(
    section_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve current track geometry index and defect stats for a section."""
    sec = db.query(Section).filter_by(id=section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail=f"Section {section_id} not found")

    requests = db.query(MaintenanceRequest).filter_by(section_id=section_id).all()
    critical_count = sum(1 for r in requests if r.severity in ("CRITICAL", "EMERGENCY"))

    return {
        "section_id": sec.id,
        "section_name": sec.name,
        "km_range": f"{sec.start_km} - {sec.end_km}",
        "speed_limit_kmh": sec.speed_limit_kmh,
        "is_electrified": sec.is_electrified,
        "active_maintenance_requests": len(requests),
        "critical_defects_count": critical_count,
        "average_risk_score": round(
            sum(r.safety_risk_index or 50.0 for r in requests) / max(len(requests), 1), 1
        ),
    }


# ─── CRIS COA Integration Endpoints ──────────────────────────────────────────

@router.get("/api/v1/integrations/coa/active-trains")
async def get_active_trains_from_coa(
    division_id: str = "DIV_DLI",
    hours_ahead: int = 12,
):
    """
    Streams active and timetabled train paths from CRIS Control Office Application (COA).
    Integrates with Indian Railways National Train Enquiry System (NTES) & RTIS transponders.
    """
    now = datetime.utcnow()
    adapter = CRISCOAAdapter(division_code=division_id.replace("DIV_", ""))
    result = await adapter.get_scheduled_train_paths(
        division_id=division_id,
        date_from=now,
        date_to=now + timedelta(hours=hours_ahead),
    )
    return result


@router.get("/api/v1/integrations/coa/occupancy/{section_id}")
async def get_section_occupancy_from_coa(
    section_id: str,
):
    """
    Fetch real-time section occupancy status and signal aspects from CRIS COA track circuits.
    """
    adapter = CRISCOAAdapter()
    result = await adapter.get_real_time_occupancy(section_id=section_id)
    return result


@router.post("/api/v1/integrations/coa/block-sanction/{block_id}")
async def export_block_sanction_to_coa(
    block_id: str,
    payload: Dict[str, Any] = Body(...),
):
    """
    Export sanctioned maintenance block to CRIS COA electronic Line Block Register.
    """
    adapter = CRISCOAAdapter()
    result = await adapter.export_block_sanction_to_coa(block_id=block_id, sanction_data=payload)
    return result


# ─── ISRO NavIC / RTIS Telemetry Endpoints (V5-07) ───────────────────────────

from integrations.rtis_stream import rtis_ingester, NavICTransponderPacket


@router.post("/api/v1/integrations/rtis/feed")
async def ingest_rtis_navic_packet(
    payload: Dict[str, Any] = Body(...),
):
    """
    Ingest live ISRO NavIC RTIS locomotive transponder packet.
    Filters position/velocity using 1-D kinematic Kalman filter,
    calculates dynamic arrival drift at destination station, and detects
    vacated corridor capacity opportunities if drift >= 10 minutes.
    """
    packet = NavICTransponderPacket.from_dict(payload)
    timetabled_iso = payload.get("timetabled_arrival")
    timetabled_dt = None
    if timetabled_iso:
        try:
            timetabled_dt = datetime.fromisoformat(timetabled_iso.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            pass

    dest_km = float(payload.get("destination_km", 131.2))
    telemetry = rtis_ingester.ingest_packet(
        packet=packet,
        timetabled_arrival=timetabled_dt,
        destination_km=dest_km,
    )

    # Broadcast live GPS telemetry over corridor WebSocket
    try:
        await manager.broadcast("RTIS_GPS_TELEMETRY", telemetry)
    except Exception:
        pass

    return {
        "status": "SUCCESS",
        "telemetry": telemetry,
    }


@router.get("/api/v1/integrations/rtis/trains")
def get_rtis_live_trains(
    train_number: Optional[str] = None,
):
    """Get latest Kalman-filtered telemetry for active tracked trains."""
    data = rtis_ingester.get_latest_telemetry(train_number=train_number)
    return {
        "status": "SUCCESS",
        "tracked_trains": data if isinstance(data, list) else [data] if data else [],
    }

