"""
Master Database Seeder - Loads Complete Railway System Data
Integrates all data generators for one-command database initialization
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from database.connection import Base, SessionLocal, engine
from database.models import (
    OperationalJurisdiction, Station, Section, MaintenanceMachinery,
    TrainSchedule, MaintenanceRequest, User
)
from scripts.generate_corridor_data import generate_corridor_dataset
from scripts.seed_realistic_trains import generate_realistic_train_schedules  
from scripts.seed_maintenance_backlog import generate_maintenance_backlog


def _minute_of_day(clock_time: str) -> int:
    """Convert an ``HH:MM`` timetable value (including 24+ hour values) to minutes."""
    hour, minute = (int(part) for part in clock_time.split(":", 1))
    return hour * 60 + minute


def _normalise_route_sections(route_sections):
    """Add solver-ready minute offsets while retaining the original timetable fields."""
    normalised = []
    for section in route_sections:
        segment = dict(section)
        if "entry_minute" not in segment and segment.get("entry_time"):
            segment["entry_minute"] = _minute_of_day(segment["entry_time"])
        if "exit_minute" not in segment and segment.get("exit_time"):
            segment["exit_minute"] = _minute_of_day(segment["exit_time"])
        if (
            isinstance(segment.get("entry_minute"), int)
            and isinstance(segment.get("exit_minute"), int)
            and segment["exit_minute"] <= segment["entry_minute"]
        ):
            # A segment that crosses midnight still occupies the final part of
            # this day's planning horizon.
            segment["exit_minute"] += 24 * 60
        normalised.append(segment)
    return normalised


def seed_jurisdictions(session):
    """Seed 4-tier operational hierarchy"""
    print("\n📋 Seeding Jurisdictions (4-Tier Hierarchy)...")
    
    jurisdictions = [
        OperationalJurisdiction(
            id="BOARD_IR",
            name="Railway Board (Rail Bhavan)",
            tier_level="BOARD",
            parent_id=None,
            code="RB"
        ),
        OperationalJurisdiction(
            id="ZONE_NR",
            name="Northern Railway",
            tier_level="ZONE",
            parent_id="BOARD_IR",
            code="NR"
        ),
        OperationalJurisdiction(
            id="ZONE_NCR",
            name="North Central Railway",
            tier_level="ZONE",
            parent_id="BOARD_IR",
            code="NCR"
        ),
        OperationalJurisdiction(
            id="DIV_DLI",
            name="Delhi Division",
            tier_level="DIVISION",
            parent_id="ZONE_NR",
            code="DLI"
        ),
        OperationalJurisdiction(
            id="DIV_PRYJ",
            name="Prayagraj Division",
            tier_level="DIVISION",
            parent_id="ZONE_NCR",
            code="PRYJ"
        ),
    ]
    
    for jurisdiction in jurisdictions:
        existing = session.query(OperationalJurisdiction).filter_by(id=jurisdiction.id).first()
        if not existing:
            session.add(jurisdiction)
    
    session.commit()
    print(f"   ✅ Created {len(jurisdictions)} jurisdictions")


def seed_demo_users(session):
    """Seed demo users for 4-tier access"""
    print("\n👤 Seeding Demo Users...")
    
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    demo_users = [
        {
            "username": "board_exec",
            "email": "board@railway.gov.in",
            "password": "demo123",
            "full_name": "Railway Board Executive",
            "tier_role": "BOARD_EXEC",
            "department": "ALL",
            "jurisdiction_id": "BOARD_IR",
            "phone": "+91-11-23389999"
        },
        {
            "username": "zonal_gm",
            "email": "gm.nr@railway.gov.in",
            "password": "demo123",
            "full_name": "General Manager - Northern Railway",
            "tier_role": "ZONAL_HEAD",
            "department": "ALL",
            "jurisdiction_id": "ZONE_NR",
            "phone": "+91-11-23344000"
        },
        {
            "username": "div_controller",
            "email": "srdom.dli@railway.gov.in",
            "password": "demo123",
            "full_name": "Sr. DOM - Delhi Division",
            "tier_role": "DIV_CONTROLLER",
            "department": "OPERATING",
            "jurisdiction_id": "DIV_DLI",
            "phone": "+91-11-23401234"
        },
        {
            "username": "field_sse",
            "email": "sse.pway.gzb@railway.gov.in",
            "password": "demo123",
            "full_name": "SSE P-Way - Ghaziabad",
            "tier_role": "FIELD_SSE",
            "department": "ENGINEERING",
            "jurisdiction_id": "DIV_DLI",
            "phone": "+91-120-2782345"
        },
        {
            "username": "station_master",
            "email": "sm.gzb@railway.gov.in",
            "password": "demo123",
            "full_name": "Station Master - Ghaziabad",
            "tier_role": "STATION_MASTER",
            "department": "OPERATING",
            "jurisdiction_id": "DIV_DLI",
            "phone": "+91-120-2785000"
        }
    ]
    
    for user_data in demo_users:
        existing = session.query(User).filter_by(username=user_data["username"]).first()
        if not existing:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                full_name=user_data["full_name"],
                tier_role=user_data["tier_role"],
                department=user_data["department"],
                jurisdiction_id=user_data["jurisdiction_id"],
                phone=user_data["phone"],
                active=True
            )
            session.add(user)
    
    session.commit()
    print(f"   ✅ Created {len(demo_users)} demo users")
    print("\n   📝 Demo Credentials:")
    print("   ├── Board:    board_exec / demo123")
    print("   ├── Zonal:    zonal_gm / demo123")
    print("   ├── Division: div_controller / demo123")
    print("   ├── Field:    field_sse / demo123")
    print("   └── Station:  station_master / demo123")


def seed_stations_and_sections(session):
    """Seed stations and track sections"""
    print("\n🚉 Seeding Stations & Track Sections...")
    
    corridor_data = generate_corridor_dataset()
    
    # Seed stations
    station_count = 0
    for station_data in corridor_data.get("stations", []):
        existing = session.query(Station).filter_by(code=station_data["code"]).first()
        if not existing:
            station = Station(
                **{key: value for key, value in station_data.items() if key != "platforms"},
                number_of_platforms=station_data["platforms"],
            )
            session.add(station)
            station_count += 1
    
    session.commit()
    print(f"   ✅ Created {station_count} stations")
    
    # Seed sections
    section_count = 0
    for section_data in corridor_data.get("sections", []):
        existing = session.query(Section).filter_by(id=section_data["id"]).first()
        if not existing:
            section = Section(**section_data)
            session.add(section)
            section_count += 1
    
    session.commit()
    print(f"   ✅ Created {section_count} track sections")


def seed_machinery(session):
    """Seed maintenance machinery fleet"""
    print("\n🚜 Seeding Maintenance Machinery...")
    
    machinery_data = [
        {"id": "TAMP_DLI_01", "machine_type": "TAMPING_MACHINE", "home_zone_id": "ZONE_NR", 
         "assigned_division_id": "DIV_DLI", "current_station_code": "GZB", "operational_status": "AVAILABLE"},
        {"id": "TAMP_DLI_02", "machine_type": "TAMPING_MACHINE", "home_zone_id": "ZONE_NR",
         "assigned_division_id": "DIV_DLI", "current_station_code": "NDLS", "operational_status": "AVAILABLE"},
        {"id": "TAMP_PRYJ_01", "machine_type": "TAMPING_MACHINE", "home_zone_id": "ZONE_NCR",
         "assigned_division_id": "DIV_PRYJ", "current_station_code": "ALJN", "operational_status": "AVAILABLE"},
        {"id": "TOWER_WAGON_07", "machine_type": "TOWER_WAGON", "home_zone_id": "ZONE_NR",
         "assigned_division_id": "DIV_DLI", "current_station_code": "GZB", "operational_status": "AVAILABLE"},
        {"id": "TOWER_WAGON_08", "machine_type": "TOWER_WAGON", "home_zone_id": "ZONE_NR",
         "assigned_division_id": "DIV_DLI", "current_station_code": "NDLS", "operational_status": "AVAILABLE"},
        {"id": "TOWER_WAGON_12", "machine_type": "TOWER_WAGON", "home_zone_id": "ZONE_NCR",
         "assigned_division_id": "DIV_PRYJ", "current_station_code": "TDL", "operational_status": "AVAILABLE"},
        {"id": "BCM_NCR_01", "machine_type": "BALLAST_CLEANER", "home_zone_id": "ZONE_NCR",
         "assigned_division_id": "DIV_PRYJ", "current_station_code": "CNB", "operational_status": "AVAILABLE"},
    ]
    
    for machine_data in machinery_data:
        existing = session.query(MaintenanceMachinery).filter_by(id=machine_data["id"]).first()
        if not existing:
            machine = MaintenanceMachinery(**machine_data)
            session.add(machine)
    
    session.commit()
    print(f"   ✅ Created {len(machinery_data)} maintenance machines")


def seed_trains(session):
    """Seed realistic train schedules"""
    print("\n🚂 Seeding Train Schedules...")
    
    trains = generate_realistic_train_schedules()
    
    train_count = 0
    for train_data in trains:
        existing = session.query(TrainSchedule).filter_by(train_number=train_data["train_number"]).first()
        if not existing:
            train_data = dict(train_data)
            train_data["route_sections"] = _normalise_route_sections(train_data.get("route_sections", []))
            train = TrainSchedule(**train_data)
            session.add(train)
            train_count += 1
    
    session.commit()
    print(f"   ✅ Created {train_count} train schedules")
    print(f"      ├── Vande Bharat: {sum(1 for t in trains if 'VANDE_BHARAT' in t['train_category'])}")
    print(f"      ├── Rajdhani/Shatabdi: {sum(1 for t in trains if t['train_category'] in ['RAJDHANI', 'SUPERFAST_EXPRESS'] and t['priority_precedence'] == 1)}")
    print(f"      ├── Express: {sum(1 for t in trains if t['train_category'] == 'SUPERFAST_EXPRESS' and t['priority_precedence'] == 2)}")
    print(f"      ├── Passenger: {sum(1 for t in trains if t['train_category'] == 'PASSENGER_LOCAL')}")
    print(f"      └── Freight: {sum(1 for t in trains if t['train_category'] == 'HEAVY_FREIGHT')}")


def seed_maintenance_requests(session):
    """Seed realistic maintenance backlog"""
    print("\n🔧 Seeding Maintenance Requests...")
    
    requests = generate_maintenance_backlog(100)
    
    request_count = 0
    for request_data in requests:
        existing = session.query(MaintenanceRequest).filter_by(request_id=request_data["request_id"]).first()
        if not existing:
            request_data_clean = {k: v for k, v in request_data.items() if k != "created_at"}
            if isinstance(request_data_clean.get("due_date"), str):
                request_data_clean["due_date"] = datetime.fromisoformat(request_data_clean["due_date"])
            request = MaintenanceRequest(**request_data_clean)
            session.add(request)
            request_count += 1
    
    session.commit()
    print(f"   ✅ Created {request_count} maintenance requests")
    print(f"      ├── TMS (Track): {sum(1 for r in requests if r['department'] == 'TMS')}")
    print(f"      ├── SMMS (Signal): {sum(1 for r in requests if r['department'] == 'SMMS')}")
    print(f"      └── TDMS (Electrical): {sum(1 for r in requests if r['department'] == 'TDMS')}")
    
    emergency = sum(1 for r in requests if r['severity'] == 'EMERGENCY')
    critical = sum(1 for r in requests if r['severity'] == 'CRITICAL')
    print(f"      ├── Emergency: {emergency}")
    print(f"      └── Critical: {critical}")


def seed_all():
    """Master seed function"""
    print("="*70)
    print("🚂 INDIAN RAILWAYS AI BLOCK PLANNING PLATFORM")
    print("   Master Database Seeder")
    print("="*70)
    print(f"\n⏰ Started at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    
    try:
        # This is deliberately non-destructive: the master seeder can be run
        # repeatedly without wiping operational records.
        Base.metadata.create_all(bind=engine)
        session = SessionLocal()
        
        # Seed in dependency order
        seed_jurisdictions(session)
        seed_demo_users(session)
        seed_stations_and_sections(session)
        seed_machinery(session)
        seed_trains(session)
        seed_maintenance_requests(session)
        
        print("\n" + "="*70)
        print("✅ DATABASE SEEDING COMPLETE!")
        print("="*70)
        print("\n📊 Summary (database totals):")
        summary = {
            "Jurisdictions": session.query(OperationalJurisdiction).count(),
            "Users": session.query(User).count(),
            "Stations": session.query(Station).count(),
            "Sections": session.query(Section).count(),
            "Machinery": session.query(MaintenanceMachinery).count(),
            "Trains": session.query(TrainSchedule).count(),
            "Maintenance Requests": session.query(MaintenanceRequest).count(),
        }
        for label, count in summary.items():
            print(f"   ✅ {label}: {count}")
        session.close()
        print("\n🚀 System Ready for Demo!")
        print("\n💡 Quick Start:")
        print("   docker-compose up -d")
        print("   # Backend: http://localhost:8000")
        print("   # Frontend: http://localhost:5173")
        print("   # Login: field_sse / demo123")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = seed_all()
    sys.exit(0 if success else 1)
