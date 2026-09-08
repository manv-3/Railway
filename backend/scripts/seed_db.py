import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.connection import Base, engine, SessionLocal
from database.models import (
    OperationalJurisdiction, Station, Section, MaintenanceMachinery,
    TrainSchedule, MaintenanceRequest, User
)
from scripts.generate_corridor_data import generate_corridor_dataset
from datetime import datetime
from sqlalchemy import text

def seed_database():
    print("Dropping existing tables and recreating cleanly in PostgreSQL...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        data = generate_corridor_dataset()

        # 1. Jurisdictions
        for j in data["jurisdictions"]:
            if not session.query(OperationalJurisdiction).filter_by(id=j["id"]).first():
                session.add(OperationalJurisdiction(**j))
        session.commit()
        print(f"Seeded {len(data['jurisdictions'])} Jurisdictions.")

        # 2. Stations
        for s in data["stations"]:
            if not session.query(Station).filter_by(code=s["code"]).first():
                session.add(Station(
                    code=s["code"],
                    name=s["name"],
                    division_id=s["division_id"],
                    kilometer_mark=s["kilometer_mark"],
                    latitude=s["latitude"],
                    longitude=s["longitude"],
                    number_of_platforms=s["platforms"]
                ))
        session.commit()
        print(f"Seeded {len(data['stations'])} Stations.")

        # 3. Sections
        for sec in data["sections"]:
            if not session.query(Section).filter_by(id=sec["id"]).first():
                session.add(Section(
                    id=sec["id"],
                    name=sec["name"],
                    division_id=sec["division_id"],
                    start_station_code=sec["start_station_code"],
                    end_station_code=sec["end_station_code"],
                    start_km=sec["start_km"],
                    end_km=sec["end_km"],
                    track_direction=sec["track_direction"],
                    speed_limit_kmh=sec["speed_limit_kmh"]
                ))
        session.commit()
        print(f"Seeded {len(data['sections'])} Directional Track Sections.")

        # 4. Machinery
        for m in data["machinery"]:
            if not session.query(MaintenanceMachinery).filter_by(id=m["id"]).first():
                session.add(MaintenanceMachinery(
                    id=m["id"],
                    machine_type=m["machine_type"],
                    home_zone_id=m["home_zone_id"],
                    assigned_division_id=m["assigned_division_id"],
                    current_station_code=m["current_station_code"],
                    operational_status=m["status"]
                ))
        session.commit()
        print(f"Seeded {len(data['machinery'])} Track Machines & Tower Wagons.")

        # 5. Trains
        for tr in data["trains"]:
            if not session.query(TrainSchedule).filter_by(train_number=tr["train_number"]).first():
                now = datetime.utcnow()
                session.add(TrainSchedule(
                    train_number=tr["train_number"],
                    train_name=tr["train_name"],
                    train_category=tr["train_category"],
                    priority_precedence=tr["priority_precedence"],
                    source_station_code=tr["source"],
                    dest_station_code=tr["dest"],
                    scheduled_departure=now,
                    scheduled_arrival=now,
                    route_sections=[{"section_id": tr["section_id"], "entry_minute": tr["entry_minute"], "exit_minute": tr["exit_minute"]}]
                ))
        session.commit()
        print(f"Seeded {len(data['trains'])} Timetabled Trains.")

        # 6. Maintenance Requests
        for req in data["requests"]:
            if not session.query(MaintenanceRequest).filter_by(request_id=req["request_id"]).first():
                session.add(MaintenanceRequest(
                    request_id=req["request_id"],
                    department=req["department"],
                    division_id="DIV_DLI",
                    section_id=req["section_id"],
                    from_km=req["from_km"],
                    to_km=req["to_km"],
                    asset_type=req["asset_type"],
                    defect_type=req["defect_type"],
                    severity=req["severity"],
                    estimated_duration_minutes=req["estimated_duration_minutes"],
                    required_machine_type=req["required_machine_type"],
                    due_date=req["due_date"],
                    priority_score=req["priority_score"]
                ))
        session.commit()
        print(f"Seeded {len(data['requests'])} Maintenance Requests.")

        print("Database seeding completed successfully! Ready for optimization.")

    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
