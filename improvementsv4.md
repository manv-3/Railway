# Enterprise Pan-India & Safety-Critical Engineering Blueprint (v4.0)
## PS 26027: AI-Powered Automatic Block Planning Platform for Indian Railways

**Target Standard**: Safety Integrity Level 4 (SIL-4) Architecture · Pan-India Multi-Zonal Deployment (CRIS / RDSO / Ministry of Railways)  
**Document**: `improvementsv4.md`  
**Intended Audience**: Autonomous AI Agents, Systems Architects & Core Development Team  
**Baseline**: v3.0 (Production-Hardened Prototype, 56/56 tests passing) $\longrightarrow$ **Target**: v4.0 (Nationwide Mission-Critical Deployment)

---

## 1. Executive Synthesis: Where We Stand & The Path to v4.0

In **v3.0**, the platform achieved major production-hardening milestones:
- Versioned Alembic migrations replacing raw `create_all()`.
- Redis token-bucket sliding-window rate limiting (10/15/120 req/min).
- Immutable G&SR statutory audit trail with SHA-256 payload hashing.
- Asynchronous HTTP 202 Accepted optimizer pattern with Redis progress tracking and WebSocket feeds.
- Route-level frontend code splitting via `React.lazy()` with bundle size reduced from 683 kB to $<260\text{ kB}$ chunks.
- IRPWM OMS-2000 / TG-4 Track Recording Car CSV telemetry parser.
- Interactive SVG Yard Interlocking Schematics for Ghaziabad (`GZB`) and Aligarh (`ALJN`).
- 56 out of 56 automated Pytest tests passing cleanly.

However, deploying this system across **Indian Railways' 68 Divisions and 17 Zonal Railways** to govern daily operations of 13,000+ passenger trains and 9,000+ freight rakes requires addressing the remaining deep-domain, architectural, and safety challenges.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 v3.0 TO v4.0 EVOLUTION MATRIX                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

 ARCHITECTURAL DOMAIN      v3.0 STATUS (HARDENED PROTOTYPE)       v4.0 ENTERPRISE REQUIREMENT
───────────────────────────────────────────────────────────────────────────────────────────────────
 Track & Signalling Model  Coarse station-to-station edges        Sub-km Automatic Block Signalling (ABS);
                           (82 km block sections).                1.0 km track circuits; dynamic turnouts.

 Locomotive Telemetry      Static timetables + CSV parser.        Live ISRO NavIC RTIS GPS streaming;
                                                                  Kalman-filtered dynamic ETA drift updates.

 Train Collision Safety    Database advisory state machine.       Direct Kavach (TCAS) Digital Movement 
                                                                  Authority (Packet 51/65 TSR braking curves).

 Audit Legal Admissibility SHA-256 payload hash in Postgres.      PKCS#11 / X.509 Asymmetric Hardware Token
                                                                  Digital Signatures (IT Act 2000 compliant).

 Machine Learning Core     Offline synthetic XGBoost model.       Automated MLOps continuous training loop
                                                                  with drift detection on live TG-4 logs.

 Solver Scalability        In-process background tasks fallback;  Dedicated Celery multi-queue cluster;
                           single-division focus.                 17 Zonal worker pools; 68 division RLS.

 Mobile Field Operations   Desktop/mobile web browser portal.     Offline-first PWA with IndexedDB sync
                                                                  and geotagged rail defect photo capture.

 Safety Fail-Safe & Chaos  Unit & basic scenario tests.           Automated Chaos Engineering suite with
                                                                  multi-failure grid blackout simulations.
