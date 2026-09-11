# Edits by Manish

## Handoff Summary

This document records the work completed during the Railway project sessions available in the Copilot history through 11 September 2026. The main delivered feature is **Rail Sarthi**, a read-only conversational operations assistant for the Indian Railways Block Planning Platform.

The current working tree also contains compatibility and dependency updates around the ML risk explainer, model training script, and frontend test tooling. This file is intended as a handoff for the next developer before the code is pushed or continued.

## Product Direction Discussed

The project was reviewed as a strong SIH-level concept with good potential, but not yet fully proven as winning-ready. The core story is coordinated railway maintenance planning: combining TMS, SMMS, and TDMS requests with safety workflows, optimization, risk scoring, simulation, role-based portals, and operational dashboards.

The main improvement direction identified was to strengthen evidence and railway-operational correctness rather than only adding screens. Suggested future work included stronger train and track constraints, realistic digital-twin data, baseline comparisons against manual and greedy scheduling, explainable optimizer decisions, measurable performance claims, and a polished live demo with reproducible data.

## Completed Edits

### 1. Read-only Rail Sarthi backend

Added `backend/agents/read_only_copilot.py` with:

- Bot name: **Rail Sarthi**.
- Default model: `gemini-2.5-flash`.
- Live, bounded reads for maintenance blocks, maintenance requests, and active trains.
- Role and jurisdiction filtering for divisional and field users.
- Board and zonal users can inspect the wider corridor.
- UTC snapshot timestamp, source names, verification checks, confidence, and disclaimer in every response.
- Deterministic local fallback when `GEMINI_API_KEY` is absent or Gemini fails.
- Direct identity response for questions such as “Who are you?”
- Refusal of write-oriented requests such as sanction, approval, scheduling, optimization, issuing a PTW, retraining, routing machinery, updating, or cancelling.
- No write tools and no conversation persistence.

The model receives only the server-built snapshot. The prompt explicitly tells it not to claim that it changed railway state.

### 2. Rail Sarthi API

Added `backend/api/routes/copilot.py` and registered it through:

- `backend/api/routes/__init__.py`
- `backend/api/main.py`

Endpoints:

- `POST /api/v1/copilot/chat` accepts an authenticated question between 2 and 2,000 characters.
- `GET /api/v1/copilot/capabilities` exposes the read-only contract and available tools.

Both endpoints require the existing authenticated-user dependency. The response always exposes `read_only: true` and an empty `write_actions_available` list.

### 3. Rail Sarthi frontend experience

Added `frontend/src/components/ReadOnlyCopilot.tsx` and connected it through:

- `frontend/src/components/Navbar.tsx`
- `frontend/src/services/api.ts`

The UI provides:

- A Rail Sarthi drawer available from the portal navigation.
- Suggested operational questions.
- Live snapshot freshness information.
- Loading and error states.
- Visible `LIVE SNAPSHOT` and `NO WRITE ACCESS` indicators.
- Verification checks, confidence, sources, model, and disclaimer.
- Refresh action for a new live answer.
- WebSocket notices when block or request events mean the displayed snapshot may be stale.

### 4. Read-only safety tests

Added `backend/tests/test_read_only_copilot.py` covering:

- The tool contract contains no obvious write tools.
- Fallback responses state that operational state was not changed.
- Write-intent questions are refused.

### 5. ML and dependency compatibility

Updated `backend/ml/risk_explainer.py` and `backend/ml/train_risk_model.py` so SHAP is optional. If SHAP is unavailable, the risk explainer remains usable with deterministic fallback attributions instead of failing at import or runtime.

Updated `backend/requirements.txt` for the tested Python 3.13 environment, including newer compatible versions of SQLAlchemy, psycopg2, OR-Tools, XGBoost, scikit-learn, pandas, NumPy, SHAP, and Celery. The frontend lockfile also includes the Playwright test dependency in `frontend/package-lock.json`.

### 6. Documentation

Updated `README.md` with the Rail Sarthi contract, endpoints, model configuration, fallback behavior, and explicit limitations.

## Configuration

Set these environment variables for model-backed answers:

```env
GEMINI_API_KEY=your_key
RAIL_SARTHI_MODEL=gemini-2.5-flash
```

Without `GEMINI_API_KEY`, the deterministic local summary still works. Operational database questions require PostgreSQL and the normal authenticated application setup.

## Validation Completed

The following checks were reported as passing during the work:

- Rail Sarthi unit tests: **3 passed**.
- Optimizer pipeline test: **1 passed**.
- Frontend TypeScript/Vite build: passed.
- Python dependency check: no broken requirements in the active environment.
- Python compilation and `git diff --check`: passed.
- Live authenticated test for “Who are you?”: login `200`, copilot response `200`, authorization check passed, write guard passed, `read_only: true`, and `write_actions_available: []`.

The temporary API server was stopped after the live test.

## What Was Blocked or Not Completed

### Resolved during the session

- The first live API attempt failed because `python-jose` was missing. The dependency was present in `backend/requirements.txt`, the environment was corrected, and the later authenticated live check succeeded.
- An initial `pytest` command was unavailable in one terminal context. The installed environment was subsequently verified and the focused tests passed.

### Still unresolved or limited

- A completely fresh Python 3.13 installation may still attempt source builds for older transitive or pinned packages, especially SHAP/Pydantic-related dependencies. Python 3.11 or a further dependency-pin review should be used for reproducible deployment.
- The live test proved authentication and the identity response. It did not prove every operational question against a fully populated PostgreSQL dataset.
- PostgreSQL must be running for real blocks, trains, and maintenance answers. Redis and the rest of the normal Docker services may also be required by other platform workflows.
- Gemini was not the only source of truth: it drafts an explanation from the server snapshot. The server-side reads and authorization scope remain the safety boundary.
- The write-intent guard currently uses keyword matching. It should be expanded and tested against synonyms, multilingual phrasing, prompt injection, and ambiguous questions.
- Rail Sarthi intentionally does not retain conversation history. Multi-turn memory, user-visible audit history, and conversation export were not implemented.
- No autonomous action, approval, sanctioning, optimization execution, PTW or memo issuance, model retraining, machinery routing, or database mutation was implemented for the bot.
- Production load, rate limits specific to the copilot, streaming responses, observability, and a formal threat-model review remain future work.

