# PS 26027: AI-Powered Automatic Block Planning System
## Full-Proof Architecture & Enterprise System Design (Indian Railways)

**Document Version**: 2.0 (Enterprise Multi-Tier Architecture)  
**Date**: September 2026  
**Target Systems**: Indian Railways (COA, TMS, SMMS, TDMS, RTIS)  
**Deployment Model**: Hybrid Cloud (RailTel Cloud / AWS GovCloud / Local Docker)

---

## 1. Executive Problem Realignment & Operational Realities

### 1.1 The Real-World Friction in Indian Railways
Block planning is not merely an abstract mathematical assignment problem; it is an **operational conflict between safety and punctuality**:
* **Operating Department (Traffic / Sr. DOM)** is penalized daily for punctuality loss (Punctuality Loss Statements). Consequently, Operating naturally resists granting blocks.
* **Maintenance Departments (Engineering/TMS, Signalling/SMMS, Traction/TDMS)** face escalating asset degradation. Denied blocks lead to catastrophic failures (rail fractures, point failures, OHE catenary snaps).
* **The Departmental Disconnection**: In current practice, three different Senior Section Engineers (SSE P-Way, SSE Signal, SSE OHE) submit maintenance requests independently. A 2-hour track tamping block, a 1.5-hour signal interlocking test, and a 2-hour OHE contact wire adjustment on the same track segment are performed on three separate days, causing **5.5 to 6 hours of cumulative traffic blockage**.
* **The Solution**: An intelligent system that unifies requests across departments, calculates an objective **Safety Risk vs. Punctuality Loss Trade-Off Index**, groups co-located works into a single **Combined Super-Block (2 to 2.5 hours total)**, and enforces the complete legal safety memo lifecycle (Disconnection $\rightarrow$ PTW $\rightarrow$ Track Fit $\rightarrow$ TSR).

---

## 2. 4-Tier Railway Organizational Hierarchy & Admin Panels

Indian Railways operates under a four-tier operational hierarchy. The system provides role-tailored administrative portals matching this structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIER 1: RAILWAY BOARD (APEX / NATIONAL)                  │
│  Portal: /board                                                             │
│  Users: Chairman Railway Board (CRB), Member (Infra), Member (Ops)          │
│  Focus: Macro Asset Availability, Punctuality Benchmarks, Deferred Backlog  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    TIER 2: ZONAL HEADQUARTERS (ZONAL HQ)                    │
│  Portal: /zone                                                              │
│  Users: General Manager (GM), PCOM (Operations), PCE (Track), PCSTE (Signal)│
│  Focus: Cross-Division Corridors, Zonal Machine Fleet (TMO), Mega-Blocks    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    TIER 3: DIVISIONAL CONTROL (TACTICAL CORE)               │
│  Portal: /division                                                          │
│  Users: Sr. DOM, Sr. DEN, Sr. DSTE, Sr. DEE, Section Controllers, CPRC      │
│  Focus: Daily Joint Optimization, What-If Simulator, Conflict Matrix, Grants│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    TIER 4: FIELD & STATIONS (EXECUTION TIER)                │
│  Portal: /field                                                             │
│  Users: SSE P-Way, SSE Signal, SSE OHE, Station Masters (SM), TPC           │
│  Focus: Ticket Requisition, Disconnection Memos, Permit-to-Work, Track Fit  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Portal Functional Specifications

#### Tier 1: Railway Board Executive Cockpit (`/board`)
* **National Corridor Availability Gauge**: Real-time KPI showing total track operating hours unlocked network-wide (+30–40% availability target).
* **Deferred Maintenance Risk Heatmap**: Spatial visualization of zones/divisions where high traffic has caused persistent block denials, signaling heightened derailment risks.
* **Inter-Zonal Punctuality vs. Maintenance Index**: Benchmark of punctuality loss caused by maintenance vs. unforced equipment breakdowns across all 17 zones.
* **Capital Asset Utilization**: Utilization rates of national heavy track machines (Plasser & Theurer tampers, BCMs, dynamic track stabilizers).

