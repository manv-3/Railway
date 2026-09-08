# PS 26027: Enterprise Railway Block Planning Platform
## Comprehensive 3-Phase Implementation Plan

**Target System**: Indian Railways Multi-Department Maintenance Optimization  
**Architecture Version**: 2.0 (4-Tier Enterprise Architecture)  
**Total Duration**: 12 Weeks (6 Sprints of 2 Weeks Each)  
**Team Allocation**: 4–6 Engineers (Backend, Optimization/Algorithm, ML, Frontend, Data/DevOps)

---

## Executive Phase Breakdown at a Glance

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                      PHASE 1: THE CORE TACTICAL ENGINE & POC (Weeks 1-4)               ║
║                                  "Make the Core Work"                                 ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║ • Sprint 1 (W1-2): Infrastructure, PostGIS Schemas, Realistic Delhi-Kanpur Corridor   ║
║ • Sprint 2 (W3-4): OR-Tools CP-SAT Bundler, Basic Divisional Cockpit, 1-Click Optimize║
║ 🎯 Milestone: End-to-end working prototype collapsing 5.5h separate blocks into 2h.   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
                                          │
                                          ▼
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║              PHASE 2: ENTERPRISE HIERARCHY, INTELLIGENCE & SAFETY (Weeks 5-8)         ║
║                              "Make It Authentic & Smart"                              ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║ • Sprint 3 (W5-6): 4-Tier Admin Portals (/field, /division, /zone, /board) + Safety   ║
║   Memos (Disconnection, Traction PTW, Track Fit, Caution Order TSRs)                  ║
║ • Sprint 4 (W7-8): XGBoost + SHAP Priority Model, LLM Reasoner, What-If Simulator     ║
║ 🎯 Milestone: Full-featured demo with emergency replanning and operational memos.     ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
                                          │
                                          ▼
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║             PHASE 3: PRODUCTION HARDENING, SCALE & COMPETITION WIN (Weeks 9-12)       ║
║                                "Make It Enterprise-Ready"                             ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║ • Sprint 5 (W9-10): Cross-Division Corridor Sync, Machine Fleet Routing, 85%+ Tests   ║
║ • Sprint 6 (W11-12): Cloud Deployment, Documentation, Backup Video, Pitch Rehearsal   ║
║ 🎯 Milestone: Production deployment, flawless 15-minute pitch, judge Q&A defense.     ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

# PHASE 1: The Core Tactical Engine & Divisional POC (Weeks 1–4)

### Phase 1 Objectives
* Establish development environment (Docker Compose, PostgreSQL with PostGIS, Redis).
* Model real Indian Railways corridor: **New Delhi (NDLS) – Ghaziabad (GZB) – Kanpur Central (CNB)**.
* Generate authentic synthetic maintenance requests from TMS (Track), SMMS (Signal), and TDMS (Traction).
* Build the core **OR-Tools CP-SAT Block Bundling Optimizer** enforcing directional track isolation.
* Deliver the **Divisional Control Cockpit MVP** (Leaflet Map + Canvas Gantt Timeline + 1-Click Optimize).

---

## Sprint 1: Infrastructure, Spatial Data & Models (Weeks 1–2)

### Week 1: Environment Setup & Database Modeling

#### Day 1–2: Project Scaffolding & Container Infrastructure
* **Tasks**:
  1. Initialize clean monorepo: `backend/`, `frontend/`, `infrastructure/`, `scripts/`.
  2. Setup `docker-compose.yml` with:
     - PostgreSQL 15 with PostGIS extension.
     - Redis 7.0 for state management and locks.
     - FastAPI backend with auto-reload.
     - Vite + React frontend server.
  3. Verify containers boot cleanly and test cross-service networking.
* **Deliverables**: Working Docker Compose stack, repository environment documentation.

