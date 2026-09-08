"""
Realistic Maintenance Backlog Generator
Creates 100+ diverse maintenance requests across TMS, SMMS, and TDMS departments
with realistic spatial clustering and defect types
"""

from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

def generate_maintenance_backlog(num_requests: int = 100) -> List[Dict[str, Any]]:
    """
    Generates realistic maintenance request backlog matching Indian Railways patterns
    
    Department Distribution:
    - TMS (Track Engineering): 40% (rail wear, corrugation, sleeper renewal, ballast cleaning)
    - SMMS (Signalling): 35% (point machines, signals, track circuits, interlocking)
    - TDMS (Electrical/OHE): 25% (catenary wear, insulator flashover, mast defects)
    
    Severity Distribution:
    - EMERGENCY: 3% (immediate safety hazard)
    - CRITICAL: 12% (high failure risk within days)
    - PLANNED_HIGH: 35% (scheduled priority work)
    - ROUTINE: 50% (preventive maintenance)
    """
    
    requests = []
    base_date = datetime.now() + timedelta(days=1)
    
    # Section IDs matching corridor (NDLS to CNB)
    sections_up = [
        "SEC_NDLS_GZB_UP", "SEC_GZB_ALJN_UP", "SEC_ALJN_TDL_UP", "SEC_TDL_CNB_UP"
    ]
    sections_dn = [
        "SEC_NDLS_GZB_DN", "SEC_GZB_ALJN_DN", "SEC_ALJN_TDL_DN", "SEC_TDL_CNB_DN"
    ]
    all_sections = sections_up + sections_dn
    
    # TMS Request Templates (Track Maintenance System)
    tms_defect_types = [
        ("RAIL_FRACTURE_RISK", "CRITICAL", 180, "TAMPING_MACHINE", 95.0),
        ("RAIL_CORRUGATION", "PLANNED_HIGH", 120, "TAMPING_MACHINE", 82.0),
        ("RAIL_WEAR_EXCESSIVE", "PLANNED_HIGH", 150, "RAIL_GRINDER", 80.0),
        ("SLEEPER_RENEWAL_DUE", "PLANNED_HIGH", 90, None, 75.0),
        ("BALLAST_FOULING", "ROUTINE", 120, "BALLAST_CLEANER", 65.0),
        ("TRACK_GEOMETRY_DEVIATION", "PLANNED_HIGH", 105, "TAMPING_MACHINE", 78.0),
        ("FISHPLATE_CRACK", "CRITICAL", 60, None, 88.0),
        ("JOINT_WEAR", "ROUTINE", 45, None, 60.0),
        ("SLEEPER_CRACK", "ROUTINE", 60, None, 58.0),
        ("BALLAST_CLEANING_OVERDUE", "ROUTINE", 90, "BALLAST_CLEANER", 62.0)
    ]
    
    # SMMS Request Templates (Signalling & Telecom)
    smms_defect_types = [
        ("POINT_MACHINE_SLUGGISH", "CRITICAL", 90, "TOWER_WAGON", 87.0),
        ("SIGNAL_LAMP_FAILURE", "PLANNED_HIGH", 60, "TOWER_WAGON", 72.0),
        ("TRACK_CIRCUIT_INTERMITTENT", "CRITICAL", 75, None, 85.0),
        ("INTERLOCKING_TEST_OVERDUE", "PLANNED_HIGH", 120, None, 70.0),
        ("AXLE_COUNTER_MALFUNCTION", "CRITICAL", 90, None, 84.0),
        ("SIGNAL_CABLE_EXPOSED", "PLANNED_HIGH", 45, None, 68.0),
        ("POINT_HEEL_CLEARANCE_LESS", "PLANNED_HIGH", 60, None, 74.0),
        ("RELAY_ROOM_INSPECTION", "ROUTINE", 90, None, 55.0),
        ("SIGNAL_POST_RUSTED", "ROUTINE", 45, None, 52.0),
        ("CABLING_WATERLOGGED", "PLANNED_HIGH", 75, None, 66.0)
    ]
    
    # TDMS Request Templates (Traction Distribution - OHE)
    tdms_defect_types = [
        ("OHE_CONTACT_WIRE_BROKEN", "EMERGENCY", 180, "TOWER_WAGON", 99.0),
        ("CONTACT_WIRE_WEAR_EXCESSIVE", "CRITICAL", 120, "TOWER_WAGON", 86.0),
        ("INSULATOR_FLASHOVER_RISK", "PLANNED_HIGH", 90, "TOWER_WAGON", 77.0),
        ("CATENARY_SAG_EXCESSIVE", "PLANNED_HIGH", 105, "TOWER_WAGON", 73.0),
        ("MAST_TILT_DETECTED", "CRITICAL", 150, None, 83.0),
        ("EARTHING_FAULT", "PLANNED_HIGH", 60, None, 71.0),
        ("DROPPER_REPLACEMENT", "ROUTINE", 75, "TOWER_WAGON", 61.0),
        ("NEUTRAL_SECTION_INSPECTION", "ROUTINE", 90, None, 59.0),
        ("OHE_HEIGHT_DEVIATION", "PLANNED_HIGH", 120, "TOWER_WAGON", 69.0),
        ("RETURN_CONDUCTOR_LOOSE", "ROUTINE", 60, None, 57.0)
    ]
    
    # Generate TMS requests (40%)
    num_tms = int(num_requests * 0.40)
    for i in range(num_tms):
        section_id = random.choice(all_sections)
        defect_type, severity, duration, machine, priority_base = random.choice(tms_defect_types)
        
        # Calculate KM based on section
        if "NDLS_GZB" in section_id:
            km_start = random.uniform(2.0, 22.0)
        elif "GZB_ALJN" in section_id:
            km_start = random.uniform(25.0, 128.0)
        elif "ALJN_TDL" in section_id:
            km_start = random.uniform(132.0, 180.0)
        elif "TDL_CNB" in section_id:
            km_start = random.uniform(184.0, 438.0)
        else:
            km_start = random.uniform(10.0, 100.0)
        
        km_end = km_start + random.uniform(1.5, 3.0)
        
        # Add some randomness to priority
        priority = priority_base + random.uniform(-5.0, 3.0)
        priority = max(35.0, min(98.0, priority))
        
        # Calculate due date (critical = sooner)
        if severity == "EMERGENCY":
            due_days = random.randint(0, 1)
        elif severity == "CRITICAL":
            due_days = random.randint(1, 5)
        elif severity == "PLANNED_HIGH":
            due_days = random.randint(5, 14)
        else:
            due_days = random.randint(14, 45)
        
        requests.append({
            "request_id": f"TMS_2026_09_{i+1:03d}",
            "department": "TMS",
            "division_id": "DIV_DLI" if "GZB" in section_id or "NDLS" in section_id else "DIV_PRYJ",
            "section_id": section_id,
            "from_km": round(km_start, 2),
            "to_km": round(km_end, 2),
            "asset_type": random.choice(["RAIL", "SLEEPER", "BALLAST", "TRACK_GEOMETRY"]),
            "defect_type": defect_type,
            "severity": severity,
            "description": f"TMS {defect_type.replace('_', ' ').title()} at KM {km_start:.1f}-{km_end:.1f}",
            "estimated_duration_minutes": duration + random.randint(-15, 30),
            "required_machine_type": machine,
            "due_date": (base_date + timedelta(days=due_days)).isoformat(),
            "priority_score": round(priority, 2),
            "safety_risk_index": 0.0,  # Will be calculated by ML model
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 10))).isoformat()
        })
    
    # Generate SMMS requests (35%)
    num_smms = int(num_requests * 0.35)
    for i in range(num_smms):
        section_id = random.choice(all_sections)
        defect_type, severity, duration, machine, priority_base = random.choice(smms_defect_types)
        
        # SMMS defects are typically at station yards or mid-section signals
        if "NDLS_GZB" in section_id:
            km_start = random.choice([2.5, 6.2, 8.5, 15.0, 23.0])  # Station locations
        elif "GZB_ALJN" in section_id:
            km_start = random.choice([25.0, 35.5, 47.8, 62.0, 78.0, 92.5, 110.0, 130.0])
        elif "ALJN_TDL" in section_id:
            km_start = random.choice([132.0, 152.0, 165.0, 182.0])
        else:
            km_start = random.choice([185.0, 203.5, 215.0, 226.0, 258.0, 301.0, 325.0, 381.0, 441.0])
        
        km_start += random.uniform(-0.5, 0.5)
        km_end = km_start + random.uniform(0.2, 1.2)  # SMMS work is more localized
        
        priority = priority_base + random.uniform(-6.0, 4.0)
        priority = max(40.0, min(97.0, priority))
        
        if severity == "EMERGENCY":
            due_days = 0
        elif severity == "CRITICAL":
            due_days = random.randint(1, 4)
        elif severity == "PLANNED_HIGH":
            due_days = random.randint(4, 10)
        else:
            due_days = random.randint(10, 30)
        
        requests.append({
            "request_id": f"SMMS_2026_09_{i+1:03d}",
            "department": "SMMS",
            "division_id": "DIV_DLI" if "GZB" in section_id or "NDLS" in section_id else "DIV_PRYJ",
            "section_id": section_id,
            "from_km": round(km_start, 2),
            "to_km": round(km_end, 2),
            "asset_type": random.choice(["POINT_MACHINE", "SIGNAL", "TRACK_CIRCUIT", "AXLE_COUNTER", "CABLE"]),
            "defect_type": defect_type,
            "severity": severity,
            "description": f"SMMS {defect_type.replace('_', ' ').title()} at KM {km_start:.1f}",
            "estimated_duration_minutes": duration + random.randint(-10, 20),
            "required_machine_type": machine,
            "due_date": (base_date + timedelta(days=due_days)).isoformat(),
            "priority_score": round(priority, 2),
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 8))).isoformat()
        })
    
    # Generate TDMS requests (25%)
    num_tdms = num_requests - num_tms - num_smms
    for i in range(num_tdms):
        section_id = random.choice(all_sections)
        defect_type, severity, duration, machine, priority_base = random.choice(tdms_defect_types)
        
        # TDMS defects spread along entire electrified sections
        if "NDLS_GZB" in section_id:
            km_start = random.uniform(2.0, 22.0)
        elif "GZB_ALJN" in section_id:
            km_start = random.uniform(25.0, 128.0)
        elif "ALJN_TDL" in section_id:
            km_start = random.uniform(132.0, 180.0)
        else:
            km_start = random.uniform(184.0, 438.0)
        
        km_end = km_start + random.uniform(0.5, 2.0)  # OHE work sections
        
        priority = priority_base + random.uniform(-5.0, 3.0)
        priority = max(42.0, min(99.0, priority))
        
        if severity == "EMERGENCY":
            due_days = 0
        elif severity == "CRITICAL":
            due_days = random.randint(1, 3)
        elif severity == "PLANNED_HIGH":
            due_days = random.randint(3, 12)
        else:
            due_days = random.randint(12, 35)
        
        requests.append({
            "request_id": f"TDMS_2026_09_{i+1:03d}",
            "department": "TDMS",
            "division_id": "DIV_DLI" if "GZB" in section_id or "NDLS" in section_id else "DIV_PRYJ",
            "section_id": section_id,
            "from_km": round(km_start, 2),
            "to_km": round(km_end, 2),
            "asset_type": random.choice(["OHE_CATENARY", "CONTACT_WIRE", "INSULATOR", "MAST", "DROPPER"]),
            "defect_type": defect_type,
            "severity": severity,
            "description": f"TDMS {defect_type.replace('_', ' ').title()} at KM {km_start:.1f}-{km_end:.1f}",
            "estimated_duration_minutes": duration + random.randint(-15, 25),
            "required_machine_type": machine,
            "due_date": (base_date + timedelta(days=due_days)).isoformat(),
            "priority_score": round(priority, 2),
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 12))).isoformat()
        })
    
    # Create intentional co-located clusters for bundling opportunities
    # Cluster 1: KM 44-46 on SEC_GZB_ALJN_UP (TMS + SMMS + TDMS)
    cluster_1_base_km = 44.5
    requests.extend([
        {
            "request_id": "TMS_CLUSTER1_001",
            "department": "TMS",
            "division_id": "DIV_DLI",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": cluster_1_base_km,
            "to_km": cluster_1_base_km + 1.8,
            "asset_type": "RAIL",
            "defect_type": "RAIL_CORRUGATION",
            "severity": "CRITICAL",
            "description": "Rail corrugation requiring tamping at major freight section",
            "estimated_duration_minutes": 120,
            "required_machine_type": "TAMPING_MACHINE",
            "due_date": (base_date + timedelta(days=3)).isoformat(),
            "priority_score": 88.5,
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=2)).isoformat()
        },
        {
            "request_id": "SMMS_CLUSTER1_002",
            "department": "SMMS",
            "division_id": "DIV_DLI",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": cluster_1_base_km + 0.3,
            "to_km": cluster_1_base_km + 0.6,
            "asset_type": "POINT_MACHINE",
            "defect_type": "POINT_MACHINE_SLUGGISH",
            "severity": "PLANNED_HIGH",
            "description": "Point machine sluggish operation at loop entry",
            "estimated_duration_minutes": 90,
            "required_machine_type": None,
            "due_date": (base_date + timedelta(days=3)).isoformat(),
            "priority_score": 76.0,
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=2)).isoformat()
        },
        {
            "request_id": "TDMS_CLUSTER1_003",
            "department": "TDMS",
            "division_id": "DIV_DLI",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": cluster_1_base_km,
            "to_km": cluster_1_base_km + 1.5,
            "asset_type": "CONTACT_WIRE",
            "defect_type": "CONTACT_WIRE_WEAR_EXCESSIVE",
            "severity": "PLANNED_HIGH",
            "description": "Contact wire showing excessive wear, adjustment required",
            "estimated_duration_minutes": 105,
            "required_machine_type": "TOWER_WAGON",
            "due_date": (base_date + timedelta(days=3)).isoformat(),
            "priority_score": 79.0,
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=2)).isoformat()
        }
    ])
    
    # Cluster 2: KM 130-132 at Aligarh Junction (division boundary - critical!)
    cluster_2_base_km = 130.5
    requests.extend([
        {
            "request_id": "TMS_CLUSTER2_001",
            "department": "TMS",
            "division_id": "DIV_PRYJ",
            "section_id": "SEC_ALJN_TDL_UP",
            "from_km": cluster_2_base_km,
            "to_km": cluster_2_base_km + 2.0,
            "asset_type": "TRACK_GEOMETRY",
            "defect_type": "TRACK_GEOMETRY_DEVIATION",
            "severity": "CRITICAL",
            "description": "Track geometry deviation at high-speed zone entering Aligarh",
            "estimated_duration_minutes": 135,
            "required_machine_type": "TAMPING_MACHINE",
            "due_date": (base_date + timedelta(days=2)).isoformat(),
            "priority_score": 91.0,
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=1)).isoformat()
        },
        {
            "request_id": "SMMS_CLUSTER2_002",
            "department": "SMMS",
            "division_id": "DIV_PRYJ",
            "section_id": "SEC_ALJN_TDL_UP",
            "from_km": cluster_2_base_km + 0.8,
            "to_km": cluster_2_base_km + 1.2,
            "asset_type": "SIGNAL",
            "defect_type": "SIGNAL_LAMP_FAILURE",
            "severity": "CRITICAL",
            "description": "Distant signal lamp failure at approach to major junction",
            "estimated_duration_minutes": 75,
            "required_machine_type": "TOWER_WAGON",
            "due_date": (base_date + timedelta(days=2)).isoformat(),
            "priority_score": 87.5,
            "safety_risk_index": 0.0,
            "status": "PENDING",
            "created_at": (datetime.now() - timedelta(days=1)).isoformat()
        }
    ])
    
    # Sort by priority score (highest first)
    requests.sort(key=lambda x: x["priority_score"], reverse=True)
    
    return requests