───────────────────────────────────────────────────────────────────────────────────────────────────
```

---

## 2. Category 1: Sub-Kilometer Signal Block-Headway & Interlocking Topology (The Core Solver Engine)

### 2.1 The Operational Deficit (Why V3-05 Must Be Solved)
In v3.0, track sections are coarse station-to-station edges (e.g. `SEC_GZB_ALJN_UP` spans 82 km). When a 2-hour tamping possession is granted for KM 44.0–46.0, the solver locks the entire 82 km section.  
In real Indian Railways quadruple-track trunk corridors, track is equipped with **Automatic Block Signalling (ABS)** with 4-aspect signals (Green, Double Yellow, Yellow, Red) spaced every **1.0 km**. Furthermore, stations possess **crossover turnouts** enabling trains to cross from the `UP_FAST` line to the `UP_SLOW` line.

### 2.2 Mathematical ABS Discretization & Interlocking Turnouts
* **Target Files**: `backend/optimization/cpsat_optimizer.py`, `backend/database/models.py`, `backend/alembic/versions/002_signal_block_topology.py`
* **Agent Action Items**:
  1. **Schema Extension**: Extend `sections` table to introduce `signal_blocks`:
     ```python
     class SignalBlock(Base):
         __tablename__ = "signal_blocks"
         id = Column(String(50), primary_key=True)       # e.g., "SIG_GZB_ALJN_UP_KM44"
         section_id = Column(String(50), ForeignKey("sections.id"), nullable=False)
         start_km = Column(Float, nullable=False)        # 44.0
         end_km = Column(Float, nullable=False)          # 45.0
         signal_aspect_id = Column(String(50))           # e.g., "S_44_UP"
         has_crossover = Column(Boolean, default=False)  # Turnout switch to slow line
         crossover_target_section_id = Column(String(50), nullable=True)
     ```
  2. **Solver Reformulation**:
     - Discretize maintenance work into specific affected `signal_blocks` ($KM_{\text{work}} \pm 1.0\text{ km}$ buffer).
     - Instead of locking the whole section, enforce `AddNoOverlap` **only on the specific affected signal blocks**.
     - For unaffected signal blocks on the same section, allow running trains with standard headway separation:
       $$t_{\text{train}, j+1} - t_{\text{train}, j} \ge h_{\text{headway}} \quad (h_{\text{headway}} = 3\text{ minutes})$$
     - When a block occurs at KM 44–46, model the dynamic diversion: If crossover exists at KM 42, trains divert to `UP_SLOW` line, rejoining mainline via crossover at KM 48.

---

## 3. Category 2: Live RTIS NavIC GPS Telemetry & Closed-Loop Replanning

### 3.1 Architecture Overview
Locomotives on Indian Railways are equipped with **Real-Time Train Information System (RTIS)** transponders developed with ISRO. Locos transmit GPS position, speed, and heading over NavIC satellite transponders every 30 seconds.

```
┌─────────────────┐       30s GPS Telemetry       ┌─────────────────────────────────┐
│ Loco WAP-7 / VB │ ────────────────────────────► │ RTIS Live Ingest Stream (Kafka) │
└─────────────────┘                               └────────────────┬────────────────┘
                                                                   │
                                                                   ▼