## Rail Sarthi Plan for the Next Developer

The intended architecture is a read-only conversational layer over existing operational APIs and database queries. Keep the bot behind authentication and jurisdiction filtering, and keep all mutation capabilities outside its tool registry.

### Phase 1: Harden the current vertical slice

1. Replace direct Gemini HTTP calls with the project’s preferred async client or a small provider adapter.
2. Add structured intent classification: informational, unsupported write request, unauthorized request, or ambiguous request.
3. Make every operational answer cite the exact snapshot timestamp, authorized scope, source records, and missing-data conditions.
4. Add tests for cross-division access, prompt injection, write synonyms, empty datasets, database failures, Gemini failures, malformed model output, and sensitive-data leakage.
5. Add copilot-specific rate limiting, request IDs, metrics, structured logs, and audit events without storing unnecessary chat content.

### Phase 2: Expand read-only knowledge

Add narrowly scoped read tools for:

- Block lifecycle and possession status.
- Maintenance request history and risk factors.
- Active train movement and conflict context.
- Corridor bottlenecks and inter-divisional handovers.
- Safety checks, recorded events, and optimizer explanations.
- ML risk explanations, clearly labelled as predictions rather than certainties.

Each tool should return typed data with authorization already applied. The language model should never query arbitrary SQL or receive unrestricted database access.

### Phase 3: Improve the conversation UX

1. Add conversation turns in the UI only after deciding the retention and audit policy.
2. Support follow-up questions by passing a small, bounded context rather than the entire transcript.
3. Add citations or expandable source records for each factual answer.
4. Provide graceful degraded-mode messaging when PostgreSQL, Redis, or Gemini is unavailable.
5. Add Playwright coverage for opening Rail Sarthi, asking a question, refusing a write request, showing an error, and refreshing a snapshot.

### Phase 4: Safety and production review

Before production use, complete a threat model and human approval review. Verify tenant isolation, logs, secrets handling, model-provider data policy, denial-of-service limits, response latency, and failure behavior. The assistant must remain advisory and must never be able to call mutation endpoints, Celery jobs, optimizers, or external railway control systems.

## Suggested Git Handoff Checklist

- Review the working-tree diff, including the ML and dependency changes that predate or surround the copilot work.
- Run the backend focused tests and frontend build in a clean environment.
- Start PostgreSQL and required services with the project’s Docker Compose setup.
- Configure `GEMINI_API_KEY` only in an ignored local environment file or deployment secret store.
- Test both Gemini and no-key fallback paths.
- Test a normal read question and a write request such as “sanction block BLK-1”.
- Confirm that no copilot response can call or mutate a write endpoint.
- Commit the handoff file together with the intended source changes, after reviewing secrets and generated files.

## Files Added or Changed in This Work

Added:

- `backend/agents/read_only_copilot.py`
- `backend/api/routes/copilot.py`
- `backend/tests/test_read_only_copilot.py`
- `frontend/src/components/ReadOnlyCopilot.tsx`
- `edits by manish.md`

Changed:

- `backend/api/main.py`
- `backend/api/routes/__init__.py`
- `backend/ml/risk_explainer.py`
- `backend/ml/train_risk_model.py`
- `backend/requirements.txt`
- `frontend/src/components/Navbar.tsx`
- `frontend/src/services/api.ts`
- `frontend/package-lock.json`
- `README.md`

## Deep Product and Hackathon Research Review

### Executive Verdict

The project is a strong and unusually ambitious **hackathon prototype**, but it is not yet safe to describe as a production railway control system or as a validated predictive-AI product. Its best competition angle is:

> A decision-support platform that combines maintenance requests from multiple departments, produces constraint-aware block plans, explains risk, simulates disruption, and preserves human safety authority.

The project is not currently “winning” because it has the largest feature list. It can become a winning submission by proving one complete operational story better than competing projects:

1. A realistic maintenance backlog is loaded.
2. The system shows the separate departmental plan and its cost.
3. CP-SAT produces a safer, shorter combined plan.
4. The operator sees why each request was scheduled or deferred.
5. A simulated fracture or delayed premium train triggers a safe re-plan.
6. Two authorized humans complete the safety approval workflow.
7. Rail Sarthi explains the result using only verified, role-scoped data.
8. A reproducible benchmark proves the improvement against a baseline.

The current model is **good enough as a transparent synthetic-data demonstrator**. It is **not good enough to claim real predictive accuracy or production readiness** because it learns from labels generated by a formula and is evaluated on the same data used for training.

### Current Readiness Scorecard

These are engineering judgments based on the repository, not measured industry certifications:

| Area | Current assessment | What would make it strong |
|---|---:|---|
| Problem relevance | 9/10 | Keep the multi-department possession problem central |
| Product ambition | 9/10 | Reduce claims and prove one complete workflow |
| Architecture breadth | 8/10 | Make authorization and integration boundaries real |
| Optimization prototype | 7/10 | Add operational constraints and baseline evidence |
| Safety workflow | 5/10 | Enforce dual concurrence and signed state transitions |
| ML credibility | 3/10 | Use labelled historical data and held-out evaluation |
| Conversational assistant | 6/10 | Add tool-level security, citations, and adversarial tests |
| Live integration authenticity | 3/10 | Connect or clearly label every adapter as simulated |
| Security and tenancy | 4/10 | Enforce access on every route and remove demo defaults |
| UI and demo quality | 7/10 | Remove hardcoded KPIs and show data provenance |
| Test and benchmark evidence | 4/10 | Add CI, coverage, load reports, and E2E behavior checks |
| Hackathon potential after hardening | 8.5/10 | Deliver the proof-driven demo and honest limitations |

## All Current Features

### Platform and infrastructure

- FastAPI backend with modular route groups.
- React, TypeScript, Vite, Material UI, Leaflet, Recharts, and WebSockets.
- PostgreSQL and SQLAlchemy persistence.
- Alembic migration setup.
- Redis integration for rate limiting, progress, and asynchronous workflows.
- Docker Compose development and production files.
- Prometheus metrics integration.
- Environment-driven configuration.
- Seed scripts and a scripted demonstration driver.

### Railway domain model

