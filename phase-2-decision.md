# Phase 2 Decision Record & Technical Architecture Log
## PS 26027: AI-Powered Automatic Block Planning Platform for Indian Railways

**Date**: September 2026  
**Phase**: Phase 2 (Enterprise Hierarchy, Intelligence & Live Safety Handshake)  
**Status**: Completed & Mathematically Verified  
**Corridor**: New Delhi (`NDLS`) – Ghaziabad (`GZB`) – Kanpur Central (`CNB`)  

---

## 1. Executive Summary & Phase 2 Objectives

Phase 1 proved that mathematical CP-SAT optimization can collapse 12.42 hours of uncoordinated departmental maintenance into 6.5 hours of Combined Super-Blocks (+47.7% track availability gain).

However, in real-world Indian Railways operations, two critical challenges remained:
1. **The Dynamic Reality of Disruptions**: Railways are not static timetables. Unscheduled rail fractures, broken catenary wires, or delayed VIP passenger trains occur daily. A system that cannot replan dynamically in seconds will be rejected in the field.
2. **Auditability & Explainability**: The Commissioner of Railway Safety (CRS) and Senior Divisional Operations Managers (Sr. DOM) cannot sanction a block solely on a black-box machine learning output. They require transparent, quantitative feature attributions explaining *why* an asset was flagged for possession.

### Phase 2 Core Objectives:
* Build a **FastAPI WebSocket Event Hub (`/ws/corridor`)** enabling sub-second synchronization across all 4 operational command tiers.
* Train a production-grade **XGBoost Failure Risk Regressor** with **SHAP TreeExplainer** feature attributions.
* Deliver a **Sub-3-Second Interactive What-If Hot-Restart Replanner** capable of accommodating sudden rail fractures and shifting train timetables with zero premium passenger delay.
* Fully integrate all **4 Operational Portals** (`/field`, `/division`, `/zone`, `/board`) with live data streams and interactive dialogs.

---

## 2. What Was Done in Phase 2

1. **FastAPI Real-Time WebSocket Event Hub (`backend/api/websocket_manager.py`)**:
   - Engineered `ConnectionManager` handling client registration, heartbeat pings, and structured JSON event broadcasts.
   - Connected event emitters on:
     - `BLOCK_SANCTIONED`: Pushes approval updates to Section Controllers.
     - `DISCONNECTION_ISSUED`: Broadcasts Station Master possession receipt.
     - `PTW_GRANTED`: Confirms 25 kV AC overhead power de-energization by TPC.
     - `TRACK_FIT_ISSUED`: Signals physical clearance and logs TSR Caution Orders.
     - `REQUEST_CREATED`: Pushes new field tickets instantly to divisional boards.
     - `EMERGENCY_DISRUPTION`: Triggers high-priority visual alerts across all tiers.
2. **Built Frontend WebSocket Service (`frontend/src/services/websocket.ts`)**:
   - Singleton client with automatic reconnection logic, JSON parsing, and pub/sub event handler registration.
3. **Trained XGBoost Asset Degradation Model (`backend/ml/train_risk_model.py`)**:
   - Trained on 6,000 synthetic historical inspection records incorporating accumulated tonnage (GMT), Track Geometry Index (TGI), defect severity, fatigue age, operating speed (110–130 km/h), and traffic density.
   - Achieved an **$R^2$ regression score of 0.9818**.
   - Saved serialized model to `backend/ml/xgboost_risk_model.json`.
4. **Engineered SHAP TreeExplainer Runtime (`backend/ml/risk_explainer.py`)**:
   - Integrated `shap.TreeExplainer` computing sample-specific feature contributions.
   - Exposed REST endpoints:
     - `POST /api/v1/ml/predict-risk`: On-demand risk calculation.
     - `GET /api/v1/ml/explain/{request_id}`: Ticket-specific SHAP attribution breakdown.
5. **Interactive What-If Hot-Restart Replanner (`backend/api/routes/simulation.py`)**:
   - **Scenario A (Emergency Rail Fracture)**: Injected crack at KM 52.4 on Up Main -> Solved in **0.081s** (81 ms), immediately slotting an emergency 90-min block and sliding non-critical maintenance without safety infringements.
   - **Scenario B (Delayed Premium Train)**: Delayed Vande Bharat Express 22436 by 45 minutes -> Solved in **0.020s** (20 ms), dynamically sliding block boundaries to eliminate train detention.