#### Day 3–5: Hierarchical Database Schema & SQLAlchemy Models
* **Tasks**:
  1. Create database migrations using Alembic for tables:
     - `operational_jurisdictions` (Board, Zone, Division, Section).
     - `stations` & `sections` (with PostGIS `LineString` for track geometry).
     - `maintenance_machinery` (Track Tampers, Tower Wagons, Ballast Cleaners).
     - `maintenance_requests` (TMS, SMMS, TDMS tickets).
     - `train_schedules` (Vande Bharat, Rajdhani, Express, Freight routes).
     - `maintenance_blocks` & `block_request_assignments`.
  2. Implement SQLAlchemy 2.0 ORM models with relationship mappings and indexing.
  3. Verify migration rollbacks and schema integrity.
* **Deliverables**: Complete relational schema, Alembic migration scripts, SQLAlchemy repository layer.

---

### Week 2: Realistic Corridor Data Engine & Baseline Scheduling

#### Day 6–8: Authentic Indian Railways Corridor & Synthetic Data Engine
* **Tasks**:
  1. Implement `scripts/generate_corridor_data.py`:
     - Physical corridor: NDLS $\rightarrow$ ANVT $\rightarrow$ GZB $\rightarrow$ ALJN $\rightarrow$ TDL $\rightarrow$ ETW $\rightarrow$ CNB.
     - Directional tracks: Up Main, Down Main, and Station Loop Lines.
     - Real train schedules based on National Train Enquiry System (NTES) (e.g., 22436 Vande Bharat, 12424 Rajdhani Express, 12002 Shatabdi, container freight).
  2. Implement departmental request generators with authentic IR P-Way/S&T defect codes:
     - **TMS**: Rail wear, corrugation, tamping due, sleeper renewal.
     - **SMMS**: Point machine sluggishness, track circuit false drop, signal head cleaning.
     - **TDMS**: OHE contact wire height adjustment, insulator washing, cantilever inspection.
* **Deliverables**: Synthetic data CLI generator producing 60+ realistic requests across 3 departments.

#### Day 9–10: Baseline Greedy Scheduler & Metric Benchmarks
* **Tasks**:
  1. Implement a baseline Greedy Scheduler (sorting by priority, sequential non-overlapping slot filling) to serve as benchmark.
  2. Calculate baseline metrics: separate block downtime, asset unavailability %, train conflict count.
* **Deliverables**: Functional greedy scheduler producing baseline metrics for comparison against CP-SAT.

---

## Sprint 2: The Optimization Engine & Divisional Cockpit MVP (Weeks 3–4)

### Week 3: OR-Tools CP-SAT Block Bundling Engine

#### Day 11–13: CP-SAT Formulation & Constraint Implementation
* **Tasks**:
  1. Formulate problem in Google OR-Tools CP-SAT:
     - Decision interval variables (`NewOptionalIntervalVar`).
     - Directional track `AddNoOverlap` constraints per physical section.
     - Machine capacity `AddCumulative` constraints for Tower Wagons and Track Tampers.
     - Multi-department co-location bundling incentive in objective function.
  2. Connect solver with timetable buffer margins (15 min pre/post train pass).
  3. Validate solver execution under $<30$ seconds limit.
* **Deliverables**: Production-grade `CPSATBlockOptimizer` in `optimization/cpsat_optimizer.py`.

#### Day 14–15: FastAPI Tactical Endpoints
* **Tasks**:
  1. Implement REST endpoints:
     - `GET /api/v1/corridor/sections`: Returns station coordinates and track paths.
     - `GET /api/v1/maintenance/requests`: Filterable by division, department, and status.
     - `POST /api/v1/optimize/run`: Triggers CP-SAT optimization and returns scheduled blocks + metrics.
     - `GET /api/v1/blocks`: Returns scheduled blocks and assigned tasks.
* **Deliverables**: Functional API endpoints verified with automated Swagger/pytest tests.

---

### Week 4: Divisional Control Cockpit MVP & Phase 1 Demo

#### Day 16–18: React + Leaflet Corridor Canvas & Gantt View
* **Tasks**:
  1. Build `DivisionalControlCockpit.tsx`:
     - **Leaflet Map**: Renders Up and Down tracks between Delhi and Kanpur with station markers.
     - **Gantt Chart**: 24-hour timeline displaying train paths and maintenance block slots.
     - **Department Legend**: Color-coded badges (Green: TMS, Yellow: SMMS, Blue: TDMS, Orange: Combined Super-Block).
  2. Connect UI with `/api/v1/optimize/run`.
