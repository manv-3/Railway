"""
Prometheus Metrics Registry - PS 26027 Railway AI Platform.
Exports operational metrics for Grafana monitoring dashboards.
"""

from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, REGISTRY

# ─── Optimizer Metrics ────────────────────────────────────────────────────────
railway_optimizer_solve_time = Histogram(
    "railway_optimizer_solve_time_seconds",
    "Time taken by CP-SAT optimizer to find a maintenance block solution",
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0],
)

# ─── Block Lifecycle Counters ─────────────────────────────────────────────────
railway_blocks_sanctioned_total = Counter(
    "railway_blocks_sanctioned_total",
    "Total number of maintenance blocks jointly sanctioned by Sr. DOM and Technical Branches",
)

railway_blocks_disconnected_total = Counter(
    "railway_blocks_disconnected_total",
    "Total number of blocks for which Disconnection Memo has been issued",
)

railway_ptw_issued_total = Counter(
    "railway_ptw_issued_total",
    "Total number of Permit-to-Work (PTW) documents issued by TPC",
)

railway_track_fit_issued_total = Counter(
    "railway_track_fit_issued_total",
    "Total number of Track Fitness Certificates issued by SSE after maintenance",
)

# ─── WebSocket Gauge ──────────────────────────────────────────────────────────
railway_websocket_clients = Gauge(
    "railway_websocket_connected_clients",
    "Current number of WebSocket clients connected to the real-time corridor feed",
)

# ─── Asset Availability ───────────────────────────────────────────────────────
railway_track_downtime_saved = Counter(
    "railway_track_downtime_saved_hours_total",
    "Cumulative track downtime hours saved by AI block bundling vs separate maintenance",
)

railway_optimization_runs_total = Counter(
    "railway_optimization_runs_total",
    "Total number of CP-SAT optimization runs executed",
    ["status"],  # labels: 'SUCCESS', 'INFEASIBLE', 'ERROR'
)

# ─── API Error Counters ───────────────────────────────────────────────────────
railway_api_errors_total = Counter(
    "railway_api_errors_total",
    "Total number of API errors by endpoint and status code",
    ["endpoint", "status_code"],
)
