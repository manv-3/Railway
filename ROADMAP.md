# Railway Block Planning System - Visual Roadmap & Journey

## 1. The 12-Week Visual Timeline (3 Rigorous Phases)

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                     PHASE 1: THE CORE TACTICAL ENGINE & POC (Weeks 1-4)                  ║
║                                     "Make It Work"                                       ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

Week 1-2: Infrastructure & Indian Railways Corridor Data Engine
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Container Stack          │ PostGIS & Relational Schema │ IR Corridor Generator   │
│ ├─ Docker Compose        │ ├─ Jurisdictions (4-Tier)   │ ├─ Delhi-Kanpur Route   │
│ ├─ PostgreSQL 15+PostGIS │ ├─ Stations & Sections (GIS)│ ├─ Up/Down Track Paths  │
│ ├─ Redis 7.0 In-Memory   │ ├─ Machinery Fleet (TMO)    │ ├─ NTES Train Schedules │
│ └─ FastAPI Skeleton      │ └─ TMS/SMMS/TDMS Tables     │ └─ P-Way Defect Tickets │
│ ⏱️ Days 1-2              │ ⏱️ Days 3-5                 │ ⏱️ Days 6-10            │
└─────────────────────────────────────────────────────────────────────────────────┘

Week 3-4: OR-Tools CP-SAT Block Bundler & Divisional Cockpit MVP
┌─────────────────────────────────────────────────────────────────────────────────┐
│ OR-Tools CP-SAT Optimizer│ Tactical FastAPI Endpoints  │ Divisional Cockpit MVP  │
│ ├─ IntervalVar Modeling  │ ├─ /corridor/sections       │ ├─ React 18 + Vite      │
│ ├─ Directional NoOverlap │ ├─ /maintenance/requests    │ ├─ Leaflet Corridor Map │
│ ├─ Machine Cumulative Cap│ ├─ /optimize/run (<30s)     │ ├─ 24h Canvas Gantt View│
│ └─ Multi-Dept Bundling   │ └─ /blocks listing          │ └─ 1-Click Optimize Btn │
│ ⏱️ Days 11-13            │ ⏱️ Days 14-15               │ ⏱️ Days 16-20           │
└─────────────────────────────────────────────────────────────────────────────────┘

🎯 Milestone: Phase 1 End-to-End Working Prototype
   ✓ Real Delhi-Kanpur corridor with authentic trains and maintenance requests.
   ✓ CP-SAT optimizer successfully collapses 5.5 hours of separate work into a 2-hour Super-Block.
   ✓ Working interactive web interface with map and timeline.
   ✓ 5-minute recorded video and milestone sign-off.


╔══════════════════════════════════════════════════════════════════════════════════════════╗
║             PHASE 2: ENTERPRISE HIERARCHY, INTELLIGENCE & SAFETY (Weeks 5-8)             ║
║                                "Make It Smart & Authentic"                               ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

Week 5-6: 4-Tier Enterprise Portals & Digital Safety Memo Handshake
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Multi-Tier RBAC Portals  │ Digital Safety Handshake    │ Executive Dashboards    │
│ ├─ /field (SSEs & SMs)   │ ├─ Disconnection Memos      │ ├─ /zone: Zonal TMO     │
│ ├─ /division (Sr. DOM)   │ ├─ Traction OHE PTW Cert    │ │  Machine Fleet Roster │
│ ├─ /zone (GM & PCOM)     │ ├─ Track Fit Handover       │ ├─ /board: Pan-India    │
│ └─ /board (Railway Board)│ └─ Caution Order (TSR) Logs │ │  Asset Availability   │
│ ⏱️ Days 21-25            │ ⏱️ Days 26-28               │ ⏱️ Days 29-30           │
└─────────────────────────────────────────────────────────────────────────────────┘

Week 7-8: Machine Learning, Explainability & What-If Simulator
┌─────────────────────────────────────────────────────────────────────────────────┐
│ XGBoost ML Priority Model│ LLM Operational Reasoner    │ What-If Simulator (<3s) │
│ ├─ Feature Eng. (GMT/TGI)│ ├─ SHAP Factor Breakdown    │ ├─ Emergency Rail Break │
│ ├─ Failure Probability   │ ├─ Gemini API Integration   │ ├─ Vande Bharat Delay   │
│ └─ Safety Risk Scoring   │ └─ Dispatch Justification   │ └─ Loop Line Holding    │
│ ⏱️ Days 31-33            │ ⏱️ Days 34-35               │ ⏱️ Days 36-40           │
└─────────────────────────────────────────────────────────────────────────────────┘

