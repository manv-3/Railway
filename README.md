# AI-Powered Automatic Block Planning System for Indian Railways (PS 26027)

**Problem Statements**: Primary: **PS 26027** (Automatic Block Planning) | Synergy: **PS 26028** (Dynamic Train Dispatch & ETA Prediction)  
**Target Competition**: Smart India Hackathon (SIH) & Indian Railways Enterprise Production Deployment  
**Architecture Version**: 2.0 (4-Tier Enterprise Architecture)  
**Status**: 📋 Planning Complete & System Design Verified — Ready for Implementation  
**Execution Horizon**: 12 Weeks across 3 Focused Phases  

---

## 🎯 Quick Navigation & Documentation Map

| Document | Primary Audience | Core Value & Contents |
|---|---|---|
| **[PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md)** | Executive / Judges / Leads | High-level summary, 4-tier hierarchy, 6 algorithms, target metrics (+35% availability), demo story. |
| **[architecture.md](./architecture.md)** | Architects & Engineers | Full enterprise system architecture, 4-tier portals, complete PostgreSQL/PostGIS schema, security, and tech stack. |
| **[dev.md](./dev.md)** | Developers | Mathematical formulations, complete Python implementations for all 6 algorithms, API routes, and React routing. |
| **[implementation-plan.md](./implementation-plan.md)** | Project Leads & Devs | Comprehensive 3-phase, 12-week task breakdown (Sprint 1 to 6) with day-by-day deliverables and demo milestones. |
| **[ROADMAP.md](./ROADMAP.md)** | Entire Team | Visual 12-week timeline, milestone checkpoints, feature evolution matrix, and sprint cadence. |
| **[agent.md](./agent.md)** | AI / Backend Devs | Event-driven multi-agent architecture (Data, Optimization, Prediction, Safety Memo, Explainability, Simulation). |
| **[context.md](./context.md)** | All Members | Problem background: TMS, SMMS, TDMS, COA, RTIS, and the operational friction between safety and punctuality. |
| **[GETTING-STARTED.md](./GETTING-STARTED.md)** | New Developers | Developer workstation onboarding, Docker Compose setup, and Day-1 environment checklist. |

---

## 🏛️ The 4-Tier Indian Railways Hierarchy

The platform provides dedicated, role-tailored administrative portals reflecting the 4-tier operational structure of Indian Railways:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. RAILWAY BOARD (Apex / National) - /board                                 │
│    • National Asset Availability Gauge (+30-40% gain)                       │
│    • Deferred Maintenance Risk Heatmaps (Derailment Prevention)             │
│    • Inter-Zonal Punctuality vs. Maintenance Benchmarks                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ZONAL HEADQUARTERS (Zonal HQ) - /zone                                    │
│    • Cross-Divisional "Golden Corridor" Synchronization                     │
│    • Track Machine Organization (TMO) Fleet Roster (Tampers, BCM, Wagons)   │
│    • Weekend Zonal Mega-Block Planning                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DIVISIONAL CONTROL (Tactical Core) - /division  [PRIMARY ENGINE]         │
│    • Directional Track Corridor Canvas (Up/Down/Loop Lines) + Gantt         │
│    • 1-Click Multi-Department CP-SAT Block Optimizer (<30 seconds)          │
│    • Interactive What-If Scenario Simulator (Fracture Injection & Delays)   │
│    • Joint Sanction Authority Dashboard (Sr. DOM + Technical Branches)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. FIELD & STATION TERMINAL (Execution) - /field                            │
│    • SSE Ticket Requisition with KM & Asset Tagging                         │
│    • Digital Safety Memo Lifecycle (Disconnection -> PTW -> Fit -> TSR)     │
│    • Station Master Live Line Possession Log                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ The 6 Core System Algorithms

1. **ML Multi-Factor Priority & Safety Risk Scorer** (`XGBoost` + `SHAP`): Evaluates asset degradation from tonnage (GMT), Track Geometry Index (TGI), and overdue days into a 0–100 risk score.
2. **Spatial-Temporal Clustering & Bundling Candidate Generator**: Identifies co-located tickets across TMS, SMMS, and TDMS sharing directional tracks and OHE subsectors.
3. **OR-Tools CP-SAT Block Bundling Optimizer**: Formulates directional track non-overlap, equipment cumulative capacity, and multi-department bundling incentives into an optimal schedule in $<30$ seconds.
4. **Dynamic Network Train Dispatch & Delay Propagator**: Simulates train regulation at upstream loop lines, precedence rules, and cascading delay impact (PS 26028 synergy).
5. **AI Operational Reasoning & Dispatch Explainer**: Generates legally valid Railway Dispatch Memos and Punctuality Trade-off Justifications combining SHAP attribution with the Gemini API.
6. **What-If Hot-Restart Replanning Engine**: Enables $<3$-second emergency re-optimization during broken rails or delayed premium trains using CP-SAT warm starts (`AddHint`).

---

## 🚀 The 3 Project Phases

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

## 🛠️ Technology Stack

* **Backend**: Python 3.11+, FastAPI, Google OR-Tools CP-SAT 9.8+, XGBoost, SHAP, SQLAlchemy 2.0+, Redis Streams.
* **Frontend**: React 18+, TypeScript 5+, Vite, Material-UI (MUI v5), Leaflet / React-Leaflet, Recharts.
* **Database & Cache**: PostgreSQL 15 with PostGIS, Redis 7.0 In-Memory Store.
* **DevOps**: Docker, Docker Compose, GitHub Actions, AWS GovCloud / RailTel Cloud ready.

## 💬 Read-Only Operations Copilot

Every authenticated portal includes an **Operations Copilot** for conversational
questions about the current corridor state. It can read bounded, role-scoped
snapshots of blocks, maintenance requests, and active trains, then explain the
result with a UTC freshness timestamp and the tools used.

The copilot has no write tools and does not persist conversation history. It
cannot sanction a block, run an optimizer, issue a memo or PTW, certify track
fit, run a simulation, retrain a model, or route machinery. The API contract is:

* `POST /api/v1/copilot/chat` — answer a question from live read-only data.
* `GET /api/v1/copilot/capabilities` — expose the read-only tool contract.

Rail Sarthi uses **Gemini 2.5 Flash** by default because it provides low-latency
conversation at a practical operating cost. Set `RAIL_SARTHI_MODEL` to use an
approved compatible Gemini model without changing application code. When
`GEMINI_API_KEY` is configured, the model drafts the explanation from the
server-side snapshot. Without the key, a deterministic local summary is used.
Both paths return `read_only: true`, `write_actions_available: []`, and an
explicit statement that no operational state was changed.