def print_backlog_statistics(requests: List[Dict[str, Any]]):
    """Print summary statistics of generated backlog"""
    total = len(requests)
    
    by_dept = {
        "TMS": len([r for r in requests if r["department"] == "TMS"]),
        "SMMS": len([r for r in requests if r["department"] == "SMMS"]),
        "TDMS": len([r for r in requests if r["department"] == "TDMS"])
    }
    
    by_severity = {
        "EMERGENCY": len([r for r in requests if r["severity"] == "EMERGENCY"]),
        "CRITICAL": len([r for r in requests if r["severity"] == "CRITICAL"]),
        "PLANNED_HIGH": len([r for r in requests if r["severity"] == "PLANNED_HIGH"]),
        "ROUTINE": len([r for r in requests if r["severity"] == "ROUTINE"])
    }
    
    need_machines = len([r for r in requests if r["required_machine_type"] is not None])
    
    print(f"\n{'='*60}")
    print(f"MAINTENANCE BACKLOG GENERATED: {total} Requests")
    print(f"{'='*60}")
    print(f"\nDepartment Distribution:")
    print(f"  TMS (Track):      {by_dept['TMS']:3d} ({by_dept['TMS']/total*100:.1f}%)")
    print(f"  SMMS (Signal):    {by_dept['SMMS']:3d} ({by_dept['SMMS']/total*100:.1f}%)")
    print(f"  TDMS (Electrical):{by_dept['TDMS']:3d} ({by_dept['TDMS']/total*100:.1f}%)")
    
    print(f"\nSeverity Distribution:")
    print(f"  EMERGENCY:        {by_severity['EMERGENCY']:3d} ({by_severity['EMERGENCY']/total*100:.1f}%)")
    print(f"  CRITICAL:         {by_severity['CRITICAL']:3d} ({by_severity['CRITICAL']/total*100:.1f}%)")
    print(f"  PLANNED_HIGH:     {by_severity['PLANNED_HIGH']:3d} ({by_severity['PLANNED_HIGH']/total*100:.1f}%)")
    print(f"  ROUTINE:          {by_severity['ROUTINE']:3d} ({by_severity['ROUTINE']/total*100:.1f}%)")
    
    print(f"\nMachine Requirements:")
    print(f"  Need machinery:   {need_machines:3d} ({need_machines/total*100:.1f}%)")
    print(f"  Manual work:      {total-need_machines:3d} ({(total-need_machines)/total*100:.1f}%)")
    
    print(f"\nBundling Opportunities:")
    print(f"  Co-located clusters created: 2")
    print(f"  Cluster 1 (KM 44-46):  3 requests (TMS + SMMS + TDMS)")
    print(f"  Cluster 2 (KM 130-132): 2 requests (TMS + SMMS)")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    requests = generate_maintenance_backlog(100)
    print_backlog_statistics(requests)
    
    # Save to JSON for easy import
    import json
    with open("maintenance_backlog_100.json", "w") as f:
        json.dump(requests, f, indent=2)
    print("✅ Saved to maintenance_backlog_100.json")
