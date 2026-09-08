# PS 26027: AI-Powered Automatic Block Planning System
## Executive Project Summary

**Project Title**: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways  
**Problem Statements**: Primary: **PS 26027** (Automatic Block Planning) | Synergy: **PS 26028** (Dynamic Train Dispatch & Delay Propagation)  
**Target Competition / Deployment**: Smart India Hackathon (SIH) & Indian Railways Production Deployment  
**Architecture Version**: 2.0 (Enterprise Multi-Tier Architecture)  
**Date**: September 2026  

---

## 1. Quick Reference & Core Innovation

### 1.1 The Operational Breakthrough
Indian Railways currently manages maintenance requests through three siloed departmental systems:
1. **TMS (Track Management System)** — Engineering / P-Way
2. **SMMS (Signalling Maintenance & Management System)** — Signalling & Telecom
3. **TDMS (Traction Distribution Management System)** — Electrical / OHE

Because these departments plan independently and Operating (Traffic) resists granting line possessions due to punctuality loss penalties, maintenance blocks are either denied (leading to derailment and fracture hazards) or executed separately (causing **5 to 6 hours of line disruption** for 2 hours of actual work).

**Our Platform's Hero Feature**:
The platform ingests all three streams, analyzes the **Safety Risk vs. Punctuality Loss Trade-Off**, and executes a constraint optimization engine (Google OR-Tools CP-SAT) that combines co-located maintenance into a single **Combined Super-Block (2 to 2.5 hours total)**, unlocking **+30% to +40% asset availability** while keeping high-precedence trains (Vande Bharat, Rajdhani) on schedule.

---

## 2. 4-Tier Railway Hierarchy & Role-Tailored Portals

The platform mirrors the exact 4-tier operational structure of Indian Railways:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. RAILWAY BOARD (Apex/National) - /board                                   │
│    • National Asset Availability Gauge (+30-40% gain)                       │
│    • Deferred Maintenance Risk Heatmaps                                     │
│    • Inter-Zonal Punctuality & Availability Benchmarks                      │
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

## 3. The 6 Core System Algorithms

| # | Algorithm Name | Core Technology | Operational Value |
|---|---|---|---|
| **1** | **Multi-Factor Priority & Safety Risk Scorer** | XGBoost Regressor + SHAP | Quantifies asset failure risk (0–100) using tonnage (GMT), Track Geometry Index (TGI), and overdue days. |
| **2** | **Spatial-Temporal Clustering & Bundling Generator** | Geo-Spatial KM Clusterer | Detects candidate multi-department co-located tickets sharing tracks or OHE subsectors. |
| **3** | **Multi-Department Block Scheduling Engine** | Google OR-Tools CP-SAT | Formulates directional track non-overlap, machine cumulative capacity, and bundling bonuses in $<30$s. |
| **4** | **Dynamic Train Dispatch & Delay Propagator** | Discrete-Event Simulator | Simulates loop line train holding, precedence rules (Vande Bharat > Freight), and cascading delays. |
| **5** | **AI Operational Reasoner & Dispatch Explainer** | SHAP Attribution + Gemini API | Generates official, legal-grade Railway Dispatch Memos and Punctuality Trade-off Justifications. |
| **6** | **What-If Hot-Restart Replanning Engine** | CP-SAT Warm-Start (`AddHint`) | Instant re-optimization in $<3$ seconds for emergency rail fractures or delayed premium trains. |

---

## 4. The 3-Phase Execution Roadmap

```
Week 1-4: PHASE 1 - The Core Tactical Engine & Divisional POC
├── Docker Compose + PostgreSQL (PostGIS) + Redis
├── Delhi-Kanpur Corridor Dataset (NDLS-GZB-CNB with real train timetables)
├── OR-Tools CP-SAT Block Bundling Optimizer
└── Divisional Control Cockpit MVP (Map + Gantt + 1-Click Optimize)
🎯 Milestone: Working POC collapsing 5.5h separate blocks into 2h.

Week 5-8: PHASE 2 - Enterprise Hierarchy, Intelligence & Safety Handshake
├── 4-Tier Role-Based Portals (/field, /division, /zone, /board)
├── Digital Safety Handshake (Disconnection Memo -> PTW -> Track Fit -> Caution Orders TSR)
├── XGBoost ML Priority Scorer + SHAP Feature Attribution
├── Gemini LLM Operational Dispatch Justification Generator
└── Interactive What-If Simulator (Emergency fracture & train delay injection in <3s)
🎯 Milestone: Feature-packed multi-tier system with live safety memos and simulation.

Week 9-12: PHASE 3 - Production Hardening, Zonal Scale & Competition Win
├── Multi-Division Golden Corridor Synchronization
├── Track Machine Organization (TMO) Fleet Routing
├── Comprehensive Automated Testing (>85% Coverage)
├── Cloud Production Deployment (AWS / Docker)
└── 15-Minute Winning Pitch Rehearsal, Backup Video & Q&A Defense
🎯 Milestone: Production deployment ready for deployment review and hackathon win!
```

---

## 5. Key Business & Technical Metrics

* **Asset Availability Improvement**: **+30% to +42%** additional operational track hours.
* **Maintenance Block Reduction**: **40% to 50% fewer separate traffic possessions**.
* **Optimization Computation Speed**: **$<30$ seconds** for 100+ weekly requests; **$<3$ seconds** for emergency what-if replanning.
* **Train Impact Reduction**: **50% reduction in delayed trains** through low-density window alignment.
* **Code Quality & Reliability**: **$>85\%$ test coverage** across backend solvers, APIs, and multi-portal frontend.
