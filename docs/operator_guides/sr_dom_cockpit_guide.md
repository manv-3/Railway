# Standard Operating Procedure (SOP): Sr. DOM Corridor Master Cockpit
**Indian Railways | Ministry of Railways | Operations & Punctuality Wing**
**Target Roles**: Senior Divisional Operations Manager (Sr. DOM), Senior Divisional Engineer (Sr. DEN/Co-ord), Chief Controller (CHC), Section Controller (SCOR).

---

## 1. Executive Purpose & Role Scope
The **Corridor Master Cockpit** is the authoritative real-time decision-support system for high-density railway corridors (specifically tested on the Golden Corridor: *New Delhi - Ghaziabad - Kanpur Central*). It replaces manual paper-based block memos and fragmented divisional phone calls with an automated, constraint-satisfaction scheduling engine, continuous Machine Learning risk telemetry, and cross-divisional synchronization.

### Key Objectives for Operating Officers:
1. **Punctuality Preservation**: Protect Mail/Express & Vande Bharat priority slots while executing statutory track, signal, and electrical maintenance.
2. **Multi-Departmental Bundling**: Ensure zero isolated maintenance blocks. Whenever an engineering tamper occupies a section, OHE tower wagons and S&T point-machine overhauls are bundled simultaneously.
3. **Cross-Boundary Capacity Guarantee**: Eliminate border gridlocks at division junctions (e.g., Aligarh `ALJN` interchange with Northern Railway) by enforcing staggered block timetables.

---

## 2. Navigating the Cockpit Interface

### 2.1 Top Corridor Status Bar
- **Corridor Topology**: Displays the active route, e.g., `NDLS -> GZB -> ALJN -> CNB (435 km, 4 Dedicated Lines)`.
- **System Telemetry**: Displays the live WebSocket connection status (`Live Sub-5ms WebSocket Feed`). If disconnected, an auto-reconnect fallback is initiated.
- **Section Occupation Metrics**: Shows current sectional line capacity utilization (0–100%) color-coded green (<70%), amber (70–85%), or red (>85%).

### 2.2 Corridor Interactive Track Diagram (GIS & Node View)
- Stations (`NDLS`, `GZB`, `ALJN`, `TDL`, `ETW`, `FTP`, `CNB`) are rendered as clickable topological nodes with directional block sections (`UP`, `DN`, `UP_SLOW`, `DN_SLOW`).
- **Section Colors**:
  - **Blue Border**: Free sectional running.
  - **Orange Pulsing Border**: Scheduled or active maintenance block.
  - **Red Flashing Border**: Emergency track fracture or unauthorized obstruction.

---

## 3. Step-by-Step Block Optimization Workflow

### Step 1: Ingestion & Verification of Maintenance Demands
1. Open the **Maintenance Demands Tab** in the Cockpit.
2. Verify pending demands submitted by:
   - **Civil Engineering**: Track tamping, deep screening, ultrasonic flaw detection (USFD), rail renewal.
   - **Traction Distribution (TRD)**: 25 kV AC OHE contact wire inspection, bracket renewal.
   - **Signal & Telecommunications (S&T)**: Electronic Interlocking testing, axle counter calibration, point machine overhaul.
3. Observe the automated **AI Priority Score (0–100)**:
   - Evaluated by the XGBoost Risk Regressor.
   - High-risk items (>75) indicate imminent safety hazards or severe Track Geometry Index (TGI) degradation and require immediate allocation.

### Step 2: Running the CP-SAT Multi-Department Optimizer
1. Click the **"Run Multi-Department Optimizer"** button located at the top-right of the Cockpit.
2. Review the solver metrics dialog displayed within 100 milliseconds:
   - **Solver Execution Time**: ~0.05s to 0.15s (stress tested to 15.1s on 150 items across 7 days).
   - **Bundling Efficiency**: Number of discrete maintenance demands grouped into unified Super-Blocks.
   - **Track Downtime Saved**: Cumulative track possession hours saved vs. uncoordinated, sequential execution.
   - **Asset Availability Gain**: Target asset capacity gain between +35% and +45%.