* **Deliverables**: Interactive web dashboard displaying live optimization results on map and timeline.

#### Day 19–20: Phase 1 Integration & Milestone Demo
* **Tasks**:
  1. Perform end-to-end user journey:
     - Load 35 uncoordinated requests from 3 departments (representing 32 hours of separate blocks).
     - Click **"Optimize Division Schedule"**.
     - CP-SAT solves in $<10$ seconds.
     - Dashboard renders **12 Combined Blocks totaling 15.5 hours** (+51% availability improvement).
  2. Record backup demo video and draft Phase 1 milestone report.
* **Phase 1 Milestone Deliverable**: Fully working prototype demonstrating multi-department bundling.

---

# PHASE 2: Enterprise Hierarchy, Intelligence & Live Safety Handshake (Weeks 5–8)

### Phase 2 Objectives
* Expand the platform into all **4 Operational Tiers** (`/field`, `/division`, `/zone`, `/board`).
* Implement the legal Indian Railways safety workflow: **Digital Disconnection Memo, Traction PTW, Track Fit, Caution Orders (TSR)**.
* Build the **XGBoost ML Priority Scorer** with SHAP explainability.
* Integrate the **Gemini LLM Operational Reasoner** to auto-generate official Railway Dispatch Justifications.
* Deliver the **Interactive What-If Simulator** (Emergency Rail Fracture injection and train delay replanning).

---

## Sprint 3: 4-Tier Portals & The Digital Safety Memo Handshake (Weeks 5–6)

### Week 5: Multi-Tier Role-Based Portals

#### Day 21–23: Multi-Tier Authentication & RBAC Router
* **Tasks**:
  1. Implement JWT auth with claims: `tier_role`, `department`, `jurisdiction_id`.
  2. Build React role-based routing protecting:
     - `/field`: Field Senior Section Engineers & Station Masters.
     - `/division`: Divisional Operations Controllers.
     - `/zone`: Zonal Headquarters Executive.
     - `/board`: Railway Board National Cockpit.
* **Deliverables**: Secure multi-tenancy and dynamic portal navigation based on authenticated role.

#### Day 24–25: Field Requisition & Station Terminal (`/field`)
* **Tasks**:
  1. Mobile-friendly work ticket creation form (KM post, asset code, urgency, machine needs).
  2. Station Master live block log (shows upcoming sanctions and active track possessions).
* **Deliverables**: Working Field Portal with real-time ticket dispatch to division.

---

### Week 6: The Digital Safety Handshake Lifecycle

#### Day 26–28: Disconnection Memo, PTW, and Track Fit Workflow
* **Tasks**:
  1. Implement the complete digital safety lifecycle in backend and UI:
     - **Disconnection Memo**: SSE requests formal disconnection; Station Master digitally signs receipt.
     - **Permit-to-Work (PTW)**: Traction Power Controller (TPC) records OHE feeder isolation number.
     - **Track Fit Certificate**: SSE signs physical completion handover.
     - **Caution Order / TSR Generator**: Automatically logs temporary speed restriction (e.g., 30 km/h for 2 hours) to Section Controller's board.
* **Deliverables**: Regulatory-compliant digital block execution handshake replacing manual paper registers.

#### Day 29–30: Zonal (`/zone`) & Board (`/board`) Executive Dashboards
* **Tasks**:
  1. Build `/zone`: Track Machine fleet tracking table (Tampers, BCM, Tower Wagons) across divisions.
  2. Build `/board`: Pan-India asset availability gauge (+30–40% metric), deferred maintenance risk heatmap, and zonal punctuality loss rankings.
* **Deliverables**: Functional Tier 1 and Tier 2 executive portals with real-time aggregate KPIs.

---

## Sprint 4: Machine Learning, Explainability & What-If Simulation (Weeks 7–8)

### Week 7: Machine Learning Priority Scoring & LLM Explainer