#### Tier 2: Zonal Strategic Dashboard (`/zone`)
* **Cross-Divisional "Golden Corridor" Synchronizer**: Synchronizes maintenance windows across divisional boundaries (e.g., Delhi Division $\rightarrow$ Agra Division $\rightarrow$ Prayagraj Division on the NDLS-CNB route) to prevent trains held at inter-divisional interchange points.
* **Track Machine Organization (TMO) Fleet Allocation**: Tracks and routes scarce zonal heavy machines (tamping machines, ballast cleaners, wiring trains) to divisions with the highest maintenance priority scores.
* **Zonal Mega-Block Planning**: Plans 6–8 hour weekend traffic blocks for massive bridge renewals, interlocking overhauls, or track doubling projects with coordinated inter-divisional train diversions.

#### Tier 3: Divisional Tactical Control Cockpit (`/division`) — *The Primary Engine*
* **Real-Time Corridor Canvas (Map + Interactive Gantt)**:
  - Directional track modeling: Up Line, Down Line, Reversible Third/Fourth Lines, and Station Yard Common Loops.
  - Live train paths overlaid with planned blocks.
* **1-Click Multi-Department Optimizer**:
  - Ingests all pending requests from TMS, SMMS, and TDMS.
  - Generates optimized joint block plans in $<30$ seconds using OR-Tools CP-SAT.
  - Displays side-by-side Before/After comparison (e.g., 53 separate requests totaling 48 hours collapsed into 18 combined blocks totaling 21 hours).
* **Interactive What-If Scenario Simulator**:
  - Emergency rail fracture or OHE breakdown injection on the map.
  - Train delay slider (e.g., Vande Bharat running +45 min late).
  - Instant re-optimization in $<3$ seconds with automated traffic holding/routing recommendations.
* **Joint Sanction Authority Dashboard**:
  - Digital authorization workflow requiring joint electronic sign-off from Sr. DOM (Traffic) and the relevant technical branch (Sr. DEN / Sr. DSTE / Sr. DEE).

#### Tier 4: Field & Station Terminal (`/field`)
* **Mobile-Responsive Work Requisition Form**:
  - SSEs input asset code, track kilometer post (KM), directional line, defect severity, required machinery (Tamper/Tower Wagon/Gang), and estimated duration.
* **Digital Disconnection Memo & Reconnection Workflow**:
  - Replaces paper S&T and Engineering disconnection notices with digital timestamped acknowledgments.
  - **Permit to Work (PTW)** integration: Traction Power Controller (TPC) verifies OHE electrical de-energization and isolation before work commences.
  - **Track Fit & Caution Order Submission**: Post-work digital certification restoring the track, automatically generating temporary speed restrictions (TSR) into the Section Controller's train order log.

---

