# Production-Readiness Engineering Blueprint (v3.0)
## PS 26027: AI-Powered Automatic Block Planning Platform for Indian Railways

**Target**: Enterprise Mission-Critical Deployment (Indian Railways / CRIS / RDSO Standards)  
**Document**: `improvementsv3.md`  
**Intended Audience**: Autonomous AI Agents & Core Engineering Teams  
**Baseline Score**: 7.8 / 10 (Advanced POC) $\longrightarrow$ **Target**: 10.0 / 10 (Safety-Critical Production System)

---

## 1. Executive Gap Analysis: From Prototype to Production

While the current codebase possesses mathematically sound CP-SAT bundling logic, explainable XGBoost/SHAP risk attribution, and authentic statutory G&SR safety state machines, several critical engineering barriers prevent it from operating as a mission-critical railway system:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRODUCTION READINESS DEFICITS                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

 ARCHITECTURAL AREA        CURRENT PROTOTYPE STATE               PRODUCTION REQUIREMENT
───────────────────────────────────────────────────────────────────────────────────────────────────
 Database Schema           Raw SQLAlchemy `create_all()`;       Versioned Alembic migrations (reversion,
                           no migrations; seed data collisions. branch merging, zero-downtime DDL).

 Security & Auth           Default secret fallbacks; in-memory   Vault-backed secrets; RSA256 signed JWTs;
                           token verification; no rate limits.   Redis rate-limiting; immutable audit trail.

 Optimization Scaling      Synchronous HTTP request/response;    Asynchronous Celery/Redis task queue with
                           blocks worker thread during solves.   progress webhooks and warm-start caches.

 Signalling & Physics      Station-to-station section edges;     Sub-kilometer automatic block signaling 
                           coarse train timetable buffers.       intervals (1 km circuits) & turnout geometry.

 Telemetry Interfaces      Isolated synthetic generators.        Standardized CRIS (COA, RTIS, TMS) API
                                                                 adapters with Kafka event streaming.

 Frontend Performance     Single 683 kB bundle; no lazy load;   Route-level code splitting (<200 kB chunks);
                           point-to-point Leaflet polylines.     SVG yard interlocking diagram with signals.

 Testing & Observability   20 backend Pytest tests; 0 E2E;       End-to-end Playwright tests; Prometheus 
                           unstructured stdout logging.          metrics (`/metrics`); structured JSON logs.