- Railway Board, zone, division, and field/station roles.
- Users, jurisdictions, stations, sections, trains, machinery, maintenance requests, maintenance blocks, optimization runs, train impacts, simulation scenarios, explainability records, and audit records.
- TMS, SMMS, and TDMS style maintenance sources.
- Directional sections and track possession concepts.
- Maintenance severity and priority scoring.
- Block lifecycle states including planned, sanctioned, disconnected, PTW granted, and fit restored.
- Safety memo and possession concepts.
- Audit hashes, actor metadata, timestamps, IP data, and audit bundle prototypes.

### Optimization and scheduling

- OR-Tools CP-SAT optimizer.
- Optional maintenance intervals and emergency requests forced into the schedule.
- Same-section non-overlap constraints.
- Co-located cross-department bundling incentive.
- Machine cumulative capacity constraints.
- High-priority train conflict exclusion.
- Lower-priority train conflict penalties.
- Combined super-block post-processing.
- Track-circuit metadata generation.
- Signal-envelope metadata generation.
- Crossover and turnout diversion recommendations.
- Greedy scheduler for comparison.
- Synchronous and asynchronous optimization routes.
- Optimization progress events and stored run results.

### Simulation and integrations

- Emergency rail-fracture scenario.
- Premium-train delay scenario.
- Train delay and dispatch simulation.
- Track-recording-car and OMS/TG-4 shaped data parsing.
- TGI aggregation and risk updates.
- CRIS COA-shaped adapter interfaces.
- RTIS/NavIC-shaped telemetry processing.
- Kavach packet-format emulation.
- Machine routing and corridor synchronization prototypes.

### Machine learning and explainability

- XGBoost risk regressor.
- SHAP explainability when the optional dependency is available.
- Deterministic attribution fallback when SHAP is unavailable.
- Synthetic feature generation using GMT, TGI, overdue days, severity, asset age, speed, and traffic density.
- Priority scoring and risk explanation endpoints.
- Continuous learner with drift detection and champion/challenger concepts.
- Risk display in the operational cockpit.

### Frontend portals

- Login and JWT session handling.
- Field and station portal.
- Divisional control cockpit.
- Zonal dashboard.
- Railway Board cockpit.
- Role-based client routing.
- Map view and corridor schematic.
- Gantt-like operational timeline.
- Optimization trigger and results.
- What-if simulation dialogs.
- Safety memo dialogs.
- Risk and SHAP explanation dialog.
- Fleet and machinery views.
- WebSocket notifications.
- Offline field ticket queue prototype.
- Rail Sarthi drawer with suggested questions, status, freshness, checks, sources, and read-only indicators.

### Rail Sarthi conversational assistant

- Authenticated chat endpoint.
- Capabilities endpoint.
- Gemini 2.5 Flash default provider.
- Deterministic local fallback.
- Role-scoped snapshot reads.
- Live blocks, requests, and active train records.
- Identity response.
- Refusal of obvious write requests.
- No arbitrary SQL access.
- No mutation tools.
- No conversation persistence.
- Model, confidence, timestamp, source, and disclaimer fields.

## Current Pros

- The problem is operationally meaningful: maintenance access competes with train movement and multiple departments plan separately.
- The platform combines optimization, simulation, safety workflow, ML, telemetry, dashboards, and conversation instead of presenting a single isolated model.
- CP-SAT is an appropriate technology for discrete scheduling with hard constraints and soft objectives.
- Emergency requests are explicitly treated as mandatory by the current solver.
- The code has useful separation between API, database, optimization, ML, simulation, integration, and frontend layers.
- The four-tier portal concept gives the project a recognizable railway operating model.
- Rail Sarthi has a good safety posture compared with an action-taking agent: it reads bounded data and exposes no write tools.
- The fallback mode makes the conversational demo resilient when an external model key is unavailable.
- The project includes domain-shaped data, seed scripts, role portals, and demo flows that can support a strong pitch.
- The code already has safety lifecycle, audit, rate-limiting, PKI, telemetry, and WebSocket concepts that can be hardened rather than invented from scratch.
- The project has a clear visual “before and after” story: separate possessions versus combined possession, plus avoided train conflicts.

## Current Cons and Flaws Blocking “Best in Class”

### A. ML model flaws

1. The target label is produced by a hand-written formula inside `backend/ml/train_risk_model.py`. The model mostly learns to approximate that formula; it does not learn verified failure outcomes.
2. The reported R2 uses `model.score(X, y)` on the training set. This is not evidence of generalization and should not be presented as field accuracy.
3. There is no confirmed labelled history of rail fracture, derailment precursor, geometry failure, inspection result, or corrective outcome.
4. There is no held-out test set, temporal split, cross-validation report, calibration plot, confidence interval, or external validation.
5. There is no documented false-negative analysis. In railway risk work, missed high-risk defects matter more than a visually impressive average score.
6. The model is a regressor for a 0-100 score, but the product language sometimes implies failure probability. A score is not a probability unless calibrated and defined.
7. The heuristic scorer and XGBoost model use inconsistent feature names and paths, including `tgi` versus `tgi_score`.
8. Explanation endpoints use fixed defaults for several request features instead of explaining actual measured records.
9. SHAP values are contributions, not automatically percentages. The UI must not label raw contributions as percentage influence.
10. Synthetic data is described in places as authentic or historical-looking. It must be visibly labelled synthetic/demo data.

**Fix:** keep the current model for the demo, rename it “synthetic risk demonstrator,” add proper held-out metrics, and build a data contract for a future labelled dataset. For the hackathon, show sensitivity and error analysis honestly instead of claiming production accuracy.

### B. Optimization flaws

1. Due dates and maintenance work windows are not fully enforced in the objective or constraints.
2. Machine location, travel time, setup time, route feasibility, maintenance condition, and shift availability are not fully modeled.
3. Crew availability, department working hours, possession preparation, clearance, and restoration buffers are missing or simplified.
4. OHE subsector compatibility is not solver-enforced.
5. Junctions, platforms, yards, crossovers, shared lines, and route locking are simplified as section IDs.
6. The train model mainly uses overlap penalties and does not fully propagate delay through a network timetable.
7. Crossover routing is calculated after scheduling rather than being part of the feasibility model.
8. Emergency replanning does not clearly freeze already active or legally committed blocks.
9. The documented warm-start `AddHint()` capability is not actually implemented.
10. The solver returns `OPTIMAL` or `FEASIBLE`, but the product needs to show objective value, optimality gap, timeout, unscheduled requests, and infeasibility reasons.
11. “Combined” work is treated as overlapping intervals, but actual simultaneous departmental safety compatibility is not validated.
12. Hardcoded machine capacities can diverge from the live fleet state.

