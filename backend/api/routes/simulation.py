from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel
import time

from database.connection import get_db
from database.models import MaintenanceRequest, TrainSchedule
from optimization.cpsat_optimizer import CPSATBlockOptimizer

from api.websocket_manager import manager
from simulation.train_delay_simulator import TrainDispatchSimulator
from api.routes.auth import require_division_access

router = APIRouter(prefix="/api/v1/simulation", tags=["What-If Scenario Simulator"])

class WhatIfSimulationPayload(BaseModel):
    scenario_type: str # 'EMERGENCY_RAIL_FRACTURE' or 'PREMIUM_TRAIN_DELAY'
    section_id: str
    parameter_value: float # e.g. km mark or delay minutes
    target_identifier: Optional[str] = None # e.g. train number '22436'

@router.post("/what-if")
async def simulate_what_if_scenario(
    payload: WhatIfSimulationPayload,
    current_user: dict = Depends(require_division_access),
    db: Session = Depends(get_db)
):
    if payload.scenario_type not in {"EMERGENCY_RAIL_FRACTURE", "PREMIUM_TRAIN_DELAY"}:
        raise HTTPException(status_code=422, detail="Unsupported scenario_type.")
    if payload.parameter_value < 0:
        raise HTTPException(status_code=422, detail="parameter_value must be non-negative.")
    start_wall = time.time()

    # 1. Fetch current requests
    db_requests = db.query(MaintenanceRequest).all()
    requests_data = [
        {
            "request_id": r.request_id,
            "department": r.department,
            "section_id": r.section_id,
            "from_km": r.from_km,
            "to_km": r.to_km,
            "asset_type": r.asset_type,
            "defect_type": r.defect_type,
            "severity": r.severity,
            "estimated_duration_minutes": r.estimated_duration_minutes,
            "required_machine_type": r.required_machine_type,
            "priority_score": r.priority_score or 50.0
        }
        for r in db_requests
    ]

    # 2. Fetch train schedules
    trains_db = db.query(TrainSchedule).filter_by(active=True).all()
    trains_data = []
    for tr in trains_db:
        if isinstance(tr.route_sections, list):
            for seg in tr.route_sections:
                trains_data.append({
                    "train_number": tr.train_number,
                    "train_name": tr.train_name,
                    "train_category": tr.train_category,
                    "priority_precedence": tr.priority_precedence,
                    "section_id": seg.get("section_id"),
                    "entry_minute": seg.get("entry_minute", 0),
                    "exit_minute": seg.get("exit_minute", 60)
                })

    # 3. Inject Scenario Perturbation
    if payload.scenario_type == "EMERGENCY_RAIL_FRACTURE":
        emergency_req = {
            "request_id": "EMERGENCY_FRACTURE_INJECTED",
            "department": "TMS",
            "section_id": payload.section_id,
            "from_km": payload.parameter_value,
            "to_km": payload.parameter_value + 0.5,
            "asset_type": "RAIL",
            "defect_type": "COMPLETE_RAIL_FRACTURE",
            "severity": "EMERGENCY",
            "estimated_duration_minutes": 90,
            "required_machine_type": None,
            "priority_score": 100.0
        }
        requests_data.insert(0, emergency_req)

    elif payload.scenario_type == "PREMIUM_TRAIN_DELAY":
        target_train = payload.target_identifier or "22436"
        for tr in trains_data:
            if tr["train_number"] == target_train:
                tr["entry_minute"] += int(payload.parameter_value)
                tr["exit_minute"] += int(payload.parameter_value)

    # 4. Fast Re-optimization (< 5s limit)
    optimizer = CPSATBlockOptimizer(time_horizon_minutes=1440)
    opt_res = optimizer.solve(
        requests=requests_data,
        trains=trains_data,
        max_time_seconds=5.0
    )

    elapsed = round(time.time() - start_wall, 3)

    # 5. Evaluate Train Regulations (Holding at Loop Lines)
    simulator = TrainDispatchSimulator()
    regulations = []
    if opt_res.get("blocks"):
        for b in opt_res["blocks"]:
            impacts = simulator.simulate_impact(b, trains_data)
            if impacts:
                regulations.extend(impacts)

    alert_message = (
        f"CRITICAL DISRUPTION: Emergency Rail Fracture injected on {payload.section_id} at KM {payload.parameter_value}! Re-planned in {elapsed}s."
        if payload.scenario_type == "EMERGENCY_RAIL_FRACTURE"
        else f"SCHEDULE ADJUSTMENT: Train {payload.target_identifier or '22436'} delayed by {payload.parameter_value} min. Re-planned in {elapsed}s."
    )

    await manager.broadcast("EMERGENCY_DISRUPTION" if payload.scenario_type == "EMERGENCY_RAIL_FRACTURE" else "WHAT_IF_REPLANNED", {
        "scenario_type": payload.scenario_type,
        "section_id": payload.section_id,
        "parameter_value": payload.parameter_value,
        "computation_time_seconds": elapsed,
        "message": alert_message,
        "affected_blocks_count": len(opt_res.get("blocks", []))
    })

    return {
        "status": "SIMULATION_SUCCESS",
        "scenario_type": payload.scenario_type,
        "computation_time_seconds": elapsed,
        "alert_message": alert_message,
        "train_regulations": regulations,
        "replan_result": opt_res
    }
