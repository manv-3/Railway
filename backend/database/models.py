from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Numeric
)
from sqlalchemy.orm import relationship
from .connection import Base

class OperationalJurisdiction(Base):
    __tablename__ = "operational_jurisdictions"

    id = Column(String(50), primary_key=True) # e.g., 'BOARD_IR', 'ZONE_NR', 'DIV_DLI'
    name = Column(String(100), nullable=False)
    tier_level = Column(String(20), nullable=False) # 'BOARD', 'ZONE', 'DIVISION', 'SECTION'
    parent_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    code = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("OperationalJurisdiction", remote_side=[id], backref="children")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    tier_role = Column(String(30), nullable=False) # 'BOARD_EXEC', 'ZONAL_HEAD', 'DIV_CONTROLLER', 'FIELD_SSE', 'STATION_MASTER'
    department = Column(String(20), nullable=True) # 'OPERATING', 'ENGINEERING', 'SIGNALLING', 'ELECTRICAL', 'ALL'
    jurisdiction_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    phone = Column(String(20), nullable=True)
    active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    jurisdiction = relationship("OperationalJurisdiction")

class Station(Base):
    __tablename__ = "stations"

    code = Column(String(10), primary_key=True) # e.g., 'NDLS', 'GZB', 'CNB'
    name = Column(String(100), nullable=False)
    division_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    kilometer_mark = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    number_of_platforms = Column(Integer, default=2)
    has_loop_lines = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    division = relationship("OperationalJurisdiction")

class Section(Base):
    __tablename__ = "sections"

    id = Column(String(50), primary_key=True) # e.g., 'SEC_NDLS_GZB_UP'
    name = Column(String(100), nullable=False)
    division_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    start_station_code = Column(String(10), ForeignKey("stations.code"), nullable=False)
    end_station_code = Column(String(10), ForeignKey("stations.code"), nullable=False)
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=False)
    track_direction = Column(String(20), nullable=False) # 'UP', 'DOWN', 'COMMON_LOOP', 'THIRD_LINE', 'YARD'
    speed_limit_kmh = Column(Integer, default=130)
    is_electrified = Column(Boolean, default=True)
    ohe_subsector_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    start_station = relationship("Station", foreign_keys=[start_station_code])
    end_station = relationship("Station", foreign_keys=[end_station_code])
    division = relationship("OperationalJurisdiction")

class MaintenanceMachinery(Base):
    __tablename__ = "maintenance_machinery"

    id = Column(String(50), primary_key=True) # e.g., 'TAMP_042', 'TOWER_WAGON_07'
    machine_type = Column(String(50), nullable=False) # 'TAMPING_MACHINE', 'BALLAST_CLEANER', 'TOWER_WAGON'
    home_zone_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    assigned_division_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    current_station_code = Column(String(10), ForeignKey("stations.code"), nullable=True)
    operational_status = Column(String(20), default="AVAILABLE") # 'AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE'
    capacity_rate_per_hour = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    division = relationship("OperationalJurisdiction", foreign_keys=[assigned_division_id])
    station = relationship("Station")

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(50), unique=True, nullable=False, index=True) # e.g., 'TMS_2026_09_001'
    department = Column(String(20), nullable=False, index=True) # 'TMS', 'SMMS', 'TDMS'
    division_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    section_id = Column(String(50), ForeignKey("sections.id"), nullable=False, index=True)
    from_km = Column(Float, nullable=False)
    to_km = Column(Float, nullable=False)
    asset_type = Column(String(50), nullable=False) # 'RAIL', 'SLEEPER', 'POINT_MACHINE', 'OHE_CATENARY'
    defect_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False) # 'EMERGENCY', 'CRITICAL', 'PLANNED_HIGH', 'ROUTINE'
    description = Column(Text, nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=False)
    required_machine_type = Column(String(50), nullable=True)
    assigned_machinery_id = Column(String(50), ForeignKey("maintenance_machinery.id"), nullable=True)
    due_date = Column(DateTime, nullable=False)
    priority_score = Column(Float, default=0.0, index=True)
    safety_risk_index = Column(Float, default=0.0)
    status = Column(String(20), default="PENDING", index=True) # 'PENDING', 'OPTIMIZED', 'SANCTIONED', 'DISCONNECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    section = relationship("Section")
    division = relationship("OperationalJurisdiction")
    machinery = relationship("MaintenanceMachinery")
    created_by = relationship("User")

class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), unique=True, nullable=False, index=True) # e.g., '12002', '22436'
    train_name = Column(String(100), nullable=False)
    train_category = Column(String(30), nullable=False) # 'VANDE_BHARAT', 'RAJDHANI', 'SUPERFAST_EXPRESS', 'PASSENGER_LOCAL', 'HEAVY_FREIGHT'
    priority_precedence = Column(Integer, nullable=False, default=2) # 1=Highest (Vande Bharat/Rajdhani), 4=Lowest (Freight)
    source_station_code = Column(String(10), nullable=False)
    dest_station_code = Column(String(10), nullable=False)
    scheduled_departure = Column(DateTime, nullable=False)
    scheduled_arrival = Column(DateTime, nullable=False)
    route_sections = Column(JSON, nullable=False) # Array of {section_id, entry_minute, exit_minute}
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(50), unique=True, nullable=False, index=True)
    division_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    start_window = Column(DateTime, nullable=False)
    end_window = Column(DateTime, nullable=False)
    algorithm_used = Column(String(50), default="OR_TOOLS_CPSAT")
    total_input_requests = Column(Integer, nullable=False)
    scheduled_requests = Column(Integer, nullable=False)
    total_blocks_created = Column(Integer, nullable=False)
    combined_super_blocks = Column(Integer, nullable=False)
    total_time_saved_hours = Column(Float, nullable=False)
    asset_availability_gain_percent = Column(Float, nullable=False)
    train_delay_penalty_minutes = Column(Integer, default=0)
    solver_wall_time_seconds = Column(Float, nullable=False)
    status = Column(String(20), default="SUCCESS")
    executed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    division = relationship("OperationalJurisdiction")
    executed_by = relationship("User")