**Fix:** add a constraint registry with named constraints, test each constraint independently, return solver diagnostics, and show a human-readable reason for every scheduled, deferred, or rejected request.

### C. Safety and security flaws

1. Block sanctioning is currently closer to a single-role state change than true dual concurrence.
2. DOM and technical approval identities are not reliably distinct and independently verified.
3. PTW information is accepted as request data rather than verified against an independent electrical isolation authority.
4. Tenant access policy exists but is not consistently applied to every route.
5. Some route payloads accept a caller-supplied `division_id`, which can create cross-division access risk if not checked against the JWT.
6. Several operational, telemetry, ML, block, and export endpoints are insufficiently protected or need an explicit public/private classification.
7. Demo user discovery and shared demo credentials must never survive into production configuration.
8. There are inconsistent JWT secret and token-lifetime sources.
9. Rate limiting degrades permissively when Redis is unavailable.
10. The in-memory PKI prototype is not durable, revocable, externally trusted, or tied to real railway identities.
11. Rail Sarthi keyword refusal is vulnerable to synonyms, obfuscation, multilingual requests, ambiguous intent, and prompt injection.
12. The assistant must never be allowed to call mutation endpoints indirectly through a generic tool or model-generated URL.

**Fix:** make authorization deny-by-default, derive jurisdiction from authenticated claims, add negative cross-tenant tests, implement two-person signing with independent roles, and threat-model the complete API surface.

### D. Integration and data flaws

1. CRIS/COA is an integration-shaped stub, not a live railway-system connection.
2. RTIS/NavIC processing is local application telemetry, not proof of a live external feed.
3. Kavach output is packet emulation, not an approved Kavach safety interface.
4. PostGIS geometry is described in architecture documents but is not fully represented in the active model layer.
5. Some dashboard KPIs and benchmarks are hardcoded or fallback values.
6. There is no data lineage showing whether a value is live, seeded, simulated, cached, or illustrative.
7. The system needs idempotency and replay handling for repeated telemetry and external events.
8. There is no documented schema/version contract for external TMS, SMMS, TDMS, CRIS, RTIS, or Kavach exchanges.

**Fix:** label every adapter `LIVE`, `SIMULATED`, `SEEDED`, or `OFFLINE`; display that status in the UI; add replayable fixtures and contract tests; never present a stub KPI as live railway data.

### E. Frontend and UX flaws

1. The product has broad dashboards but the core operator journey is not yet consistently the visual center.
2. Hardcoded fallback metrics can make a demo look more complete than the data actually is.
3. E2E tests mainly prove navigation and element presence, not correct scheduling, safety, authorization, or failure behavior.
4. Rail Sarthi has a drawer and response panel but not yet a complete multi-turn conversation model.
5. The UI needs stronger source citations: request IDs, block IDs, snapshot timestamp, and data status should be expandable beside claims.
6. Error states need to distinguish unavailable model, unavailable database, authorization denial, stale cache, and no matching data.
7. Accessibility, keyboard navigation, mobile field workflows, localization, and low-connectivity behavior need explicit testing.
8. The dashboard should visually separate recommendation, human decision, legally committed state, and actual execution state.

**Fix:** build the demo around one traceable request-to-block-to-safety-to-explanation journey, and make provenance visible everywhere.

### F. Engineering and evidence flaws

1. No visible CI workflow proves the claimed automated pipeline.
2. No committed coverage configuration or report proves the claimed 85% coverage.
3. No reproducible load report proves the 150-request or sub-30-second claims.
4. Fresh Python 3.13 installation may still encounter source-build problems for dependency combinations.
5. `Base.metadata.create_all()` with broad exception suppression can hide schema failures.
6. Documentation sometimes describes planned features as complete.
7. “Legal-grade,” “statutory,” “production-grade,” “real-time,” and “optimal” are too strong unless supported by approvals, tests, or live integrations.
8. There is no formal threat model, data-classification policy, incident response plan, or model card.

**Fix:** add CI, coverage, benchmark artifacts, model card, threat model, integration status matrix, and a documentation pass that marks every feature as implemented, simulated, planned, or unavailable.

## Features to Add for the Best Version

### Highest-value features for the hackathon

1. **Before/after benchmark laboratory**: compare manual, greedy, and CP-SAT schedules using the same seeded dataset. Report separate possessions, combined possessions, total possession hours, high-priority train delay, lower-priority train delay, emergency coverage, unscheduled work, solver time, and optimality gap.
2. **Constraint explanation panel**: for every request show why it was placed, deferred, bundled, or rejected, including the blocking train, machine, work window, safety rule, or jurisdiction.
3. **Two-person safety concurrence**: independent traffic and technical approval, visible signatures, timestamps, expiry, rejection reason, revocation, escalation, and immutable audit record.
4. **Emergency command center**: inject rail fracture, OHE issue, signal failure, heavy rain, or delayed premium train and show frozen active blocks, affected trains, recommended actions, and a new feasible schedule.
5. **Data provenance badges**: every KPI and response states live, seeded, simulated, cached, or stubbed status.
6. **Rail Sarthi evidence answers**: answers link to exact block/request/train records and distinguish facts, calculations, assumptions, and recommendations.
7. **Tenant isolation proof**: one negative test and one live demo showing that a divisional user cannot read or modify another division.
8. **Reproducible benchmark command**: one command generates the data, runs all schedulers, writes JSON/CSV results, and produces charts.
9. **Offline field workflow**: encrypted local queue, retry, duplicate protection, conflict resolution, and visible synchronization status.
10. **Judge mode**: a seeded, deterministic demo profile with reset button, narrated steps, live event stream, and backup video.

### Optimization features

