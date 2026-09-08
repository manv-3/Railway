# Codex Improvement Report

**Date:** 2026-09-08

## Changes completed

### Optimizer correctness

- Reset the CP-SAT model and solver for every `solve()` call so a reused optimizer cannot retain constraints from a previous run.
- Added validation for duplicate request IDs, invalid durations, and invalid KM ranges.
- Corrected bundling logic. Work is now eligible for a shared possession only when it is on the same section, belongs to different departments, and its physical KM span overlaps.
- Prevented the old false-positive behaviour where jobs anywhere on a long section received a bundling reward.
- Made the bundling Boolean equivalent to actual temporal overlap instead of allowing an unearned objective bonus.
- Preserved KM and machine information in scheduled task output.
- Updated the stress-test data so it creates real three-department co-located work sites rather than expecting impossible bundles from geographically separate jobs.

### Database seeding and data quality

- Repaired the master seeder's nonexistent `get_db_session` import.
- Made the seeder create the schema non-destructively before loading data.
- Fixed the station field mapping (`platforms` to `number_of_platforms`).
- Stopped storing train route JSON as a quoted string; routes now persist as JSON arrays.
- Converted timetable strings to solver-ready `entry_minute` and `exit_minute` values, including midnight-crossing segments.
- Converted ISO-formatted maintenance due dates to Python datetimes before database insertion.
- Fixed a foreign-key-breaking machinery location (`DLI` to `NDLS`).
- Expanded the realistic schedule generator to 50 trains and changed the seeder summary to report actual database totals rather than hard-coded claims.

### Authentication and safety workflow

- Connected the frontend login screen to the real JWT endpoint; it no longer bypasses authentication.
- Added token storage and automatic Bearer authentication headers for frontend API calls.
- Added role-aware frontend routes, navigation, and sign-out.
- Routed field-ticket creation through the authenticated API client.
- Protected state-changing backend actions with role checks:
  - Field request creation
  - Optimization and what-if simulation
  - Block sanction, disconnection memo, PTW, and track-fit actions
- Enforced the operational safety state sequence:
  `PLANNED → SANCTIONED → DISCONNECTED → PTW_GRANTED → FIT_RESTORED`.
- Added basic input validation to maintenance, optimization, simulation, and track-fit requests.
- Replaced permissive wildcard CORS with configured local development origins.

### Dependency reliability

- Pinned `bcrypt==4.0.1`, because the prior unpinned bcrypt 5.x release breaks `passlib==1.7.4` during authentication import.

## Verification performed

- Frontend production build: passed (`tsc && vite build`).
- Backend container build: completed before dependency changes; the Dockerfile and dependency installation were validated.
- Backend suite after the fixes: **20 passed**.
- Master seed script: completed successfully against the local project database.

## Important remaining limitations

- This is a capable prototype, not production railway-control software. It has no safety certification, external signalling integration, audited dispatch authority, or real-time RTIS feed.
- The local database used during verification already contained test-seed data, so its final reported totals were mixed (58 trains / 106 requests). A fresh database seeded only by `seed_all_data.py` is required for a clean demo baseline.
- The frontend production bundle remains large (about 686 KB before gzip); route-level code splitting is still needed.
- The project lacks database migrations, CI/CD, secrets management, structured audit trails, rate limiting, and production observability.
- Some executive dashboards still render static placeholder KPI values when there is no optimization run. Do not present those as live national railway data.
- Documentation contains duplicated files and several historical claims that were not true before this audit. It needs consolidation and a single honest current-status document.