🎯 Milestone: Phase 2 Feature-Complete Enterprise Platform
   ✓ All 4 administrative tiers live and operational with role-tailored workflows.
   ✓ Complete legal safety handshake: Disconnection Memo $\rightarrow$ PTW $\rightarrow$ Track Fit $\rightarrow$ TSR.
   ✓ Explainable AI providing quantitative SHAP breakdown and automated executive memos.
   ✓ Interactive what-if simulator resolving emergency rail fractures in $<3$ seconds.


╔══════════════════════════════════════════════════════════════════════════════════════════╗
║             PHASE 3: PRODUCTION HARDENING, SCALE & COMPETITION WIN (Weeks 9-12)          ║
║                                "Make It Production-Ready"                                ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

Week 9-10: Cross-Divisional Corridor Sync & Quality Engineering
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Multi-Division Corridor  │ Track Machine Routing       │ Testing & Stress Suite  │
│ ├─ Golden Corridor Sync  │ ├─ Zonal Tamper Allocation  │ ├─ Unit & Integration   │
│ ├─ Inter-Division Handoff│ ├─ BCM Machine Routing      │ ├─ E2E Cypress Tests    │
│ └─ Mega-Block Scheduling │ └─ Conflict Resolution      │ └─ >85% Code Coverage   │
│ ⏱️ Days 41-43            │ ⏱️ Days 44-45               │ ⏱️ Days 46-50           │
└─────────────────────────────────────────────────────────────────────────────────┘

Week 11-12: Cloud Deployment, Documentation & Winning Presentation
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Production Cloud Deploy  │ Operational Documentation   │ Pitch Rehearsal & Win   │
│ ├─ Multi-Stage Docker    │ ├─ Swagger OpenAPI Specs    │ ├─ 15-Min Pitch Script  │
│ ├─ AWS / RailTel Cloud   │ ├─ Operator Manuals (DOM)   │ ├─ 4K Backup Video      │
│ └─ SSL, Rate Limiting    │ └─ Field SSE Quick Guides   │ └─ Q&A Defense Rehearsal│
│ ⏱️ Days 51-53            │ ⏱️ Days 54-55               │ ⏱️ Days 56-60           │
└─────────────────────────────────────────────────────────────────────────────────┘

🎯 Milestone: Phase 3 Competition Win & Production Deployment
   ✓ Production-grade cloud deployment accessible live.
   ✓ Stress-tested: Solves 150+ requests in $<30$ seconds with $>85\%$ test coverage.
   ✓ Flawless 15-minute winning presentation ready for hackathon jury.
```

---

## 2. Feature Evolution Matrix

| Capability | Phase 1 (Weeks 1–4) | Phase 2 (Weeks 5–8) | Phase 3 (Weeks 9–12) |
|---|---|---|---|
| **Organizational Scope** | Single Division (Delhi Division) | All 4 Tiers (Board, Zone, Div, Field) | Multi-Division Cross-Corridor |
| **Optimization Core** | CP-SAT + Basic Bundling | CP-SAT + Machinery Capacity + Timetable Buffers | Scaled Multi-Corridor Mega-Blocks |
| **Safety Lifecycle** | Planned vs Approved Status | Disconnection Memo $\rightarrow$ PTW $\rightarrow$ Track Fit $\rightarrow$ TSR | Automated Section Controller Dispatch Log |
| **Machine Learning** | Heuristic Risk Scoring | XGBoost Regressor + SHAP Attribution | Retrained Predictive Degradation Model |
| **Explainability** | Static Summary Templates | Gemini API LLM Dispatch Justification Memos | Multi-Scenario Comparative Trade-Offs |
| **Simulation** | Static Schedule View | Hot-Restart What-If Replanning ($<3$s) | Cascading Network Delay Propagator |
| **Testing & CI/CD** | Basic Pytest (60%) | Automated Integration Tests (75%) | Full E2E & Load Testing ($>85\%$) |
| **Deployment** | Local Docker Compose | Docker Compose + Staging Cloud | High-Availability Cloud (AWS / RailTel) |