- Explicit interval domains for earliest start, latest finish, due date, and possession windows.
- Train headway and route occupancy constraints.
- Junction, crossover, platform, yard, and shared-track conflict graph.
- OHE isolation zones and compatible work-type matrix.
- Machine depot location, route distance, setup, travel, refuelling, and shift constraints.
- Crew rosters, skills, certifications, fatigue limits, and department calendars.
- Weather and visibility restrictions.
- Possession setup, protection, clearance, and restoration buffers.
- Frozen active/committed blocks during replanning.
- Warm starts and hints for scenario re-solving.
- Multi-objective configuration rather than unexplained hardcoded weights.
- Pareto comparison of safety risk, punctuality, availability, cost, and work completion.
- Solver infeasibility explanation and minimal-conflict set.
- Human lock, drag, approve, reject, and re-optimize controls with audit history.
- Multi-day and rolling-horizon planning.
- Cross-division handoff synchronization.
- Recovery plan if the solver times out or returns only a feasible solution.

### Railway operations features

- Live possession board with state, responsible officer, location, and expiry.
- Station Master line-clear and route-lock visibility.
- Digital disconnection memo with versioning and acknowledgement.
- Traction PTW tied to an isolation reference and independent controller.
- Track-fit certificate with inspection checklist and evidence attachment.
- Caution order/TSR lifecycle with expiry and withdrawal confirmation.
- Signal, points, track circuit, axle-counter, and interlocking status view.
- Train path conflict and delay propagation graph.
- Crew and machine readiness board.
- Shift handover log.
- Escalation timers for overdue approvals and expiring possessions.
- Weather, flood, heat, visibility, and disaster response overlays.
- Maintenance completion evidence including photo, measurement, and geospatial capture.
- Work quality verification and rework tracking.
- Asset history and lifecycle cost view.
- Maintenance backlog aging and risk burn-down.
- What-if comparison with side-by-side schedule diff.
- Digital twin replay of a historical operating day.

### ML and data features

- Real labelled failure/outcome dataset pipeline.
- Temporal train/validation/test split by date and corridor.
- Calibrated probability model if probabilities are required.
- Precision, recall, PR-AUC, ROC-AUC where applicable, MAE, RMSE, calibration error, and false-negative rate.
- Segment metrics by asset type, corridor, division, season, and severity.
- Drift detection with alert thresholds and rollback.
- Champion/challenger approval with human review.
- Feature lineage and data-quality checks.
- Missing-value, outlier, leakage, and label-delay handling.
- Model card documenting purpose, data, limitations, performance, and prohibited use.
- Uncertainty bands and “insufficient evidence” state.
- Counterfactual explanation: “risk would decrease if overdue days fell by X,” clearly marked as a scenario.
- Human feedback capture for incorrect risk explanations.
- Active-learning queue for the most informative inspections.
- Separate risk score from operational priority score, with documented policy.

### Rail Sarthi features

- Typed read-only tool registry with one authorization wrapper around every tool.
- Intent classifier with informational, action request, unauthorized, ambiguous, and emergency categories.
- Prompt-injection defense and untrusted-data delimiters.
- Retrieval from approved operational records rather than arbitrary database access.
- Exact citations and record IDs in every factual answer.
- Freshness and stale-data policy.
- “I do not know” and missing-data behavior.
- Hindi and English support with terminology control and safe translation.
- Voice input/output only after privacy and operational-noise review.
- Bounded conversation memory with retention controls, redaction, and audit policy.
- Streaming answer with cancellation and timeout handling.
- Human escalation button that creates no action automatically but packages context for an authorized operator.
- Read-only incident briefing generation.
- Shift handover summary.
- Natural-language schedule comparison.
- Query suggestions based on the user’s role, never on hidden data.
- Per-user rate limits, token budgets, latency metrics, refusal metrics, and hallucination evaluation.
- Adversarial evaluation set for prompt injection, data exfiltration, write requests, multilingual phrases, and social engineering.

### Security, compliance, and reliability features

- Centralized configuration for JWT secrets and lifetimes.
- Secret rotation and startup failure when production secrets are missing.
- Deny-by-default route authorization.
- Server-side jurisdiction derivation and row-level access controls.
- Dual-control approval and separation of duties.
- Tamper-evident audit log with durable signing keys and key rotation.
- API schema validation and strict enum handling.
- Idempotency keys for external events and state transitions.
- Replay protection for telemetry and safety messages.
- Database migration verification and no silent exception suppression.
- Dependency lock and clean-install CI on supported Python versions.
- SAST, dependency scanning, secret scanning, and container scanning.
- Backup, restore, disaster-recovery, and offline operation drills.
- OpenTelemetry traces and correlation IDs.
- SLOs for API latency, solver latency, freshness, availability, and failed jobs.
- Alerting for stale telemetry, failed integrations, queue buildup, repeated auth failures, and model drift.
- Data retention, minimization, encryption, and access review.

### Product and judging features

- One-click “Judge Demo Reset.”
- Guided 10-minute story mode.
- Baseline versus optimized scorecard.
- Animated but accurate schedule transition.
- Exportable evidence report with inputs, solver status, metrics, and audit trail.
- QR link to architecture, benchmark, model card, and limitations.
- Operator usability study with task completion time and error rate.
- Accessibility and mobile field demo.
- Hindi terminology glossary.
- Cost model: minutes of possession saved, delay minutes avoided, machine utilization, and deferred-risk cost.
- Explainable failure mode: show how the system refuses unsafe or incomplete plans.
- Backup local-only demo if internet, Gemini, PostgreSQL, or Redis fails.

## Recommended Delivery Order

### P0: Must fix before claiming a winning prototype

1. Correct the ML claim: synthetic demonstrator, not validated predictive model.
2. Build the benchmark laboratory and save repeatable results.
3. Enforce tenant isolation on every route and add negative tests.
4. Implement genuine two-person safety approval.
5. Remove or label hardcoded and stubbed KPIs.
6. Add solver status, unscheduled-request reasons, and constraint explanations.
7. Add Rail Sarthi prompt-injection, write-intent, citation, and data-scope tests.
8. Add CI, coverage report, and clean-install verification.
9. Update docs so implemented, simulated, planned, and unavailable features are unmistakable.

### P1: Highest return after the P0 fixes

1. Add machine travel, crew, setup, OHE, junction, and train propagation constraints.
2. Add frozen-block emergency replanning and true warm-start support.
3. Add live/seeded/simulated provenance labels.
4. Add side-by-side what-if comparison and human schedule locks.
5. Add Rail Sarthi citations, bounded multi-turn context, Hindi support, and shift summaries.
6. Add operational observability, rate limits, replay protection, and failure dashboards.

### P2: Production direction