#### Day 31–33: XGBoost Degradation & Failure Risk Scorer
* **Tasks**:
  1. Train XGBoost regressor on asset age, accumulated tonnage (GMT), Track Geometry Index (TGI), and overdue days.
  2. Connect SHAP TreeExplainer to extract mathematical factor weights per maintenance request.
  3. Display feature attribution breakdown cards in UI (e.g., *Asset Age: +32%, Overdue Days: +28%*).
* **Deliverables**: Operational ML priority engine with quantitative factor attribution.

#### Day 34–35: LLM Operational Reasoning Engine
* **Tasks**:
  1. Integrate Gemini API to generate natural language **Railway Dispatch Justification Memos**:
     - Explains why specific depts were combined.
     - Analyzes why alternative windows were rejected.
     - Provides quantitative **Safety Risk vs. Punctuality Loss** statement for Sr. DOM approval.
* **Deliverables**: Automated, legal-grade operational justification generator.

---

### Week 8: Interactive What-If Scenario Simulator & Phase 2 Demo

#### Day 36–38: What-If Hot-Restart Replanning Engine
* **Tasks**:
  1. Build simulation engine supporting two critical scenarios:
     - **Scenario A (Emergency Rail Fracture)**: User injects crack at KM 52 $\rightarrow$ Immediate emergency block created $\rightarrow$ Sub-3-second CP-SAT re-solve reroutes trains and pushes routine work back.
     - **Scenario B (Vande Bharat Running 45 min Late)**: Slider delays train $\rightarrow$ Block automatically shifts to maintain safety margin without train detention.
  2. Connect Dynamic Train Dispatch Simulator (PS 26028 synergy) to display regulated trains and loop line holding.
* **Deliverables**: Interactive simulation canvas with instant side-by-side scenario comparison.

#### Day 39–40: Phase 2 Rehearsal & Milestone Presentation
* **Tasks**:
  1. Rehearse 10-minute demo showcasing all 4 tiers, the safety memo handshake, and the emergency what-if simulation.
  2. Record backup video and prepare Phase 2 review deck.
* **Phase 2 Milestone Deliverable**: Advanced multi-tier enterprise system with live intelligence and simulation.

---

# PHASE 3: Production Hardening, Zonal Scale & Competition Win (Weeks 9–12)

### Phase 3 Objectives
* Scale optimization across multiple divisions (**Golden Corridor Synchronization**).
* Implement cross-zonal Track Machine fleet routing.
* Achieve $>85\%$ test coverage across unit, integration, and E2E suites.
* Perform high-concurrency load testing (150+ requests, $<30$ seconds solve).
* Production containerization, AWS/RailTel cloud deployment, and final pitch readiness.

---

## Sprint 5: Multi-Division Scaling, Fleet Routing & Quality Engineering (Weeks 9–10)

### Week 9: Cross-Division Corridor Synchronization

#### Day 41–43: Multi-Divisional Golden Corridor Optimization
* **Tasks**:
  1. Expand corridor model to cross Delhi Division and Prayagraj Division boundaries.
  2. Synchronize inter-divisional interchange timings to prevent trains delayed by a block in Delhi from jamming junctions in Prayagraj.
* **Deliverables**: Multi-divisional block coordinator eliminating inter-divisional train bunching.

#### Day 44–45: Track Machine Organization (TMO) Fleet Routing
* **Tasks**:
  1. Implement constraint routing for scarce machines (e.g., routing 1 Ballast Cleaning Machine from Kanpur to Ghaziabad based on highest section priority).
* **Deliverables**: Automated machine allocation algorithm across divisional boundaries.

---

### Week 10: Rigorous Testing & Performance Optimization

#### Day 46–48: Automated Testing Suite (>85% Coverage)
* **Tasks**:
  1. Unit tests for CP-SAT solver, ML scorer, spatial clusterer, and safety memo state machines.
  2. Integration tests for all FastAPI endpoints.
  3. Cypress/Playwright E2E tests for the Divisional Cockpit and Field Portal workflows.
* **Deliverables**: CI/CD pipeline running automated tests on GitHub Actions with $>85\%$ coverage badge.