3. Confirm the suggested **Super-Block Schedule** on the Gantt chart.

### Step 3: Inspecting Explainable AI (SHAP) Risk Drivers
1. For any demand highlighted with high risk, click the **"Explain AI Risk"** icon adjacent to the score.
2. The **SHAP Force Plot Dialog** decomposes the score into physical railway variables:
   - *Defect Severity (USFD Flaw / Fracture)*: e.g., $+15.52\%$ contribution.
   - *TGI Degradation*: e.g., $+7.63\%$ contribution.
   - *Overdue Days*: e.g., $+1.77\%$ contribution.
   - *Speed Potential*: Baseline speed penalty.
3. Review the model's physical justification before counter-signing or deferring the maintenance request.

### Step 4: Joint Departmental Sanction Handshake
1. To finalize the block plan for dispatch, the Sr. DOM initiates the **Joint Sanction Handshake**:
   - In accordance with Indian Railways G&SR Rule 4.07, multi-departmental blocks require concurrence from Operating, Civil, TRD, and S&T wings.
2. Click **"Grant Joint Sanction"**.
3. The system transitions the block status from `PROPOSED` to `SANCTIONED` and transmits cryptographic tokens to the Station Master and Traction Power Controller (TPC) consoles.

---

## 4. Inter-Divisional Corridor Synchronization (NCR & NR Boundary)

### 4.1 Boundary Bottleneck Prevention at Aligarh (`ALJN`)
1. In the navigation sidebar, select **"Inter-Divisional Sync"**.
2. The view fetches the current synchronization metrics between **NCR (Prayagraj Division)** and **NR (Delhi Division)**.
3. Key Metrics Monitored:
   - **Section Handover Capacity**: Minimum clearance rate (target: $\ge 5.0$ trains/hour).
   - **Bottleneck Conflict Status**: Indicates whether upstream NR train feeds conflict with downstream NCR blocks.
   - **Stagger Recommendation**: When blocks overlap simultaneously at border sections, the engine staggers the block schedule by $30–45$ minutes to preserve through-corridor velocity.

---

## 5. TMO Machine Fleet Routing & Deadheading Minimization

1. Open the **"TMO Machine Fleet"** panel.
2. View the heavy track machine fleet:
   - *CSM Tampers*, *Dynamic Track Stabilizers (DTS)*, *Ballast Regulators (BRM)*, and *OHE Tower Wagons*.
3. Verify the Dijkstra/Greedy route optimization:
   - **Speed-Profile Constraints**: Machine speeds restricted to $40–65\text{ km/h}$ depending on machine classification.
   - **Diesel Fuel Savings**: View fuel conserved (liters) by chaining sequential maintenance sites without returning to base depots.
   - **Fleet Utilization**: View operating machine efficiency percentages (target: $>90\%$).

---

## 6. What-If Emergency Crisis Replanning (Sub-3s Hot-Restart)

In the event of an unplanned incident during corridor operations:
1. **Scenario Injection**:
   - In the **What-If Simulation Panel**, select the crisis type:
     - *Emergency Rail Fracture* (e.g., KM 52.4 on `SEC_GZB_ALJN_UP`).
     - *Catastrophic OHE Sag / Power Breakdown*.
     - *Major Express Train Delay* (e.g., 45-minute delay on NDLS-bound Rajdhani).
2. Click **"Inject & Re-Optimize Corridor"**.
3. **Automated Safety & Routing Engine Response**:
   - Executes solver re-plan within $80–120\text{ ms}$.
   - Automatically diverts or holds lower-priority freight trains in station **Common Loop Lines** (e.g., Ghaziabad Loop 3).
   - Preserves zero detention for high-priority trains (e.g., Vande Bharat Express 22436).
   - Computes temporary Caution Orders (TSR $30\text{ km/h}$ or $45\text{ km/h}$) automatically.
4. Verify the side-by-side **Baseline vs. Perturbed Schedule Comparison** and click **"Apply Emergency Re-plan to Live Corridor"**.