1. Replace stubs with approved integration contracts and sandbox adapters.
2. Build a real labelled ML dataset and model governance process.
3. Complete durable PKI, key management, disaster recovery, and security assessment.
4. Conduct operator usability, accessibility, and field-connectivity trials.
5. Establish procurement, deployment, support, and safety-assurance documentation.

## Model Readiness Answer

**Is the current model trained well enough to win a hackathon?**

It is acceptable for a hackathon demonstration if the team says exactly what it is: an XGBoost risk-scoring demonstrator trained on controlled synthetic data, with explainability and deterministic fallback behavior. It is not acceptable to claim that the model predicts real railway failures, has a validated R2, or is ready for deployment.

For the competition, the model should support the story, not carry the whole story. The strongest evidence should be the optimization benchmark, safety workflow, authorization proof, and transparent limitations. A smaller honest model with a held-out synthetic test and clear error analysis will impress more than a high training-set R2 presented as field accuracy.

Minimum model evidence to add:

- Separate train, validation, and test data generated with different random seeds or, preferably, a time-based split.
- MAE, RMSE, R2, calibration, and false-negative rate.
- Feature distribution and target distribution plots.
- Sensitivity tests for severe TGI, high GMT, overdue inspections, and severity.
- Comparison with a simple rule-based baseline.
- Explicit label: `SYNTHETIC_DEMONSTRATION_ONLY`.
- Model version, training date, feature schema, and reproducible training command.

## Research Anchors

The following public engineering references informed this review:

- Google OR-Tools CP-SAT documentation: https://developers.google.com/optimization/cp/cp_solver. It distinguishes `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `MODEL_INVALID`, and `UNKNOWN`, which is why the product should expose solver status rather than simply report success.
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework. Its Govern, Map, Measure, and Manage framing supports adding a model card, risk register, evaluation evidence, human oversight, and operational monitoring.
- NIST Generative AI Profile: https://doi.org/10.6028/NIST.AI.600-1. This is relevant to Rail Sarthi's prompt injection, confabulation, privacy, provenance, human oversight, and monitoring controls.
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/. This supports testing prompt injection, insecure output handling, sensitive information disclosure, excessive agency, and model denial-of-service risks.

These references are engineering guidance, not Indian Railways approval, Kavach certification, or a substitute for railway safety rules. Any production deployment would still require the applicable Indian Railways, signalling, electrical, operating, cybersecurity, and safety-assurance authorities.

## Final Recommendation to the Next Developer

Do not add ten more disconnected screens first. Turn the current system into a measured, honest, end-to-end operational proof. The winning version is the one that can answer, with evidence:

- What changed in the schedule?
- Why is the plan safe and feasible?
- Which train and asset impacts were avoided?
- Which requests were deferred and why?
- Which human authorized the safety state?
- Which data is real, seeded, or simulated?
- What does the model know, and what does it not know?
- Can another developer reproduce the result from a clean checkout?

That proof, plus Rail Sarthi as a carefully bounded read-only explainer, is a stronger competition strategy than claiming that every planned architecture feature is already production complete.

## Easy Features With High Impact

These features can be added quickly because they mostly use existing APIs, database models, frontend components, WebSockets, or seeded data. They improve the demo and credibility without requiring a new research program.