## 3. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRESENTATION LAYER                                   │
│  ┌────────────────────┬────────────────────┬────────────────────┬───────────────────┐  │
│  │   Railway Board    │      Zonal HQ      │ Divisional Control │   Field & Station │  │
│  │   Cockpit (/board) │  Dashboard (/zone) │  Cockpit (/div)    │   Terminal (/field│  │
│  │   (Macro Analytics)│  (Fleet & Corridor)│  (Hero Optimization│   (Memos & Forms) │  │
│  └────────────────────┴────────────────────┴────────────────────┴───────────────────┘  │
│               React 18 + TypeScript + Vite + Material UI + Leaflet + Recharts          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / WSS
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FASTAPI GATEWAY & API LAYER                               │
│  ┌─────────────────┬───────────────────┬───────────────────┬────────────────────────┐  │
│  │ JWT Auth & RBAC │ Role-Tenancy Gate │ Rate Limiter      │ OpenAPI Documentation  │  │
│  │ (Tier 1 to 4)   │ (Zone/Div Scope)  │ & Request Auditing│ & Swagger UI           │  │
│  └─────────────────┴───────────────────┴───────────────────┴────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│  DATA & INGESTION AGENT │    │   COORDINATION AGENT    │    │  NOTIFICATION & MEMO    │
│  • TMS/SMMS/TDMS Parsers│    │   • Multi-Agent Event   │    │    LIFECYCLE AGENT      │
│  • COA Timetable Ingest │    │     Orchestration       │    │  • Disconnection Memos  │
│  • Spatial-KM Clusterer │    │   • Workflow Engine     │    │  • PTW Electrical Cert  │
│  • Synthetic Data Engine│    │   • Job Tracker         │    │  • Caution Orders (TSR) │
└────────────┬────────────┘    └────────────┬────────────┘    └────────────┬────────────┘
             │                              │                              │
             └──────────────────────┬───────┴──────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              INTELLIGENCE & REASONING CORE                             │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  ML PRIORITY SCORER    │  │  OR-TOOLS CP-SAT        │  │  DYNAMIC TRAIN DISPATCH │  │
│  │  • XGBoost Regressor   │  │    OPTIMIZATION ENGINE   │  │    SIMULATOR (PS 26028) │  │
│  │  • Asset Degradation   │  │  • IntervalVar Model     │  │  • Cascading Delays    │  │
│  │  • Safety Risk Index   │  │  • Directional NoOverlap │  │  • Precedence Priority │  │
│  │  • SHAP Attribution    │  │  • Machinery Cumulative  │  │  • Corridor Delay Calc │  │
│  └───────────┬────────────┘  └────────────┬────────────┘  └───────────┬─────────────┘  │
│              │                            │                           │                │
│              └─────────────────────┬──────┴───────────────────────────┘                │
│                                    ▼                                                   │
│                      ┌───────────────────────────┐                                     │
│                      │   EXPLAINABILITY AGENT    │                                     │
│                      │   • SHAP Factor Weights   │                                     │
│                      │   • LLM Operational Brief │                                     │
│                      │   • Punctuality Trade-off │                                     │
│                      └─────────────┬─────────────┘                                     │
└────────────────────────────────────┼───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PERSISTENCE & CACHING LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL 15 + PostGIS Spatial Engine (Corridor Geometry, Memos, Blocks, Tracks)│  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Redis 7.0 In-Memory Store (Active Locks, Event Streams, Priority Cache, WS State)│  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Comprehensive PostgreSQL & PostGIS Database Schema

```sql
-- Enable PostGIS extension for accurate GIS coordinates
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Organizational Jurisdictions (4-Tier Pyramid)
CREATE TABLE operational_jurisdictions (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'BOARD_IR', 'ZONE_NR', 'DIV_DLI', 'SEC_GZB_ALJN'
    name VARCHAR(100) NOT NULL,
    tier_level VARCHAR(20) NOT NULL CHECK (tier_level IN ('BOARD', 'ZONE', 'DIVISION', 'SECTION')),
    parent_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users and Role-Based Access Control
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    tier_role VARCHAR(30) NOT NULL CHECK (tier_role IN ('BOARD_EXEC', 'ZONAL_HEAD', 'DIV_CONTROLLER', 'FIELD_SSE', 'STATION_MASTER')),
    department VARCHAR(20) CHECK (department IN ('OPERATING', 'ENGINEERING', 'SIGNALLING', 'ELECTRICAL', 'ALL')),
    jurisdiction_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Railway Infrastructure: Stations
CREATE TABLE stations (
    code VARCHAR(10) PRIMARY KEY, -- e.g., 'NDLS', 'GZB', 'ALJN', 'CNB'
    name VARCHAR(100) NOT NULL,
    division_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    kilometer_mark DECIMAL(10, 2) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    number_of_platforms INTEGER DEFAULT 2,
    has_loop_lines BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Railway Infrastructure: Track Sections (Directional & Yard)
CREATE TABLE sections (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'SEC_NDLS_GZB_UP', 'SEC_GZB_ALJN_DN'
    name VARCHAR(100) NOT NULL,
    division_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    start_station_code VARCHAR(10) REFERENCES stations(code),
    end_station_code VARCHAR(10) REFERENCES stations(code),
    start_km DECIMAL(10, 2) NOT NULL,
    end_km DECIMAL(10, 2) NOT NULL,
    track_direction VARCHAR(20) NOT NULL CHECK (track_direction IN ('UP', 'DOWN', 'COMMON_LOOP', 'THIRD_LINE', 'YARD')),
    speed_limit_kmh INTEGER DEFAULT 130,
    is_electrified BOOLEAN DEFAULT TRUE,
    ohe_subsector_id VARCHAR(50), -- Electrical isolation feeding zone
    path_geometry GEOMETRY(LineString, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Specialized Maintenance Machinery Fleet (TMO & Traction)
CREATE TABLE maintenance_machinery (
    id VARCHAR(50) PRIMARY KEY, -- 'TAMP_042', 'TOWER_WAGON_07', 'BCM_12'
    machine_type VARCHAR(50) NOT NULL CHECK (machine_type IN ('TAMPING_MACHINE', 'BALLAST_CLEANER', 'TOWER_WAGON', 'UNIMAT', 'RAIL_GRINDER')),
    home_zone_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    assigned_division_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    current_station_code VARCHAR(10) REFERENCES stations(code),
    operational_status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (operational_status IN ('AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE')),
    capacity_rate_per_hour DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Maintenance Requests (TMS, SMMS, TDMS)
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'TMS_2026_09_001'
    department VARCHAR(20) NOT NULL CHECK (department IN ('TMS', 'SMMS', 'TDMS')),
    division_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    section_id VARCHAR(50) REFERENCES sections(id),
    from_km DECIMAL(10, 2) NOT NULL,
    to_km DECIMAL(10, 2) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'RAIL', 'SLEEPER', 'POINT_MACHINE', 'OHE_CATENARY', 'TRACK_CIRCUIT'
    defect_type VARCHAR(100) NOT NULL, -- 'RAIL_FRACTURE_RISK', 'CORRUGATION', 'POINT_SLUGGISH', 'INSULATOR_FLASHING'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('EMERGENCY', 'CRITICAL', 'PLANNED_HIGH', 'ROUTINE')),
    description TEXT,
    estimated_duration_minutes INTEGER NOT NULL,
    required_machine_type VARCHAR(50),
    assigned_machinery_id VARCHAR(50) REFERENCES maintenance_machinery(id),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority_score DECIMAL(5, 2) DEFAULT 0.0,
    safety_risk_index DECIMAL(5, 2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OPTIMIZED', 'SANCTIONED', 'DISCONNECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_req_dept_status ON maintenance_requests(department, status);
CREATE INDEX idx_req_section ON maintenance_requests(section_id);
CREATE INDEX idx_req_priority ON maintenance_requests(priority_score DESC);

-- 7. Train Timetables & Movements (COA / RTIS Simulation)
CREATE TABLE train_schedules (
    id SERIAL PRIMARY KEY,
    train_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., '12002', '22436'
    train_name VARCHAR(100) NOT NULL,
    train_category VARCHAR(30) NOT NULL CHECK (train_category IN ('VANDE_BHARAT', 'RAJDHANI', 'SUPERFAST_EXPRESS', 'PASSENGER_LOCAL', 'HEAVY_FREIGHT')),
    priority_precedence INTEGER NOT NULL, -- 1 = Vande Bharat/Rajdhani, 2 = Express, 3 = Local, 4 = Freight
    source_station_code VARCHAR(10) REFERENCES stations(code),
    dest_station_code VARCHAR(10) REFERENCES stations(code),
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    route_sections JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Optimization Runs
CREATE TABLE optimization_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    division_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    start_window TIMESTAMP WITH TIME ZONE NOT NULL,
    end_window TIMESTAMP WITH TIME ZONE NOT NULL,
    algorithm_used VARCHAR(50) NOT NULL,
    total_input_requests INTEGER NOT NULL,
    scheduled_requests INTEGER NOT NULL,
    total_blocks_created INTEGER NOT NULL,
    combined_super_blocks INTEGER NOT NULL,
    total_time_saved_hours DECIMAL(10, 2) NOT NULL,
    asset_availability_gain_percent DECIMAL(5, 2) NOT NULL,
    train_delay_penalty_minutes INTEGER NOT NULL,
    solver_wall_time_seconds DECIMAL(10, 3) NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    executed_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Maintenance Blocks (Sanctioned Operational Windows)
CREATE TABLE maintenance_blocks (
    id SERIAL PRIMARY KEY,
    block_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'BLK_DLI_20260908_01'
    division_id VARCHAR(50) REFERENCES operational_jurisdictions(id),
    section_id VARCHAR(50) REFERENCES sections(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_duration_minutes INTEGER NOT NULL,
    block_type VARCHAR(30) NOT NULL CHECK (block_type IN ('COMBINED_SUPER_BLOCK', 'SINGLE_DEPARTMENT', 'EMERGENCY_SHUTDOWN')),
    is_combined BOOLEAN DEFAULT FALSE,
    optimization_run_id INTEGER REFERENCES optimization_runs(id),
    status VARCHAR(30) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'SANCTIONED', 'DISCONNECTED', 'IN_PROGRESS', 'FIT_RESTORED', 'CANCELLED')),
    
    -- Real-world Railway Safety Memo Protocol
    sanctioned_by_dom_id INTEGER REFERENCES users(id),
    sanctioned_by_tech_id INTEGER REFERENCES users(id),
    sanction_timestamp TIMESTAMP WITH TIME ZONE,
    disconnection_memo_number VARCHAR(50),
    disconnection_memo_time TIMESTAMP WITH TIME ZONE,
    permit_to_work_ptw_number VARCHAR(50),
    ptw_verified_by_tpc VARCHAR(100),
    track_fit_cert_issued BOOLEAN DEFAULT FALSE,
    track_fit_timestamp TIMESTAMP WITH TIME ZONE,
    post_block_tsr_speed_kmh INTEGER,
    post_block_tsr_duration_hours INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocks_time_section ON maintenance_blocks(section_id, start_time, end_time);

-- 10. Association: Block to Maintenance Requests (Many-to-Many)
CREATE TABLE block_request_assignments (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES maintenance_blocks(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(block_id, request_id)
);

-- 11. Train Delays & Punctuality Impacts (Dynamic Simulation)
CREATE TABLE train_impacts (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES maintenance_blocks(id),
    train_id INTEGER REFERENCES train_schedules(id),
    estimated_delay_minutes INTEGER NOT NULL,
    impact_type VARCHAR(30) NOT NULL CHECK (impact_type IN ('DELAYED_ON_RUN', 'HELD_AT_LOOP_LINE', 'REROUTED_VIA_PARALLEL', 'REGULATED')),
    regulation_station_code VARCHAR(10) REFERENCES stations(code),
    is_passenger_train BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Explainability Records (SHAP & LLM Generated)
CREATE TABLE explainability_briefs (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES maintenance_blocks(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    safety_risk_tradeoff TEXT NOT NULL,
    shap_factors JSONB NOT NULL,
    rejected_alternatives JSONB NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. What-If Simulation Scenarios
CREATE TABLE simulation_scenarios (
    id SERIAL PRIMARY KEY,
    scenario_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('EMERGENCY_RAIL_FRACTURE', 'PREMIUM_TRAIN_DELAY', 'TOWER_WAGON_BREAKDOWN', 'WEATHER_RESTRICTION')),
    base_optimization_id INTEGER REFERENCES optimization_runs(id),
    injected_parameters JSONB NOT NULL,
    simulated_results JSONB NOT NULL,
    reoptimization_wall_time_seconds DECIMAL(10, 3) NOT NULL,
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. Security, Multi-Tenancy & Data Isolation

1. **Multi-Tenancy Scoping**:
   - Every API request checks the JWT claims (`jurisdiction_id`, `tier_role`).
   - A `FIELD_SSE` in Ghaziabad can only view/create tickets in their assigned section.
   - A `DIV_CONTROLLER` in Delhi Division has tactical write permissions for the Delhi Division corridor.
   - A `ZONAL_HEAD` (Northern Railway) has read/write over all NR divisions and heavy machine rosters.
   - A `BOARD_EXEC` has read-only analytical aggregation across all national zones.
2. **Audit Trail**: All block sanctions, disconnection memos, and emergency overrides are recorded in an append-only audit log with user ID, timestamp, and payload snapshots.
3. **Data Protection**: TLS 1.3 in transit, AES-256 at rest, and signed JWT tokens (15-minute access, 7-day refresh).

---

## 6. Technical Stack & Deployment Architecture

```yaml
Operating System: Linux (NixOS / Ubuntu Server / RHEL)
Backend Engine:
  Framework: FastAPI 0.104+ (Asynchronous Python)
  Constraint Solver: Google OR-Tools CP-SAT 9.8+ (C++ optimized engine)
  ML Models: XGBoost 2.0+ & Scikit-Learn 1.3+
  Explainability: SHAP 0.43+ & Gemini API (LLM Operational Reasoner)
  Database ORM: SQLAlchemy 2.0+ with Alembic migrations
  Async Tasks & Events: Redis Streams + BackgroundTasks
Database & Memory:
  RDBMS: PostgreSQL 15 with PostGIS 3.3
  In-Memory: Redis 7.0 (Caching, locks, live pub/sub)
Frontend Client:
  Core: React 18.2 + TypeScript 5.0 + Vite 5.0
  UI Componentry: Material-UI (MUI v5) + Emotion
  GIS Mapping: Leaflet 1.9 + React-Leaflet 4.2 (OpenRailwayMap tiles)
  Charts & Gantt: Recharts + Custom Canvas Gantt
DevOps & Containerization:
  Containers: Docker 29+ & Docker Compose v2
```