#### Day 49–50: Stress Testing & Performance Benchmarking
* **Tasks**:
  1. Stress-test CP-SAT solver with 150+ maintenance requests over a 7-day planning window.
  2. Verify solver converges within the 30-second hard limit.
  3. Optimize PostgreSQL query execution with spatial PostGIS indexing and Redis caching.
* **Deliverables**: Benchmarking report verifying sub-200ms API response times and $<30$s optimization time.

---

## Sprint 6: Cloud Deployment, Documentation & Final Presentation (Weeks 11–12)

### Week 11: Production Deployment & Observability

#### Day 51–53: Production Cloud Deployment (Docker / AWS)
* **Tasks**:
  1. Build multi-stage optimized production Dockerfiles for frontend (Nginx) and backend (Uvicorn).
  2. Deploy to AWS ECS/EC2 or local production-grade Docker Compose environment.
  3. Configure SSL/TLS, CORS policies, rate limiting, and automated database backups.
* **Deliverables**: Live, accessible, secure cloud deployment URL.

#### Day 54–55: Comprehensive Documentation & User Manuals
* **Tasks**:
  1. Generate interactive OpenAPI / Swagger documentation.
  2. Write Operator Manuals for:
     - Section Controllers (`Sr. DOM` & `CPRC`).
     - Field Engineers (`SSE P-Way`, `SSE Signal`, `SSE OHE`).
     - Zonal Leadership (`PCOM` & `PCE`).
* **Deliverables**: Complete documentation suite and printable cheat-sheets.

---

### Week 12: Competition Win & Executive Presentation

#### Day 56–58: Demo Script Refinement & Rehearsals
* **Tasks**:
  1. Polish the 15-Minute Winning Pitch Narrative:
     - **Minute 0–2: The Hook & Indian Railways Problem**: Show 3 departments creating 6 hours of chaos and train delays.
     - **Minute 2–4: Architecture & 4-Tier Portals**: Walk through Board, Zone, Division, and Field tiers.
     - **Minute 4–9: Live Divisional Cockpit Demo**:
       - 60 requests loaded $\rightarrow$ 1-Click Optimize $\rightarrow$ Collapsed into 18 Combined Blocks (+42% availability, 8.5 hours saved).
       - Click on Combined Block $\rightarrow$ Show SHAP breakdown & LLM Dispatch Justification Brief.
       - Demonstrate digital safety memo workflow (Disconnection $\rightarrow$ PTW $\rightarrow$ Track Fit $\rightarrow$ TSR).
     - **Minute 9–12: Interactive What-If Simulation**: Inject emergency broken rail $\rightarrow$ instant replanning in 2.1 seconds.
     - **Minute 12–14: Quantitative Impact & Production Readiness**: Scalability metrics, cloud deployment, and national savings potential.
     - **Minute 14–15: Closing**: The path to deployment on Indian Railways.
  2. Record 4K backup demo video with voiceover in case of venue network failure.
* **Deliverables**: Master presentation slide deck, 4K demo backup video, rehearsed team.

#### Day 59–60: Final Verification & Presentation Day
* **Tasks**:
  1. Full dress rehearsal with mock cross-examination on:
     - CP-SAT mathematical formulation and convergence guarantees.
     - Handling real-time RTIS GPS tracking feeds.
     - Safety fail-safes and human-in-the-loop approval gates.
  2. Ready to present and win! 🏆
* **Deliverables**: Flawless, confident presentation delivery.

---

## Deliverable Checkpoint Summary

| Phase | Milestone | Primary Deliverable | Success Criteria |
|---|---|---|---|
| **Phase 1** | Week 4 Review | Working Divisional Prototype | CP-SAT bundles 3 departments, saving $\ge 4$ hours on Delhi-Kanpur corridor. |
| **Phase 2** | Week 8 Review | Multi-Tier Intelligent Platform | 4 Portals live, Safety Memos functional, ML Scorer active, What-If replan in $<3$s. |
| **Phase 3** | Week 12 Final | Production Enterprise Release | Cloud deployed, $>85\%$ test coverage, $<30$s solve for 150 requests, competition-ready. |