| Feature | Effort | Impact | How to add it |
|---|---|---|---|
| Live/seeded/simulated badge | Very low | Very high | Add a `data_status` field to every dashboard response and show it beside every KPI |
| KPI definitions tooltip | Very low | High | Explain the formula, time window, source, and whether the value is measured or illustrative |
| Benchmark scorecard | Low | Very high | Compare greedy, current plan, and CP-SAT on the same requests |
| Schedule diff view | Low | Very high | Show before/after start time, end time, block count, train impact, and deferred requests |
| “Why was this request deferred?” panel | Low | Very high | Return a structured reason from the optimizer and display the blocking constraint |
| Solver status card | Very low | High | Display `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, timeout, wall time, objective, and gap |
| Reset demo data button | Low | High | Restore a deterministic seeded scenario for judges and developers |
| Demo mode banner | Very low | High | Clearly label synthetic, seeded, simulated, and stubbed content |
| Export evidence report | Low | High | Export inputs, outputs, metrics, solver status, and audit events as JSON/CSV/PDF |
| Request detail drawer | Low | High | Show source department, asset, risk inputs, assigned block, train conflicts, and audit trail |
| Toast and notification center | Low | Medium | Centralize WebSocket events for new requests, approvals, stale data, and solver completion |
| Empty and failure states | Low | High | Distinguish no data, database unavailable, model unavailable, unauthorized, and stale data |
| Loading skeletons | Low | Medium | Add consistent loading states to dashboards and Rail Sarthi |
| Downloadable schedule | Low | Medium | Export an operator-readable timetable and a machine-readable JSON schedule |
| Hindi terminology mode | Low | Medium | Add a controlled glossary for block, possession, PTW, track fit, TSR, and departments |
| Suggested Rail Sarthi questions by role | Low | Medium | Use a static role-safe question catalog for field, division, zone, and board users |
| Rail Sarthi citations | Low | Very high | Attach request IDs, block IDs, train numbers, timestamp, and source tables to every answer |
| Rail Sarthi refusal test matrix | Low | High | Add tests for synonyms, Hindi, indirect wording, prompt injection, and action requests |
| Frontend copilot E2E test | Low | High | Test open, ask, loading, response, refusal, error, and refresh behavior |
| Route authorization tests | Low | Very high | Test unauthenticated, wrong role, wrong division, and allowed access for each sensitive route |
| Model card | Low | Very high | Document synthetic data, features, metrics, limitations, intended use, and prohibited use |
| Clean-install script | Low | High | Verify a fresh Python and Node environment from documented commands |
| Coverage badge | Low | Medium | Add pytest coverage configuration and publish the actual result rather than a target |
| Health check detail | Low | Medium | Report PostgreSQL, Redis, model file, queue, and integration status separately |
| Correlation/request ID | Low | High | Add one ID across API logs, WebSocket events, solver runs, and Rail Sarthi responses |
| Stale-data warning | Low | High | Show a warning when telemetry, train data, or dashboard snapshots exceed a defined age |
| Seeded failure scenarios | Low | High | Add repeatable scenarios for emergency fracture, delayed premium train, machine outage, and database loss |
| Audit timeline UI | Low | High | Display who changed a block, when, from which state, and what evidence was attached |
| Human schedule lock | Low | High | Let an operator lock an approved task before re-optimization and record the reason |
| Basic accessibility pass | Low | Medium | Keyboard navigation, labels, focus order, contrast, and screen-reader names |

### Best easy-feature bundle

If time is limited, implement these ten first:

1. Benchmark scorecard.
2. Schedule diff.
3. Constraint/defer reason.
4. Live versus simulated data badges.
5. Solver status and objective card.
6. Rail Sarthi citations.
7. Cross-division authorization tests.
8. Two-person approval UI proof, even if the deeper workflow follows next.
9. Deterministic demo reset.
10. Model card with honest metrics and limitations.

This bundle creates visible proof, not just more functionality.

## Medium-Complexity Features

These require changes across backend, database, frontend, or testing, but are realistic for a strong hackathon iteration.

- Two-person DOM and technical concurrence with distinct accounts, departments, order, expiry, rejection, and revocation.
- Full block state-machine API tests rather than only direct model tests.
- Server-side tenancy enforcement on every read and write route.
- Central role and permission matrix with deny-by-default behavior.
- Machine availability calendar, location, shift, and maintenance status.
- Crew availability and department working windows.
- Work setup and clearance buffers.
- Due-date and latest-finish scheduling constraints.
- Multi-day rolling-horizon scheduling.
- Explainable solver objective breakdown.
- Infeasibility diagnosis and unscheduled-request queue.
- Frozen active blocks during emergency replanning.
- Warm-start or hint-based re-solving.
- Side-by-side what-if schedule comparison.
- Train delay propagation across connected sections.
- Junction, crossover, and platform conflict graph.
- OHE subsector compatibility matrix.
- Historical schedule replay.
- Data lineage and adapter status registry.
- Idempotent telemetry ingestion and event replay protection.
- Durable audit signing key configuration.
- API rate limits by user, route, and copilot token budget.
- OpenTelemetry traces and structured operational logs.
- CI pipeline for backend tests, frontend build, lint, coverage, and dependency checks.
- Reproducible 25/50/100/150 request load benchmark.
- Playwright workflow tests for all four portals.
- Offline field queue retry and conflict resolution.
- Shift handover summary in Rail Sarthi.
- Bounded multi-turn conversation context with a documented retention policy.
- Hindi and English response terminology controls.
- Human escalation package generated by Rail Sarthi without automatically creating an operational action.

## Advanced Features for a Best-in-Class System

These are substantial engineering or research features. They should follow the proof and security work, not replace it.

### Advanced optimization

- Full network conflict graph for shared track, yards, stations, junctions, platforms, crossovers, points, and route locking.
- Time-dependent train path model with headway, acceleration, dwell, speed restriction, and delay propagation.
- Multi-resource scheduling for machines, crews, protection staff, electrical controllers, and possession authorities.
- Machine routing with depot location, travel distance, setup time, fuel, maintenance, and return-to-base constraints.
- OHE isolation topology and work-type compatibility.
- Weather, flood, heat, visibility, and disaster restrictions.
- Multi-objective Pareto optimization for safety, punctuality, asset availability, cost, and work completion.
- Robust optimization under uncertain work duration and train arrival time.
- Stochastic or scenario-based planning for disruption risk.
- Rolling-horizon replanning with immutable committed decisions.
- True CP-SAT warm starts and incremental model updates.
- Benders or decomposition strategy for very large corridor and multi-division problems.
- Constraint learning from operator overrides.
- Minimal-conflict explanations for infeasible plans.
- Fairness policy so low-priority divisions or departments are not deferred indefinitely.
- Long-term maintenance portfolio planning, not only daily block planning.

### Advanced digital twin and operations

- Event-driven corridor digital twin.
- Replay of a complete historical operating day.
- Real-time train positions with uncertainty bounds.
- Track circuit, axle counter, signal, point, interlocking, and OHE status visualization.
- Integrated weather and flooding risk layer.
- Asset health history and remaining-useful-life view.
- Machine and crew digital passports.
- Automatic shift handover and incident timeline.
- Cross-division golden-corridor coordination.
- Network-wide mega-block planning.
- Resilience mode for communication loss or partial telemetry failure.
- Operator-in-the-loop control room simulator for training.

### Advanced ML and analytics

- Real labelled defect-to-outcome dataset.
- Time-to-failure or survival model for asset degradation.
- Calibrated classification model for failure probability.
- Temporal and corridor-aware validation splits.
- Cost-sensitive learning prioritizing dangerous false negatives.
- Ensemble of rule-based safety gates and statistical/ML models.
- Anomaly detection on geometry, vibration, temperature, and telemetry streams.
- Graph neural network or graph-based risk propagation across connected assets.
- Forecasting of maintenance backlog and future possession demand.
- Causal or counterfactual analysis for maintenance intervention value.
- Bayesian uncertainty and abstention when evidence is weak.
- Drift detection across seasons, corridors, sensors, and asset classes.
- Human-labelled feedback loop from inspectors and controllers.
- Active learning to select the next most valuable inspection.
- Model registry, signed model artifacts, rollback, approval workflow, and model monitoring.
- Fairness and calibration analysis across divisions, departments, and asset types.

### Advanced Rail Sarthi

- Typed retrieval tools for blocks, requests, trains, safety records, risks, simulations, and benchmark results.
- Policy engine that authorizes every read tool before data reaches the model.
- Structured output schema validated before display.
- Evidence citations and confidence based on data freshness and completeness, not only model output.
- Prompt-injection and untrusted-record isolation.
- Multi-language terminology validation.
- Streaming answers with timeout and cancellation.
- Voice interface with push-to-talk and explicit confirmation of user identity.
- Shift summary, incident briefing, and schedule comparison modes.
- “Explain this decision” mode that quotes solver constraints and source records.
- “What changed since my last shift?” based on permitted audit events.
- Human escalation packet with no autonomous action.
- Evaluation harness with golden questions, refusal tests, hallucination checks, citation checks, and authorization tests.
- Red-team suite for prompt injection, sensitive data extraction, excessive agency, and denial-of-service prompts.

### Advanced platform, security, and governance

- Durable PKI backed by a managed key service or approved hardware-backed key storage.
- Key rotation, certificate revocation, and officer identity lifecycle.
- Immutable append-only audit storage.
- Row-level security or policy-enforced repository layer.
- Secrets manager integration.
- SAST, DAST, dependency, container, and secret scanning in CI.
- High availability, backup, restore, disaster recovery, and chaos testing.
- SLOs and incident management.
- Zero-trust service authentication.
- Data classification, retention, redaction, encryption, and access review.
- Approved external integration contracts and sandbox conformance tests.
- Digital signatures for safety artifacts.
- Tamper-evident exported evidence packs.
- Formal safety case and hazard log before any real operational use.

## Current Model: Is It the Best Choice?

### Direct answer

**The current XGBoost model is a reasonable baseline and demo component, but it is not currently the best validated model.** The most important improvement is not changing XGBoost to a more fashionable algorithm. It is fixing the data, labels, evaluation, feature consistency, and decision policy around the model.

### What is already good

- XGBoost works well for tabular operational data.
- It is fast enough for request-level scoring.
- It supports feature attribution through SHAP.
- It works with the current feature set and JSON model artifact.
- The fallback behavior keeps the service available if SHAP is missing.
- The continuous learner contains useful drift and champion/challenger ideas.
- The model is easy to explain to hackathon judges compared with a deep neural network.

### What is not good enough

- The training target is synthetic and formula-derived.
- The evaluation is primarily training-set evaluation in the base training script.
- The continuous learner augments real TGI measurements with synthetic risk labels rather than verified outcomes.
- The priority scorer and XGBoost feature schema are inconsistent.
- Several explanation fields use defaults rather than the actual request record.
- The output is called risk but is not a calibrated failure probability.
- There is no documented baseline comparison against a rule system.
- There is no false-negative, calibration, temporal, corridor, asset-type, or seasonal analysis.
- A high R2 on synthetic data would not prove safety or real-world predictive value.

### Recommended model strategy

#### Stage 1: Improve the existing model before replacing it

1. Create one canonical feature schema used by priority scoring, training, inference, explanation, and retraining.
2. Store the exact features used for each prediction with model version and timestamp.
3. Split synthetic data into train, validation, and test sets with separate seeds.
4. Use a rule-based baseline and compare XGBoost against it.
5. Report MAE, RMSE, R2, calibration, and false-negative rate.
6. Add an explicit `SYNTHETIC_DEMONSTRATION_ONLY` model status.
7. Replace fixed defaults in the explanation route with actual request and telemetry values.
8. Separate `risk_score`, `failure_probability`, and `maintenance_priority` into different concepts.
9. Add uncertainty and an abstain state for missing or stale features.
10. Add model versioning, reproducible seeds, training metadata, and a model card.

#### Stage 2: Compare candidate models on the same held-out data

Evaluate these candidates, without assuming a winner:

- Rule-based weighted score: transparent baseline and safety guard.
- Logistic regression: calibrated, simple, and easy to audit.
- Random forest or extra trees: strong nonlinear baseline.
- XGBoost or LightGBM: likely strong tabular candidate.
- CatBoost: useful if categorical departments, asset types, and corridors become important.
- Survival model: appropriate if the target is time to defect or failure.
- Isolation Forest or autoencoder: appropriate for anomaly detection when labels are scarce, but not a direct failure predictor.
- Temporal models: only if there is enough sequential sensor history; do not add deep learning merely for appearance.

Select the model using a cost-sensitive decision rule: missing a dangerous defect should cost much more than scheduling an unnecessary inspection. Accuracy alone is the wrong objective.

#### Stage 3: Build real-world learning capability

- Define the prediction event and horizon, for example: “Will this asset require a critical intervention within the next 30 days?”
- Join inspection measurements to future outcomes without leakage.
- Preserve time ordering.
- Capture defect confirmation, intervention, recurrence, and false alarm outcomes.
- Use corridor and asset-group holdouts to test generalization.
- Calibrate probabilities and display uncertainty.
- Keep a deterministic safety rule layer above the model.
- Require human review before champion promotion.
- Monitor drift, calibration, false negatives, and data quality after deployment.

### What model should be used for the hackathon?

Use **XGBoost plus a transparent rule baseline**, not a new deep-learning model. Present XGBoost as a synthetic tabular-risk demonstrator, show its limitations, and focus the judging evidence on:

- Sensitivity to severe conditions.
- Comparison against the rule baseline.
- Explainable feature contributions.
- Safe behavior when data is missing.
- Clear separation between model recommendation and human decision.
- How risk changes the optimization priority and schedule.

That is more defensible than claiming that a larger neural network is automatically better.

## Easy-to-Advanced Implementation Plan

### One-day improvements

- Add provenance badges.
- Add solver status and benchmark cards.
- Add model card.
- Add request/block citations to Rail Sarthi.
- Add a deterministic reset-demo command.
- Add missing-data and stale-data warnings.
- Add model status `SYNTHETIC_DEMONSTRATION_ONLY`.

### One-week improvements

- Add schedule diff and constraint explanations.
- Add route-level tenancy tests and enforcement.
- Add Rail Sarthi adversarial test matrix.
- Add frontend copilot E2E tests.
- Add model train/validation/test metrics and rule baseline.
- Add two-person safety approval flow.
- Add actual request feature retrieval for explanations.
- Add CI with coverage and clean-install checks.

### Two-to-four-week improvements

- Add machine and crew constraints.
- Add frozen-block emergency replanning.
- Add train delay propagation and multi-day planning.
- Add data lineage and replayable integration fixtures.
- Add bounded Rail Sarthi multi-turn context and evidence citations.
- Add operational observability and failure dashboards.
- Add 25/50/100/150 request benchmark report.

### Long-term advanced program

- Real labelled ML outcomes and model governance.
- Network digital twin.
- Full route conflict and interlocking-aware optimization.
- Approved external railway integrations.
- Durable PKI and formal safety assurance.
- High-availability deployment and field trials.

## Final Feature Decision Rule

Before adding any feature, ask:

1. Does it reduce possession time, safety risk, delay, or operator workload?
2. Can the result be measured against a baseline?
3. Can the operator understand and override it safely?
4. Is the data real, seeded, simulated, or stubbed?
5. Does the feature preserve tenant isolation and separation of duties?
6. Can the demo reproduce it from a clean checkout?

Features that pass all six questions should be prioritized. Features that only make the interface look more advanced should wait.
