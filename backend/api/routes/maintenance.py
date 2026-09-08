from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database.connection import get_db
from database.models import MaintenanceRequest, Section
from ml.priority_scorer import PriorityScorer
from api.routes.auth import require_field_access

router = APIRouter(prefix="/api/v1/maintenance", tags=["Maintenance Requisitions"])
scorer = PriorityScorer()

class MaintenanceRequestCreate(BaseModel):
    department: str # 'TMS', 'SMMS', 'TDMS'
    division_id: Optional[str] = "DIV_DLI"
    section_id: str
    from_km: float
    to_km: float
    asset_type: str
    defect_type: str
    severity: str # 'EMERGENCY', 'CRITICAL', 'PLANNED_HIGH', 'ROUTINE'
    estimated_duration_minutes: int
    required_machine_type: Optional[str] = None
    due_date: Optional[datetime] = None

@router.get("/requests")
def list_maintenance_requests(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    division_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceRequest)
    if department:
        query = query.filter(MaintenanceRequest.department == department.upper())
    if status:
        query = query.filter(MaintenanceRequest.status == status.upper())
    if division_id:
        query = query.filter(MaintenanceRequest.division_id == division_id)

    results = query.order_by(MaintenanceRequest.priority_score.desc()).all()
    return [
        {
            "id": r.id,
            "request_id": r.request_id,
            "department": r.department,
            "division_id": r.division_id,
            "section_id": r.section_id,
            "from_km": r.from_km,
            "to_km": r.to_km,
            "asset_type": r.asset_type,
            "defect_type": r.defect_type,
            "severity": r.severity,
            "estimated_duration_minutes": r.estimated_duration_minutes,
            "required_machine_type": r.required_machine_type,
            "priority_score": r.priority_score,
            "status": r.status,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in results
    ]

from api.websocket_manager import manager

@router.post("/requests")
async def create_maintenance_request(
    payload: MaintenanceRequestCreate,
    current_user: dict = Depends(require_field_access),
    db: Session = Depends(get_db)
):
    # Verify section exists
    section = db.query(Section).filter_by(id=payload.section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail=f"Section {payload.section_id} not found.")

    # Calculate ML Priority Score
    req_dict = payload.dict()
    score, factors = scorer.calculate_priority(req_dict)

    req_count = db.query(MaintenanceRequest).count() + 1
    generated_id = f"{payload.department.upper()}_2026_{req_count:04d}"

    if payload.from_km >= payload.to_km:
        raise HTTPException(status_code=422, detail="from_km must be less than to_km.")
    if payload.estimated_duration_minutes <= 0:
        raise HTTPException(status_code=422, detail="estimated_duration_minutes must be positive.")

    due = payload.due_date or datetime.utcnow()

    new_req = MaintenanceRequest(
        request_id=generated_id,
        department=payload.department.upper(),
        division_id=payload.division_id,
        section_id=payload.section_id,
        from_km=payload.from_km,
        to_km=payload.to_km,
        asset_type=payload.asset_type,
        defect_type=payload.defect_type,
        severity=payload.severity.upper(),
        estimated_duration_minutes=payload.estimated_duration_minutes,
        required_machine_type=payload.required_machine_type,
        due_date=due,
        priority_score=score,
        status="PENDING"
    )

    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    await manager.broadcast("REQUEST_CREATED", {
        "request_id": new_req.request_id,
        "department": new_req.department,
        "section_id": new_req.section_id,
        "defect_type": new_req.defect_type,
        "severity": new_req.severity,
        "priority_score": score,
        "status": "PENDING"
    })

    return {
        "status": "SUCCESS",
        "request_id": new_req.request_id,
        "priority_score": score,
        "factors": factors
    }