┌──────────────────────────────┐     Drift > 10m   ┌─────────────────────────────────┐
│ Dynamic Solver Warm-Restart  │ ◄──────────────── │ Kalman Filter ETA Predictor     │
│ (Shift start window / loops) │                   │ (Computes Δt to Section Entry)  │
└──────────────────────────────┘                   └─────────────────────────────────┘
```

### 3.2 Implementation Specifications
* **Target Files**: `backend/integrations/rtis_live_stream.py`, `backend/optimization/simulation.py`, `backend/api/routes/simulation.py`
* **Agent Action Items**:
  1. **RTIS Ingest Worker**:
     - Implement async MQTT / Kafka consumer listening to topic `ir.rtis.loco_telemetry`.
     - Ingest payload: `{loco_number: "30201", train_number: "22436", lat: 28.614, lon: 77.209, speed_kmh: 128.4, timestamp: "..."}`.
  2. **Kalman ETA Drift Calculation**:
     - Compute distance remaining to upcoming block section boundary:
       $$\text{ETA}_{\text{entry}} = t_{\text{now}} + \frac{d_{\text{remaining}}}{v_{\text{rolling\_avg}}}$$
     - If $\Delta t = |\text{ETA}_{\text{entry}} - \text{ScheduledTime}| > 10\text{ minutes}$, trigger automated closed-loop adjustment:
       - If high-priority passenger (e.g. Vande Bharat 22436) is delayed, slide the maintenance block window forward to utilize the vacated operational gap.
       - Broadcast `LIVE_TRAIN_DRIFT` event via WebSocket to the Divisional Cockpit.

---

## 4. Category 3: Automated Kavach (TCAS) Digital Protection Envelopes

### 4.1 Regulatory Requirement
Under Indian Railways Safety Directives and RDSO Specification `RDSO/SPN/196`, all trunk route maintenance must integrate with **Kavach (Train Collision Avoidance System)**.  
When an Engineering or OHE block is active, relying solely on Loco Pilots noticing physical banner flags and detonators presents a severe safety hazard. The system must inject electronic braking curves directly into locomotive onboard Kavach computers.

### 4.2 Implementation Specifications
* **Target Files**: `backend/integrations/kavach_adapter.py`, `backend/api/routes/blocks.py`
* **Agent Action Items**:
  1. **Kavach Packet 51 / 65 Generator**:
     - When block status transitions to `DISCONNECTED` or `PTW_GRANTED`, automatically compile an RDSO-compliant **Kavach TSR Profile (Packet 51)**:
       ```python
       class KavachTSRProfile:
           block_id: str
           section_id: str
           start_km: float
           end_km: float
           max_authorized_speed_kmh: int # 0 km/h (Dead Stop) or 30 km/h (Caution)
           direction: str                # UP / DOWN
           rfid_tag_entry: str           # Station boundary tag
           valid_from: datetime
           valid_until: datetime
           crc32_checksum: str
       ```
  2. **Radio Block Center (RBC) Simulation**:
     - Expose endpoint `GET /api/v1/kavach/active-profiles` queried by trackside Kavach Radio Towers (UHF 433 MHz gateway).
     - Provide automatic braking curve calculation enforcing zero speed before work site entry point.

---

## 5. Category 4: PKI / X.509 Hardware Token Digital Signatures for G&SR Audit

### 5.1 Legal Admissibility under Indian Law (IT Act 2000 & G&SR Rule 4.07)
A simple database timestamp and user string is insufficient for formal inquiry in the event of an accident. The **Commissioner of Railway Safety (CRS)** requires non-repudiable digital signatures compliant with the Indian Controller of Certifying Authorities (CCA).

### 5.2 Implementation Specifications
* **Target Files**: `backend/core/pki_signer.py`, `backend/api/routes/blocks.py`, `backend/database/models.py`
* **Agent Action Items**:
  1. **PKI Signature Scheme**:
     - Upgrade `statutory_audit_logs` to include:
       - `x509_certificate_serial`: Station Master / TPC e-Token certificate serial number.
       - `digital_signature_der`: PKCS#7 / CMS cryptographic digital signature.
       - `signed_digest`: Enclosing actor ID, block ID, timestamp, and track section coordinates.
  2. **Station Master WebCrypto API Handshake**:
     - In `FieldStationPortal.tsx`, allow Station Masters to sign Form T/351 using the browser's native `window.crypto.subtle` or hardware e-Pass USB token.
  3. **CRS Formal Inquiry Audit Export**:
     - Endpoint `GET /api/v1/blocks/{id}/crs-audit-packet`: Generates an encrypted, self-verifying ZIP bundle containing signed memos, PTWs, track fit certs, and raw timestamped telemetry for judicial safety audits.

---

## 6. Category 5: Continuous Machine Learning & Real-World Track Telemetry MLOps

### 6.1 Closing the Loop: Synthetic to Real Track Degradation Data
In v3.0, we built `track_recording_car_parser.py`. In v4.0, we must connect this parser to an automated **Continuous Model Retraining Pipeline**.

### 6.2 Implementation Specifications
* **Target Files**: `backend/ml/continuous_learner.py`, `backend/ml/train_risk_model.py`, `backend/ml/risk_explainer.py`
* **Agent Action Items**:
  1. **Automated MLOps Pipeline**:
     - Monitor folder `/data/telemetry/oms_uploads/` for new OMS-2000 / TG-4 CSV files.
     - Automatically parse Track Geometry Index (TGI), Twist, and Alignment standard deviations.
     - Update historical section degradation database table: `section_degradation_history`.
  2. **Champion-Challenger Model Validation**:
     - Retrain XGBoost risk model using 80/20 train/validation split on accumulated real-world data.
     - Evaluate challenger model: If $R^2 \ge R^2_{\text{champion}}$ and RMSE is lower, promote challenger to `backend/ml/xgboost_risk_model.json`.
     - Log model metrics, training epoch, and SHAP baseline distributions into `ml_model_registry` table.

---

## 7. Category 6: Pan-India Multi-Zonal Architecture & Row-Level Tenancy (RLS)

### 7.1 Zonal Federation Across 17 Zones & 68 Divisions
The platform must support hierarchical tenancy matching Indian Railways:
- **Railway Board (Tier 1)**: Visibility across all 17 Zones and 68 Divisions.
- **Zonal HQ (Tier 2)**: Scoped to the specific Zone (e.g. `ZONE_NR` - Northern Railway, `ZONE_NCR` - North Central Railway).
- **Divisional Control (Tier 3)**: Scoped strictly to the division (e.g. `DIV_DLI` - Delhi, `DIV_PRYJ` - Prayagraj).

### 7.2 Implementation Specifications
* **Target Files**: `backend/database/tenancy.py`, `backend/api/routes/corridor.py`, `backend/api/routes/maintenance.py`
* **Agent Action Items**:
  1. **PostgreSQL Row-Level Security (RLS)**:
     - Enable RLS on `maintenance_requests`, `maintenance_blocks`, and `train_schedules`.
     - Set session context: `SET LOCAL app.current_division_id = 'DIV_DLI'`.
  2. **Inter-Zonal Boundary Peering Gateway**:
     - Model boundary interchange stations (`ALJN` between NR and NCR; `MGS` between NCR and ECR; `BPL` between NCR and WCR).
     - Implement mutual handshake: Both adjoining divisions must concur before a boundary section block is committed.

---

## 8. Category 7: Offline-First Progressive Web App (PWA) for Field Gangmen

### 8.1 Rural Connectivity Reality
Senior Section Engineers (P-Way), Junior Engineers, and Track Maintainers (Gangmen) perform daily foot inspections in deep rural terrain where 4G cellular signal is frequently lost.

### 8.2 Implementation Specifications
* **Target Files**: `frontend/vite.config.ts`, `frontend/src/service-worker.ts`, `frontend/src/services/offline_store.ts`
* **Agent Action Items**:
  1. **PWA & Service Worker Configuration**:
     - Integrate `vite-plugin-pwa` with `Workbox`.
     - Cache all static assets, GIS track station datasets, and offline forms.
  2. **Offline Requisition Queue (IndexedDB)**:
     - Using `localforage`, allow field engineers to create defect tickets offline with:
       - GPS coordinates from device hardware (`navigator.geolocation`).
       - Geotagged camera photo attachment of rail fractures / point damage (compressed to WebP $<100\text{ kB}$).
     - On cellular signal restoration, automatically trigger **Background Sync API** (`sync-maintenance-tickets`) to upload pending tickets and fetch ML risk scores.

---

## 9. Category 8: Chaos Engineering & Safety Fail-Safe Simulation Suite

### 9.1 The Need for Chaos Verification
In safety-critical systems, it is not enough that tests pass on happy paths. The platform must be proven resilient against simultaneous compound failures.

### 9.2 Implementation Specifications
* **Target Files**: `backend/tests/chaos/test_chaos_disaster_recovery.py`
* **Agent Action Items**:
  1. **Compound Disaster Scenarios**:
     - **Scenario 1 (Triple Failure)**: Inject simultaneous broken rail at KM 52 + OHE wire snap at KM 84 + signaling circuit failure at KM 110. Verify solver successfully holds traffic in station loops without creating deadlocks or collisions.
     - **Scenario 2 (Severe Fog / Low Visibility)**: Impose maximum speed restriction ($60\text{ km/h}$) across all trains; verify solver dynamically recalculates block buffer gaps.
     - **Scenario 3 (Database / Redis Network Partition)**: Sever Redis connection during active optimization; verify system falls back to PostgreSQL memory state without dropping in-flight safety memos.

---

## 10. Actionable Implementation Task Matrix (v4.0)

| Task ID | Priority | Category | Deliverable Summary | Target Files | Verification Metric / Command |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **V4-01** | **P0** | Signalling | 1.0 km Automatic Block Signalling (ABS) discretization | `backend/optimization/cpsat_optimizer.py` | `pytest tests/test_signal_blocks.py` (Assert 1km block isolation) |
| **V4-02** | **P0** | Signalling | Dynamic turnout switches & crossover line diversions | `backend/optimization/cpsat_optimizer.py` | `pytest tests/test_crossover_diversion.py` (Assert zero stop on diversion) |
| **V4-03** | **P0** | Telemetry | Live ISRO NavIC RTIS GPS streaming & Kalman ETA drift | `backend/integrations/rtis_live_stream.py` | `pytest tests/test_rtis_stream.py` (Assert $<100\text{ms}$ drift handling) |
| **V4-04** | **P1** | Train Safety | Kavach (TCAS) Digital Movement Authority & TSR Packet | `backend/integrations/kavach_adapter.py` | `pytest tests/test_kavach_packets.py` (Verify Packet 51 CRC32) |
| **V4-05** | **P1** | Compliance | X.509 Asymmetric Hardware Token Signature (PKI) | `backend/core/pki_signer.py` | `pytest tests/test_pki_audit.py` (Verify Ed25519/RSA signature) |
| **V4-06** | **P1** | MLOps | Continuous online retraining with real TG-4 CSV logs | `backend/ml/continuous_learner.py` | `pytest tests/test_continuous_ml.py` (Verify model promotion) |
| **V4-07** | **P1** | Scalability | Distributed Celery worker cluster with Zonal queues | `backend/tasks/optimizer_worker.py` | `docker compose -f docker-compose.prod.yml up -d celery_worker` |
| **V4-08** | **P1** | Mobile PWA | Offline-first IndexedDB ticket queuing & photo ingest | `frontend/src/services/offline_store.ts` | `npm run build && npx playwright test tests/e2e/pwa_offline.spec.ts` |
| **V4-09** | **P2** | Multi-Tenancy | Row-Level Security (RLS) across 17 Zones & 68 Divisions | `backend/database/tenancy.py` | `pytest tests/test_zonal_tenancy.py` (Verify tenant isolation) |
| **V4-10** | **P2** | Chaos Suite | Automated Disaster & Multi-Point Failure Chaos Tests | `backend/tests/chaos/test_chaos.py` | `pytest tests/chaos/ -v` (Zero deadlock assertion) |

---

## 11. Core Operating Principles for Future Agents Working on v4.0

1. **Safety is Inviolable (FAIL-SAFE BY DESIGN)**:
   - When inputs are ambiguous, delayed, or corrupt, the solver must default to the most restrictive state (hold trains at station loop lines; never authorize entry into uncertified track sectors).
2. **Never Treat Coarse Sections as Single Edges**:
   - Quadruple-line Indian Railways corridors must always be treated as discrete 1.0 km track circuits with directional turnout crossover availability.
3. **Legal Non-Repudiation is Mandatory**:
   - Every G&SR safety handshake action must be cryptographically signed. Do not record plain text status changes without capturing verifiable digital signatures.
4. **Offline-First for the Field**:
   - Field tools must never fail because a remote section of track in Uttar Pradesh or Bihar lacks 4G cellular data. All field state must queue locally and synchronize reliably.