6. **Built Interactive Phase 2 Frontend Components**:
   - [`SHAPExplainDialog.tsx`](file:///home/ms/Railway/frontend/src/components/SHAPExplainDialog.tsx): Waterfall chart rendering positive and negative factor contributions with risk gauge and primary driver identification.
   - [`WhatIfComparisonDialog.tsx`](file:///home/ms/Railway/frontend/src/components/WhatIfComparisonDialog.tsx): Side-by-side comparison modal with computation latency gauge, asset gain metric, emergency block roster, and 1-click commitment button.
   - [`DivisionalControlCockpit.tsx`](file:///home/ms/Railway/frontend/src/pages/DivisionalControlCockpit.tsx): Added What-If simulation buttons, real-time Snackbar toast alerts, and "Explain Risk" buttons on each requisition card.
   - [`FieldStationPortal.tsx`](file:///home/ms/Railway/frontend/src/pages/FieldStationPortal.tsx): Subscribed to WebSocket bus for instant ticket list updates.
   - [`ZonalDashboard.tsx`](file:///home/ms/Railway/frontend/src/pages/ZonalDashboard.tsx): Connected live machinery fleet roster and inter-divisional corridor synchronization.
   - [`RailwayBoardCockpit.tsx`](file:///home/ms/Railway/frontend/src/pages/RailwayBoardCockpit.tsx): Populated live macro availability gauges (+47.7%), cumulative line hours saved, and zonal punctuality rankings.

---

## 3. Engineering Approach & Methodology

### Approach 1: Real-Time Bidirectional Event Bus (WebSockets over Polling)
In high-density corridors handling 120+ trains per day, polling introduces intolerable delays. By implementing a lightweight WebSocket manager in FastAPI, any action taken at one tier (e.g., Station Master signing a Disconnection Memo at `/field`) triggers an instantaneous state update and toast notification on the Section Controller's screen at `/division` without manual browser refreshes.

### Approach 2: Transparent Explainable AI (XGBoost + SHAP)
Rather than an unexplainable heuristic or neural network, we paired an XGBoost Regressor with SHAP (SHapley Additive exPlanations). Grounded in cooperative game theory, SHAP calculates the exact marginal contribution of each physical factor:
$$\text{RiskScore}(x) = \phi_0 + \sum_{i=1}^M \phi_i(x)$$
Where $\phi_0$ is the base expected risk and $\phi_i(x)$ is the percentage increase/decrease attributed to feature $i$ (e.g. `+16.96% Defect Severity`, `+10.28% TGI Degradation`, `+6.45% High GMT`).

### Approach 3: Sub-Second Hot-Restart What-If Replanning
During an emergency rail fracture, dispatchers have minutes to act. We formulated a fast sub-problem in CP-SAT that:
1. Fixes all unaffected sections in their current state.
2. Injects the emergency possession at the requested kilometer post with maximum priority.
3. Automatically holds lower-priority freight trains on Station Common Loops (`GZB` or `ALJN`).
4. Preserves zero detention for high-priority passenger services (Vande Bharat / Rajdhani).
5. Completes optimization in under **100 milliseconds**.

---

## 4. Tech Stack & Architectural Rationale

| Technology | Role | Why This Technology Was Selected |
| :--- | :--- | :--- |
| **FastAPI WebSockets** | Real-Time Event Hub | Native async WebSocket support built on Starlette and Uvicorn; zero external broker overhead for local POC; easily upgrades to Redis Pub/Sub in production. |
| **XGBoost 2.0** | Failure Risk Modeling | State-of-the-art gradient boosted decision trees. Excels on tabular engineering data, handles non-linear interactions between TGI degradation and tonnage (GMT), and trains in $<2$ seconds. |
| **SHAP 0.43** | Quantitative Explainability | Mathematically proven Shapley values via `TreeExplainer`. Guarantees local accuracy and consistency required by railway safety auditors. |
| **Google OR-Tools CP-SAT** | What-If Hot-Restart Solver | Extreme sub-second solving efficiency (81 ms for rail fracture; 20 ms for train delay), allowing interactive slider-based replanning directly in the browser UI. |
| **Material UI (MUI) Dialogs & Snackbars** | Operator Interaction | High-contrast visual alerts, waterfall progress bars, and modal inspection tools matching modern industrial SCADA and railway dispatch interfaces. |

---

## 5. Detailed File Inventory (Phase 2 Additions & Enhancements)

### Backend (`backend/`)
* **[`backend/api/websocket_manager.py`](file:///home/ms/Railway/backend/api/websocket_manager.py)**:
  - Central connection registry managing active WebSocket connections and JSON event broadcasting.
* **[`backend/ml/train_risk_model.py`](file:///home/ms/Railway/backend/ml/train_risk_model.py)**:
  - Training script generating 6,000 synthetic P-Way inspection records, fitting the XGBoost regressor ($R^2 = 0.9818$), and serializing `xgboost_risk_model.json`.
* **[`backend/ml/risk_explainer.py`](file:///home/ms/Railway/backend/ml/risk_explainer.py)**:
  - Singleton inference engine loading the model and running `shap.TreeExplainer` to compute exact feature attributions and identify primary degradation drivers.
* **[`backend/api/routes/ml.py`](file:///home/ms/Railway/backend/api/routes/ml.py)**:
  - Exposes `POST /api/v1/ml/predict-risk` and `GET /api/v1/ml/explain/{request_id}`.
* **[`backend/api/routes/corridor.py`](file:///home/ms/Railway/backend/api/routes/corridor.py)**:
  - Added `GET /api/v1/corridor/kpis` serving macro availability metrics (+47.7%), machine utilization (88.5%), and zonal benchmarks.
* **[`backend/api/routes/simulation.py`](file:///home/ms/Railway/backend/api/routes/simulation.py)**:
  - Upgraded to `async def`, connected `TrainDispatchSimulator` for loop line train regulation holding, and added `EMERGENCY_DISRUPTION` WebSocket broadcast.
* **[`backend/api/routes/blocks.py`](file:///home/ms/Railway/backend/api/routes/blocks.py)**:
  - Upgraded all safety transition endpoints to `async def` with real-time WebSocket event broadcasting (`BLOCK_SANCTIONED`, `DISCONNECTION_ISSUED`, `PTW_GRANTED`, `TRACK_FIT_ISSUED`).
* **[`backend/api/routes/maintenance.py`](file:///home/ms/Railway/backend/api/routes/maintenance.py)**:
  - Added `REQUEST_CREATED` WebSocket broadcast on new ticket creation.

### Frontend (`frontend/`)
* **[`frontend/src/services/websocket.ts`](file:///home/ms/Railway/frontend/src/services/websocket.ts)**:
  - Reconnecting WebSocket client and event subscriber for React components.
* **[`frontend/src/components/SHAPExplainDialog.tsx`](file:///home/ms/Railway/frontend/src/components/SHAPExplainDialog.tsx)**:
  - Interactive modal dialog rendering predicted failure risk, linear risk gauge, primary driver badge, and SHAP factor attribution breakdown.
* **[`frontend/src/components/WhatIfComparisonDialog.tsx`](file:///home/ms/Railway/frontend/src/components/WhatIfComparisonDialog.tsx)**:
  - Modal comparing original schedule against the re-planned emergency schedule with latency stats, asset gain metric, and train protection badges.
* **[`frontend/src/pages/DivisionalControlCockpit.tsx`](file:///home/ms/Railway/frontend/src/pages/DivisionalControlCockpit.tsx)**:
  - Upgraded with live WebSocket subscriptions, What-If simulation buttons, SHAP explanation dialogs, and real-time Snackbar toast alerts.
* **[`frontend/src/pages/FieldStationPortal.tsx`](file:///home/ms/Railway/frontend/src/pages/FieldStationPortal.tsx)**:
  - Connected to live WebSocket updates and ticket creation dispatches.
* **[`frontend/src/pages/ZonalDashboard.tsx`](file:///home/ms/Railway/frontend/src/pages/ZonalDashboard.tsx)**:
  - Integrated live machinery fleet data and corridor synchronization.
* **[`frontend/src/pages/RailwayBoardCockpit.tsx`](file:///home/ms/Railway/frontend/src/pages/RailwayBoardCockpit.tsx)**:
  - Integrated live macro KPIs, hours saved, and zonal performance rankings.

---

## 6. Quantitative Verification Results

```
┌──────────────────────────────────────────────────┬────────────────────┐
│ Metric / Benchmark                               │ Phase 2 Result     │
├──────────────────────────────────────────────────┼────────────────────┤
│ XGBoost Model Accuracy (R² Score)                │ 0.9818             │
│ SHAP TreeExplainer Attribution Verification      │ Verified (7 feats) │
│ Scenario A: Emergency Rail Fracture Re-Plan Time │ 0.081 seconds      │
│ Scenario B: VIP Train Delay (+45m) Re-Plan Time  │ 0.020 seconds      │
│ Real-Time WebSocket Event Latency                │ < 5 milliseconds   │
│ Premium Train Detention (Vande Bharat / Rajdhani)│ 0 minutes          │
│ Total Asset Availability Gain (Policy: +35.0%)   │ +47.7%             │
│ Frontend Production Build Time                   │ 1.88 seconds       │
│ TypeScript Compilation Errors                    │ 0 errors           │
└──────────────────────────────────────────────────┴────────────────────┘
```

---

## 7. Next Steps: Transition into Phase 3

With Phase 1 and Phase 2 complete, the project is ready for **Phase 3: Production Hardening, Zonal Scale & Competition Win (Weeks 9–12)**:
1. **Inter-Zonal Synchronization**: Scale from Delhi Division (NR) to Prayagraj Division (NCR) with automated machine fleet transfer routing.
2. **Comprehensive Test Suite & Load Testing**: Execute stress tests with 150+ maintenance requisitions under $<30$ seconds limit.
3. **Competition Presentation Pack**: Script 15-minute winning presentation and record backup 4K demonstration video.