class MaintenanceBlock(Base):
    __tablename__ = "maintenance_blocks"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(String(50), unique=True, nullable=False, index=True) # e.g., 'BLK_DLI_20260908_01'
    division_id = Column(String(50), ForeignKey("operational_jurisdictions.id"), nullable=True)
    section_id = Column(String(50), ForeignKey("sections.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    total_duration_minutes = Column(Integer, nullable=False)
    block_type = Column(String(30), default="SINGLE_DEPARTMENT") # 'COMBINED_SUPER_BLOCK', 'SINGLE_DEPARTMENT', 'EMERGENCY_SHUTDOWN'
    is_combined = Column(Boolean, default=False)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id"), nullable=True)
    status = Column(String(30), default="PLANNED", index=True) # 'PLANNED', 'SANCTIONED', 'DISCONNECTED', 'IN_PROGRESS', 'FIT_RESTORED', 'CANCELLED'

    # Legal Railway Safety Protocol Fields
    sanctioned_by_dom_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sanctioned_by_tech_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sanction_timestamp = Column(DateTime, nullable=True)
    disconnection_memo_number = Column(String(50), nullable=True)
    disconnection_memo_time = Column(DateTime, nullable=True)
    permit_to_work_ptw_number = Column(String(50), nullable=True)
    ptw_verified_by_tpc = Column(String(100), nullable=True)
    track_fit_cert_issued = Column(Boolean, default=False)
    track_fit_timestamp = Column(DateTime, nullable=True)
    post_block_tsr_speed_kmh = Column(Integer, nullable=True) # e.g., 30 km/h caution order
    post_block_tsr_duration_hours = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    section = relationship("Section")
    division = relationship("OperationalJurisdiction")
    optimization_run = relationship("OptimizationRun")
    assignments = relationship("BlockRequestAssignment", back_populates="block", cascade="all, delete-orphan")

class BlockRequestAssignment(Base):
    __tablename__ = "block_request_assignments"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("maintenance_blocks.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(Integer, ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    block = relationship("MaintenanceBlock", back_populates="assignments")
    request = relationship("MaintenanceRequest")

class TrainImpact(Base):
    __tablename__ = "train_impacts"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("maintenance_blocks.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE") if hasattr(Base, "trains") else ForeignKey("train_schedules.id"), nullable=False)
    estimated_delay_minutes = Column(Integer, nullable=False)
    impact_type = Column(String(30), nullable=False) # 'DELAYED_ON_RUN', 'HELD_AT_LOOP_LINE', 'REROUTED', 'REGULATED'
    regulation_station_code = Column(String(10), ForeignKey("stations.code"), nullable=True)
    is_passenger_train = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    block = relationship("MaintenanceBlock")
    train = relationship("TrainSchedule")
    station = relationship("Station")

class ExplainabilityBrief(Base):
    __tablename__ = "explainability_briefs"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("maintenance_blocks.id", ondelete="CASCADE"), nullable=False)
    executive_summary = Column(Text, nullable=False)
    safety_risk_tradeoff = Column(Text, nullable=False)
    shap_factors = Column(JSON, nullable=False)
    rejected_alternatives = Column(JSON, nullable=True)
    confidence_score = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    block = relationship("MaintenanceBlock")

class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    scenario_type = Column(String(50), nullable=False) # 'EMERGENCY_RAIL_FRACTURE', 'PREMIUM_TRAIN_DELAY', 'TOWER_WAGON_BREAKDOWN'
    base_optimization_id = Column(Integer, ForeignKey("optimization_runs.id"), nullable=True)
    injected_parameters = Column(JSON, nullable=False)
    simulated_results = Column(JSON, nullable=False)
    reoptimization_wall_time_seconds = Column(Float, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User")
    base_optimization = relationship("OptimizationRun")


class AuditLogRecord(Base):
    """
    Statutory G&SR Immutable Audit Log (V3-03 - P1)
    Non-repudiable legal record for all safety-critical state mutations.
    Each sign-off (Sanction, Disconnection Memo, PTW, Track Fit) creates
    an immutable row with the actor's identity and a SHA-256 hash of the payload.
    """
    __tablename__ = "statutory_audit_logs"

    id = Column(Integer, primary_key=True)
    entity_type = Column(String(50))        # "MAINTENANCE_BLOCK", "DISCONNECTION_MEMO"
    entity_id = Column(String(100), index=True)
    action = Column(String(50))             # "SANCTION_GRANTED", "PTW_ISSUED", etc.
    actor_user_id = Column(String(50))
    actor_role = Column(String(50))
    client_ip = Column(String(45))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    payload_sha256 = Column(String(64))     # Cryptographic hash of transaction payload
    metadata_json = Column(JSON)