───────────────────────────────────────────────────────────────────────────────────────────────────
```

---

## 2. Category 1: Database Engineering & Migration Integrity

### 1.1 True Versioned Alembic Migrations
* **Target Files**: `backend/alembic/versions/*.py`, `backend/database/models.py`, `backend/alembic.ini`
* **Deficit**: `api/main.py` currently executes `Base.metadata.create_all(bind=engine)` on startup. If a column changes, SQLAlchemy fails to alter the schema, requiring manual database drops.
* **Agent Action Items**:
  1. Delete `Base.metadata.create_all(bind=engine)` from `backend/api/main.py` and `backend/database/connection.py`.
  2. Initialize an official baseline revision in Alembic: `alembic revision --autogenerate -m "initial_production_schema"`.
  3. Ensure all 13 tables, custom enum types (`TrackDirection`, `RequestSeverity`, `BlockStatus`), and foreign key cascade rules are explicitly declared in migration files.
  4. Implement `alembic upgrade head` inside container entrypoints (`entrypoint.sh` or Dockerfile `CMD`).

### 1.2 Redis Caching Layer for Read-Heavy Endpoints
* **Target Files**: `backend/database/redis_client.py`, `backend/api/routes/corridor.py`
* **Deficit**: Static corridor stations, track sections, and historical KPI metrics query PostgreSQL on every render, adding database overhead.
* **Agent Action Items**:
  1. Implement a unified Redis caching decorator `@cache_response(ttl_seconds=300, prefix="corridor")`.
  2. Cache responses for `GET /api/v1/corridor/stations` and `GET /api/v1/corridor/sections`.
  3. Implement cache invalidation hooks: when an emergency disruption or new section is created, trigger `redis.delete_pattern("corridor:*")`.

### 1.3 Database Indexing & Query Optimization
* **Target Files**: `backend/database/models.py`
* **Agent Action Items**:
  1. Add compound B-Tree indexes:
     - `idx_blocks_div_status`: `(division_id, status)` on `maintenance_blocks`.
     - `idx_blocks_time_window`: `(start_time, end_time)` on `maintenance_blocks`.
     - `idx_requests_sec_dept`: `(section_id, department, status)` on `maintenance_requests`.
  2. Add PostGIS spatial GiST indexes on track coordinates:
     - `CREATE INDEX idx_sections_geom ON sections USING GIST (geometry);`.

---

## 3. Category 2: Security, Authentication & Statutory Audit Compliance

### 2.1 Enterprise Secret Management & Asymmetric JWT
* **Target Files**: `backend/core/config.py`, `backend/api/routes/auth.py`
* **Deficit**: Secret keys default to hardcoded `"railway_secret_key"`. Passwords and tokens use symmetric HMAC-SHA256 without token expiration refresh lifecycles.
* **Agent Action Items**:
  1. Remove all plaintext fallback strings from `config.py`. Enforce fatal process exit if `JWT_SECRET_KEY` or `DATABASE_URL` is missing from environment.
  2. Implement asymmetric RS256 token signing (Public/Private key pair) or standard access/refresh token dual lifecycle (Access: 15 mins, Refresh: 7 days stored in Redis with revocation blacklist).

### 2.2 Redis-Backed API Rate Limiting
* **Target Files**: `backend/api/main.py`, `backend/core/rate_limiter.py`
* **Agent Action Items**:
  1. Integrate `slowapi` or build custom Redis token-bucket middleware.
  2. Apply rate limits:
     - Public/Auth endpoints (`/auth/login`): 10 requests / minute.
     - Heavy compute endpoints (`/optimize/run`, `/simulation/what-if`): 15 requests / minute.
     - Query endpoints (`/blocks`, `/corridor/*`): 120 requests / minute.

### 2.3 Statutory G&SR Immutable Audit Trail
* **Target Files**: `backend/database/models.py`, `backend/api/routes/blocks.py`
* **Deficit**: When a Station Master signs a Disconnection Memo or TPC issues a PTW, only the current status string changes in `maintenance_blocks`. There is no non-repudiable legal audit log.
* **Agent Action Items**:
  1. Create model `AuditLogRecord`:
     ```python
     class AuditLogRecord(Base):
         __tablename__ = "statutory_audit_logs"
         id = Column(Integer, primary_key=True)
         entity_type = Column(String(50))  # "MAINTENANCE_BLOCK", "DISCONNECTION_MEMO"
         entity_id = Column(String(100), index=True)
         action = Column(String(50))        # "SANCTION_GRANTED", "PTW_ISSUED"
         actor_user_id = Column(String(50))
         actor_role = Column(String(50))
         client_ip = Column(String(45))
         timestamp = Column(DateTime, default=datetime.utcnow, index=True)
         payload_sha256 = Column(String(64)) # Cryptographic hash of transaction
         metadata_json = Column(JSON)
     ```
  2. Automatically insert an audit record on every status mutation in `blocks.py`.

---

## 4. Category 3: Algorithmic & Solver Hardening

### 4.1 Asynchronous Background Optimization via Celery & WebSockets
* **Target Files**: `backend/tasks/optimizer_worker.py`, `backend/api/routes/optimization.py`
* **Deficit**: Running a 7-day, 150-request optimization holds the synchronous FastAPI HTTP request open for 15 seconds. If multiple controllers trigger optimization simultaneously, Uvicorn worker threads exhaust.
* **Agent Action Items**:
  1. Add Celery / Redis task worker: `run_optimization_task.delay(division_id, payload)`.
  2. Endpoint `POST /api/v1/optimize/run` immediately returns `202 Accepted` with `task_id`.
  3. Worker executes solver in background and broadcasts real-time progress (`SOLVER_PROGRESS: 45%`) over WebSocket `/ws/corridor`.
  4. On completion, worker commits blocks to database and emits `OPTIMIZATION_COMPLETED`.

### 4.2 Sub-Kilometer Signal Block-Headway Model
* **Target Files**: `backend/optimization/cpsat_optimizer.py`
* **Deficit**: Sections are currently modeled as single gross blocks (e.g. `GZB` to `ALJN`, 80 km). In reality, Indian Railways quadruple-track lines use 1 km Automatic Block Signalling (ABS) with 4-aspect signals.
* **Agent Action Items**:
  1. Discretize track sections into signal block intervals ($1.0\text{ km}$ automatic signal sections).
  2. When a maintenance block is scheduled on KM 44.0 to 46.0, only close the specific signal overlapping block sections (KM 43 to 47), leaving the remaining 76 km of the section fully operational for headway running.

### 4.3 Solver Warm-Start Redis Cache
* **Target Files**: `backend/optimization/simulation.py`, `backend/optimization/cpsat_optimizer.py`
* **Agent Action Items**:
  1. Serialize the baseline optimal solution (variable assignments) and cache in Redis.
  2. When `/simulation/what-if` is triggered for an emergency fracture, inject `model.AddHint(var, val)` from the cached baseline, reducing solver re-computation to $<30\text{ ms}$.

---

## 5. Category 4: Real-World Indian Railways Telemetry & Ingestion Adapters

### 5.1 CRIS Control Office Application (COA) Bi-Directional Adapter
* **Target Files**: `backend/integrations/cris_coa_adapter.py`
* **Agent Action Items**:
  1. Implement client adapter conforming to CRIS COA XML/REST schema specifications.
  2. Endpoint for ingesting scheduled train paths, rake compositions, and locomotive power ratings.
  3. Webhook for exporting approved block sanctions directly to COA Line Block Registers.

### 5.2 Real-Time Train Information System (RTIS) NavIC GPS Ingest Stream
* **Target Files**: `backend/integrations/rtis_stream.py`
* **Agent Action Items**:
  1. Implement an async stream consumer (Kafka/MQTT) for locomotive GPS coordinates from ISRO NavIC satellite transponders.
  2. When a train's live GPS indicates a +15 minute delay approaching a division boundary, trigger automated block margin recalculation.

### 5.3 IRPWM Track Recording Car (OMS / TG-4) Ingestion Pipeline
* **Target Files**: `backend/integrations/track_recording_car_parser.py`
* **Agent Action Items**:
  1. Implement CSV parser for standard Indian Railways Oscillation Monitoring System (OMS-2000) and Track Geometry Car (TG-4) output files.
  2. Extract real-world Track Geometry Index (TGI), Twist, Gauge, Alignment, and Unevenness standard deviations.
  3. Pipe parsed metrics directly into the XGBoost feature ingestion pipeline to eliminate dependence on synthetic data.

---

## 6. Category 5: Frontend Enterprise Polish & Performance

### 6.1 Route-Level Code Splitting & Bundle Optimization
* **Target Files**: `frontend/src/App.tsx`, `frontend/vite.config.ts`
* **Deficit**: Current Vite production bundle is 683 kB in a single chunk, triggering Vite size warnings.
* **Agent Action Items**:
  1. In `App.tsx`, convert static portal imports to dynamic lazy imports:
     ```tsx
     const DivisionalControlCockpit = React.lazy(() => import('./pages/DivisionalControlCockpit'));
     const FieldStationPortal = React.lazy(() => import('./pages/FieldStationPortal'));
     const ZonalDashboard = React.lazy(() => import('./pages/ZonalDashboard'));
     const RailwayBoardCockpit = React.lazy(() => import('./pages/RailwayBoardCockpit'));
     ```
  2. Wrap routes in `<Suspense fallback={<LinearProgress />}>`.
  3. Configure Rollup manual chunks in `vite.config.ts` separating `@mui`, `leaflet`, and `recharts` into vendor chunks.
  4. Target: Initial entry chunk $<180\text{ kB}$.

### 6.2 Interactive Yard Interlocking SVG Schematic
* **Target Files**: `frontend/src/components/YardInterlockingSchematic.tsx`
* **Agent Action Items**:
  1. Build an SVG track schematic for key junction stations (e.g. Ghaziabad `GZB` and Aligarh `ALJN`).
  2. Render main lines, loop lines 1 to 4, crossovers, point machines, and signal aspect heads (Red/Yellow/Double Yellow/Green).
  3. Clicking a signal lever or point switch reflects the Station Master's electronic interlocking collar in real time.

---

## 7. Category 6: Comprehensive Testing, CI/CD & Observability

### 7.1 Playwright End-to-End User Journey Tests
* **Target Files**: `frontend/e2e/station_master_flow.spec.ts`, `frontend/e2e/optimizer_replan.spec.ts`
* **Agent Action Items**:
  1. Install `@playwright/test` in `frontend/`.
  2. Implement E2E tests executing:
     - Login as `controller_dli` with demo credentials.
     - Triggering CP-SAT optimization and asserting Gantt render.
     - Submitting a Field Requisition from `/field` and verifying WebSocket toast in `/division`.
     - Executing full 4-stage safety handshake and verifying Caution Order TSR display.

### 7.2 Prometheus Metrics & Health Monitoring
* **Target Files**: `backend/api/main.py`, `backend/core/metrics.py`
* **Agent Action Items**:
  1. Integrate `prometheus-fastapi-instrumentator`.
  2. Expose `/metrics` exporting:
     - `railway_optimizer_solve_time_seconds` (Histogram)
     - `railway_blocks_sanctioned_total` (Counter)
     - `railway_websocket_connected_clients` (Gauge)
     - `railway_track_downtime_saved_hours_total` (Counter)
  3. Include pre-configured Grafana dashboard JSON in `infrastructure/monitoring/grafana_dashboard.json`.

---

## 8. Actionable Implementation Matrix for Incoming Agents

| Task ID | Component | Priority | Target Deliverable | Verification Command |
| :--- | :--- | :---: | :--- | :--- |
| **V3-01** | Database | **P0** | Alembic versioned migrations replacing `create_all` | `docker compose exec backend alembic upgrade head` |
| **V3-02** | Security | **P0** | Vault/Env secret enforcement & Redis rate limiting | `pytest tests/test_security_limits.py` |
| **V3-03** | Compliance | **P1** | Statutory `AuditLogRecord` table for G&SR sign-offs | `pytest tests/test_audit_trail.py` |
| **V3-04** | Solver | **P1** | Celery/Redis async optimization task queue | `pytest tests/test_async_optimizer.py` |
| **V3-05** | Solver | **P2** | 1 km Automatic Block Signal discretization | `pytest tests/test_signal_headway.py` |
| **V3-06** | Frontend | **P1** | Route code-splitting with bundle $<200\text{ kB}$ | `npm run build` (assert chunk sizes) |
| **V3-07** | Telemetry | **P2** | IRPWM OMS/TG-4 Track Recording Car CSV parser | `pytest tests/test_track_car_parser.py` |
| **V3-08** | E2E Testing| **P1** | Playwright test suite for complete safety flow | `npx playwright test` |
| **V3-09** | Observability| **P2** | Prometheus `/metrics` instrumentation & Grafana | `curl http://localhost:8000/metrics` |

---

## 9. Summary for Future Agents

When tackling this project, adhere strictly to these engineering principles:
1. **Never claim a feature in documentation until its code and test are merged and passing.**
2. **Never allow unconstrained or mock bundling:** tasks must physically overlap in kilometer bounds to be scheduled in a shared possession.
3. **Always enforce G&SR statutory state ordering:** `PLANNED` cannot skip directly to `DISCONNECTED` without `SANCTIONED`.
4. **Keep security realistic:** use genuine JWT token authorization headers and immutable audit logs for safety-critical actions.
