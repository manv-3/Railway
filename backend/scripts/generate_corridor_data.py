"""
Synthetic Data Engine for Indian Railways Delhi - Kanpur High-Density Corridor.
Generates realistic Stations, Directional Track Sections, Rolling Stock Machinery,
Timetabled Train Paths, and Multi-Department Maintenance Requisitions (TMS, SMMS, TDMS).
"""

from datetime import datetime, timedelta
import random

def generate_corridor_dataset():
    # 1. Jurisdictions
    jurisdictions = [
        {"id": "BOARD_IR", "name": "Railway Board (Rail Bhavan)", "tier_level": "BOARD", "parent_id": None, "code": "RB"},
        {"id": "ZONE_NR", "name": "Northern Railway", "tier_level": "ZONE", "parent_id": "BOARD_IR", "code": "NR"},
        {"id": "ZONE_NCR", "name": "North Central Railway", "tier_level": "ZONE", "parent_id": "BOARD_IR", "code": "NCR"},
        {"id": "DIV_DLI", "name": "Delhi Division", "tier_level": "DIVISION", "parent_id": "ZONE_NR", "code": "DLI"},
        {"id": "DIV_PRYJ", "name": "Prayagraj Division", "tier_level": "DIVISION", "parent_id": "ZONE_NCR", "code": "PRYJ"},
        {"id": "SEC_GZB_ALJN", "name": "Ghaziabad - Aligarh Section", "tier_level": "SECTION", "parent_id": "DIV_DLI", "code": "GZB-ALJ"}
    ]

    # 2. Stations (Delhi - Kanpur Central Corridor)
    stations = [
        {"code": "NDLS", "name": "New Delhi", "division_id": "DIV_DLI", "kilometer_mark": 0.0, "latitude": 28.6428, "longitude": 77.2195, "platforms": 16},
        {"code": "ANVT", "name": "Anand Vihar Terminal", "division_id": "DIV_DLI", "kilometer_mark": 12.5, "latitude": 28.6502, "longitude": 77.3152, "platforms": 7},
        {"code": "GZB", "name": "Ghaziabad Junction", "division_id": "DIV_DLI", "kilometer_mark": 24.8, "latitude": 28.6692, "longitude": 77.4304, "platforms": 6},
        {"code": "ALJN", "name": "Aligarh Junction", "division_id": "DIV_PRYJ", "kilometer_mark": 131.2, "latitude": 27.8974, "longitude": 78.0880, "platforms": 5},
        {"code": "TDL", "name": "Tundla Junction", "division_id": "DIV_PRYJ", "kilometer_mark": 209.4, "latitude": 27.2085, "longitude": 78.2416, "platforms": 4},
        {"code": "ETW", "name": "Etawah Junction", "division_id": "DIV_PRYJ", "kilometer_mark": 301.6, "latitude": 26.7855, "longitude": 79.0264, "platforms": 5},
        {"code": "CNB", "name": "Kanpur Central", "division_id": "DIV_PRYJ", "kilometer_mark": 439.8, "latitude": 26.4547, "longitude": 80.3507, "platforms": 10}
    ]

    # 3. Directional Track Sections
    sections = [
        {"id": "SEC_NDLS_GZB_UP", "name": "New Delhi - Ghaziabad (Up Line)", "division_id": "DIV_DLI", "start_station_code": "NDLS", "end_station_code": "GZB", "start_km": 0.0, "end_km": 24.8, "track_direction": "UP", "speed_limit_kmh": 110},
        {"id": "SEC_NDLS_GZB_DN", "name": "New Delhi - Ghaziabad (Down Line)", "division_id": "DIV_DLI", "start_station_code": "GZB", "end_station_code": "NDLS", "start_km": 24.8, "end_km": 0.0, "track_direction": "DOWN", "speed_limit_kmh": 110},
        {"id": "SEC_GZB_ALJN_UP", "name": "Ghaziabad - Aligarh (Up Line)", "division_id": "DIV_DLI", "start_station_code": "GZB", "end_station_code": "ALJN", "start_km": 24.8, "end_km": 131.2, "track_direction": "UP", "speed_limit_kmh": 130},
        {"id": "SEC_GZB_ALJN_DN", "name": "Ghaziabad - Aligarh (Down Line)", "division_id": "DIV_DLI", "start_station_code": "ALJN", "end_station_code": "GZB", "start_km": 131.2, "end_km": 24.8, "track_direction": "DOWN", "speed_limit_kmh": 130},
        {"id": "SEC_ALJN_TDL_UP", "name": "Aligarh - Tundla (Up Line)", "division_id": "DIV_PRYJ", "start_station_code": "ALJN", "end_station_code": "TDL", "start_km": 131.2, "end_km": 209.4, "track_direction": "UP", "speed_limit_kmh": 130},
        {"id": "SEC_ALJN_TDL_DN", "name": "Aligarh - Tundla (Down Line)", "division_id": "DIV_PRYJ", "start_station_code": "TDL", "end_station_code": "ALJN", "start_km": 209.4, "end_km": 131.2, "track_direction": "DOWN", "speed_limit_kmh": 130},
        {"id": "SEC_TDL_CNB_UP", "name": "Tundla - Kanpur (Up Line)", "division_id": "DIV_PRYJ", "start_station_code": "TDL", "end_station_code": "CNB", "start_km": 209.4, "end_km": 439.8, "track_direction": "UP", "speed_limit_kmh": 130},
        {"id": "SEC_TDL_CNB_DN", "name": "Tundla - Kanpur (Down Line)", "division_id": "DIV_PRYJ", "start_station_code": "CNB", "end_station_code": "TDL", "start_km": 439.8, "end_km": 209.4, "track_direction": "DOWN", "speed_limit_kmh": 130}
    ]

    # 4. Specialized Maintenance Machinery Fleet (TMO)
    machinery = [
        {"id": "TAMP_DLI_01", "machine_type": "TAMPING_MACHINE", "home_zone_id": "ZONE_NR", "assigned_division_id": "DIV_DLI", "current_station_code": "GZB", "status": "AVAILABLE"},
        {"id": "TAMP_PRYJ_02", "machine_type": "TAMPING_MACHINE", "home_zone_id": "ZONE_NCR", "assigned_division_id": "DIV_PRYJ", "current_station_code": "ALJN", "status": "AVAILABLE"},
        {"id": "TOWER_WAGON_07", "machine_type": "TOWER_WAGON", "home_zone_id": "ZONE_NR", "assigned_division_id": "DIV_DLI", "current_station_code": "GZB", "status": "AVAILABLE"},
        {"id": "TOWER_WAGON_12", "machine_type": "TOWER_WAGON", "home_zone_id": "ZONE_NCR", "assigned_division_id": "DIV_PRYJ", "current_station_code": "TDL", "status": "AVAILABLE"},
        {"id": "BCM_NCR_01", "machine_type": "BALLAST_CLEANER", "home_zone_id": "ZONE_NCR", "assigned_division_id": "DIV_PRYJ", "current_station_code": "CNB", "status": "AVAILABLE"}
    ]

    # 5. Timetabled Trains (Vande Bharat, Rajdhani, Express, Heavy Freight)
    trains = [
        {"train_number": "22436", "train_name": "Vande Bharat Express (NDLS-BSB)", "train_category": "VANDE_BHARAT", "priority_precedence": 1, "source": "NDLS", "dest": "BSB", "section_id": "SEC_GZB_ALJN_DN", "entry_minute": 380, "exit_minute": 435},
        {"train_number": "12004", "train_name": "Lucknow Swarna Shatabdi", "train_category": "SUPERFAST_EXPRESS", "priority_precedence": 1, "source": "NDLS", "dest": "LKO", "section_id": "SEC_GZB_ALJN_DN", "entry_minute": 390, "exit_minute": 450},
        {"train_number": "12424", "train_name": "Dibrugarh Rajdhani Express", "train_category": "RAJDHANI", "priority_precedence": 1, "source": "NDLS", "dest": "DBRT", "section_id": "SEC_GZB_ALJN_DN", "entry_minute": 990, "exit_minute": 1045},
        {"train_number": "12002", "train_name": "Bhopal Shatabdi Express", "train_category": "SUPERFAST_EXPRESS", "priority_precedence": 1, "source": "NDLS", "dest": "RKMP", "section_id": "SEC_NDLS_GZB_UP", "entry_minute": 360, "exit_minute": 395},
        {"train_number": "12560", "train_name": "Shiv Ganga Express", "train_category": "SUPERFAST_EXPRESS", "priority_precedence": 2, "source": "NDLS", "dest": "BSBS", "section_id": "SEC_GZB_ALJN_DN", "entry_minute": 1220, "exit_minute": 1280},
        {"train_number": "14218", "train_name": "Unchahar Express", "train_category": "PASSENGER_LOCAL", "priority_precedence": 3, "source": "CSTM", "dest": "PYGS", "section_id": "SEC_GZB_ALJN_DN", "entry_minute": 1300, "exit_minute": 1370},
        {"train_number": "BOXN_COAL_01", "train_name": "Goods Train (Coal Rake)", "train_category": "HEAVY_FREIGHT", "priority_precedence": 4, "source": "CNB", "dest": "NDLS", "section_id": "SEC_GZB_ALJN_UP", "entry_minute": 180, "exit_minute": 260},
        {"train_number": "BCN_CEMENT_02", "train_name": "Goods Train (Cement)", "train_category": "HEAVY_FREIGHT", "priority_precedence": 4, "source": "GZB", "dest": "TDL", "section_id": "SEC_GZB_ALJN_DN", "entry_minute": 600, "exit_minute": 690}
    ]

    # 6. Maintenance Requests: Engineered with Co-located Bundling Opportunities
    base_due = datetime.utcnow() + timedelta(days=2)
    requests = [
        # CLUSTER 1: SEC_GZB_ALJN_UP (KM 44.0 - 46.5) -> TMS + SMMS + TDMS Co-located!
        {
            "request_id": "TMS_2026_09_001",
            "department": "TMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 44.2,
            "to_km": 45.8,
            "asset_type": "RAIL",
            "defect_type": "RAIL_FRACTURE_RISK",
            "severity": "CRITICAL",
            "estimated_duration_minutes": 120,
            "required_machine_type": "TAMPING_MACHINE",
            "priority_score": 88.5,
            "due_date": base_due
        },
        {
            "request_id": "SMMS_2026_09_002",
            "department": "SMMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 44.5,
            "to_km": 44.8,
            "asset_type": "POINT_MACHINE",
            "defect_type": "POINT_SLUGGISH_TEST",
            "severity": "PLANNED_HIGH",
            "estimated_duration_minutes": 90,
            "required_machine_type": None,
            "priority_score": 76.0,
            "due_date": base_due
        },
        {
            "request_id": "TDMS_2026_09_003",
            "department": "TDMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 44.0,
            "to_km": 46.0,
            "asset_type": "OHE_CATENARY",
            "defect_type": "INSULATOR_FLASHING_WASH",
            "severity": "PLANNED_HIGH",
            "estimated_duration_minutes": 90,
            "required_machine_type": "TOWER_WAGON",
            "priority_score": 74.5,
            "due_date": base_due
        },

        # CLUSTER 2: SEC_GZB_ALJN_DN (KM 88.0 - 90.0) -> TMS + TDMS Co-located!
        {
            "request_id": "TMS_2026_09_004",
            "department": "TMS",
            "section_id": "SEC_GZB_ALJN_DN",
            "from_km": 88.0,
            "to_km": 89.5,
            "asset_type": "SLEEPER",
            "defect_type": "SLEEPER_RENEWAL",
            "severity": "PLANNED_HIGH",
            "estimated_duration_minutes": 150,
            "required_machine_type": "TAMPING_MACHINE",
            "priority_score": 79.0,
            "due_date": base_due
        },
        {
            "request_id": "TDMS_2026_09_005",
            "department": "TDMS",
            "section_id": "SEC_GZB_ALJN_DN",
            "from_km": 88.5,
            "to_km": 90.0,
            "asset_type": "OHE_CATENARY",
            "defect_type": "CONTACT_WIRE_ADJUSTMENT",
            "severity": "ROUTINE",
            "estimated_duration_minutes": 100,
            "required_machine_type": "TOWER_WAGON",
            "priority_score": 62.0,
            "due_date": base_due
        },

        # CLUSTER 3: SEC_ALJN_TDL_UP (KM 165.0) -> S&T + Track
        {
            "request_id": "SMMS_2026_09_006",
            "department": "SMMS",
            "section_id": "SEC_ALJN_TDL_UP",
            "from_km": 164.8,
            "to_km": 165.2,
            "asset_type": "TRACK_CIRCUIT",
            "defect_type": "FALSE_DROP_CLEANING",
            "severity": "CRITICAL",
            "estimated_duration_minutes": 75,
            "required_machine_type": None,
            "priority_score": 84.0,
            "due_date": base_due
        },
        {
            "request_id": "TMS_2026_09_007",
            "department": "TMS",
            "section_id": "SEC_ALJN_TDL_UP",
            "from_km": 164.0,
            "to_km": 166.0,
            "asset_type": "RAIL",
            "defect_type": "CORRUGATION_GRINDING",
            "severity": "ROUTINE",
            "estimated_duration_minutes": 120,
            "required_machine_type": None,
            "priority_score": 58.0,
            "due_date": base_due
        }
    ]

    return {
        "jurisdictions": jurisdictions,
        "stations": stations,
        "sections": sections,
        "machinery": machinery,
        "trains": trains,
        "requests": requests
    }

if __name__ == "__main__":
    data = generate_corridor_dataset()
    print(f"Generated Indian Railways Dataset:")
    print(f"  • {len(data['jurisdictions'])} Jurisdictions")
    print(f"  • {len(data['stations'])} Stations ({data['stations'][0]['name']} to {data['stations'][-1]['name']})")
    print(f"  • {len(data['sections'])} Directional Sections")
    print(f"  • {len(data['machinery'])} Track Machines & Tower Wagons")
    print(f"  • {len(data['trains'])} Scheduled Train Paths")
    print(f"  • {len(data['requests'])} Maintenance Requests across TMS/SMMS/TDMS")
