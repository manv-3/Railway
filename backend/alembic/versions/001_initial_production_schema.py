"""Initial production schema - all tables with indexes

Revision ID: 001_initial_production_schema
Revises:
Create Date: 2026-09-08 02:00:00.000000

Creates all 14 tables for the PS 26027 Railway AI Platform:
  - operational_jurisdictions, users, stations, sections
  - maintenance_machinery, maintenance_requests, train_schedules
  - optimization_runs, maintenance_blocks, block_request_assignments
  - train_impacts, explainability_briefs, simulation_scenarios
  - statutory_audit_logs (NEW - V3-03 compliance)

Adds compound B-Tree indexes per improvementsv3.md §1.3:
  - idx_blocks_div_status, idx_blocks_time_window, idx_requests_sec_dept
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_production_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── operational_jurisdictions ─────────────────────────────────────────────
    op.create_table(
        "operational_jurisdictions",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("tier_level", sa.String(20), nullable=False),
        sa.Column("parent_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("code", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("username", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("tier_role", sa.String(30), nullable=False),
        sa.Column("department", sa.String(20), nullable=True),
        sa.Column("jurisdiction_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("active", sa.Boolean, default=True),
        sa.Column("last_login", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── stations ──────────────────────────────────────────────────────────────
    op.create_table(
        "stations",
        sa.Column("code", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("division_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("kilometer_mark", sa.Float, nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("number_of_platforms", sa.Integer, default=2),
        sa.Column("has_loop_lines", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── sections ──────────────────────────────────────────────────────────────
    op.create_table(
        "sections",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("division_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("start_station_code", sa.String(10), sa.ForeignKey("stations.code"), nullable=False),
        sa.Column("end_station_code", sa.String(10), sa.ForeignKey("stations.code"), nullable=False),
        sa.Column("start_km", sa.Float, nullable=False),
        sa.Column("end_km", sa.Float, nullable=False),
        sa.Column("track_direction", sa.String(20), nullable=False),
        sa.Column("speed_limit_kmh", sa.Integer, default=130),
        sa.Column("is_electrified", sa.Boolean, default=True),
        sa.Column("ohe_subsector_id", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── maintenance_machinery ─────────────────────────────────────────────────
    op.create_table(
        "maintenance_machinery",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("machine_type", sa.String(50), nullable=False),
        sa.Column("home_zone_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("assigned_division_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("current_station_code", sa.String(10), sa.ForeignKey("stations.code"), nullable=True),
        sa.Column("operational_status", sa.String(20), default="AVAILABLE"),
        sa.Column("capacity_rate_per_hour", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── maintenance_requests ──────────────────────────────────────────────────
    op.create_table(
        "maintenance_requests",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("request_id", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("department", sa.String(20), nullable=False, index=True),
        sa.Column("division_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("section_id", sa.String(50), sa.ForeignKey("sections.id"), nullable=False, index=True),
        sa.Column("from_km", sa.Float, nullable=False),
        sa.Column("to_km", sa.Float, nullable=False),
        sa.Column("asset_type", sa.String(50), nullable=False),
        sa.Column("defect_type", sa.String(100), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("estimated_duration_minutes", sa.Integer, nullable=False),
        sa.Column("required_machine_type", sa.String(50), nullable=True),
        sa.Column("assigned_machinery_id", sa.String(50), sa.ForeignKey("maintenance_machinery.id"), nullable=True),
        sa.Column("due_date", sa.DateTime, nullable=False),
        sa.Column("priority_score", sa.Float, default=0.0, index=True),
        sa.Column("safety_risk_index", sa.Float, default=0.0),
        sa.Column("status", sa.String(20), default="PENDING", index=True),
        sa.Column("created_by_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    # V3-01 §1.3: Compound index for section+department+status queries
    op.create_index(
        "idx_requests_sec_dept",
        "maintenance_requests",
        ["section_id", "department", "status"],
    )

    # ── train_schedules ───────────────────────────────────────────────────────
    op.create_table(
        "train_schedules",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("train_number", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("train_name", sa.String(100), nullable=False),
        sa.Column("train_category", sa.String(30), nullable=False),
        sa.Column("priority_precedence", sa.Integer, nullable=False, default=2),
        sa.Column("source_station_code", sa.String(10), nullable=False),
        sa.Column("dest_station_code", sa.String(10), nullable=False),
        sa.Column("scheduled_departure", sa.DateTime, nullable=False),
        sa.Column("scheduled_arrival", sa.DateTime, nullable=False),
        sa.Column("route_sections", postgresql.JSON, nullable=False),
        sa.Column("active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── optimization_runs ─────────────────────────────────────────────────────
    op.create_table(
        "optimization_runs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("run_id", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("division_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("start_window", sa.DateTime, nullable=False),
        sa.Column("end_window", sa.DateTime, nullable=False),
        sa.Column("algorithm_used", sa.String(50), default="OR_TOOLS_CPSAT"),
        sa.Column("total_input_requests", sa.Integer, nullable=False),
        sa.Column("scheduled_requests", sa.Integer, nullable=False),
        sa.Column("total_blocks_created", sa.Integer, nullable=False),
        sa.Column("combined_super_blocks", sa.Integer, nullable=False),
        sa.Column("total_time_saved_hours", sa.Float, nullable=False),
        sa.Column("asset_availability_gain_percent", sa.Float, nullable=False),
        sa.Column("train_delay_penalty_minutes", sa.Integer, default=0),
        sa.Column("solver_wall_time_seconds", sa.Float, nullable=False),
        sa.Column("status", sa.String(20), default="SUCCESS"),
        sa.Column("executed_by_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── maintenance_blocks ────────────────────────────────────────────────────
    op.create_table(
        "maintenance_blocks",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("block_id", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("division_id", sa.String(50), sa.ForeignKey("operational_jurisdictions.id"), nullable=True),
        sa.Column("section_id", sa.String(50), sa.ForeignKey("sections.id"), nullable=False, index=True),
        sa.Column("start_time", sa.DateTime, nullable=False, index=True),
        sa.Column("end_time", sa.DateTime, nullable=False, index=True),
        sa.Column("total_duration_minutes", sa.Integer, nullable=False),
        sa.Column("block_type", sa.String(30), default="SINGLE_DEPARTMENT"),
        sa.Column("is_combined", sa.Boolean, default=False),
        sa.Column("optimization_run_id", sa.Integer, sa.ForeignKey("optimization_runs.id"), nullable=True),
        sa.Column("status", sa.String(30), default="PLANNED", index=True),
        # G&SR Safety Protocol fields
        sa.Column("sanctioned_by_dom_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("sanctioned_by_tech_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("sanction_timestamp", sa.DateTime, nullable=True),
        sa.Column("disconnection_memo_number", sa.String(50), nullable=True),
        sa.Column("disconnection_memo_time", sa.DateTime, nullable=True),
        sa.Column("permit_to_work_ptw_number", sa.String(50), nullable=True),
        sa.Column("ptw_verified_by_tpc", sa.String(100), nullable=True),
        sa.Column("track_fit_cert_issued", sa.Boolean, default=False),
        sa.Column("track_fit_timestamp", sa.DateTime, nullable=True),
        sa.Column("post_block_tsr_speed_kmh", sa.Integer, nullable=True),
        sa.Column("post_block_tsr_duration_hours", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    # V3-01 §1.3: Compound indexes for block queries
    op.create_index(
        "idx_blocks_div_status",
        "maintenance_blocks",
        ["division_id", "status"],
    )
    op.create_index(
        "idx_blocks_time_window",
        "maintenance_blocks",
        ["start_time", "end_time"],
    )

    # ── block_request_assignments ─────────────────────────────────────────────
    op.create_table(
        "block_request_assignments",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("block_id", sa.Integer, sa.ForeignKey("maintenance_blocks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("request_id", sa.Integer, sa.ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_at", sa.DateTime, nullable=True),
    )

    # ── train_impacts ─────────────────────────────────────────────────────────
    op.create_table(
        "train_impacts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("block_id", sa.Integer, sa.ForeignKey("maintenance_blocks.id"), nullable=False),
        sa.Column("train_id", sa.Integer, sa.ForeignKey("train_schedules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("estimated_delay_minutes", sa.Integer, nullable=False),
        sa.Column("impact_type", sa.String(30), nullable=False),
        sa.Column("regulation_station_code", sa.String(10), sa.ForeignKey("stations.code"), nullable=True),
        sa.Column("is_passenger_train", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── explainability_briefs ─────────────────────────────────────────────────
    op.create_table(
        "explainability_briefs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("block_id", sa.Integer, sa.ForeignKey("maintenance_blocks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("executive_summary", sa.Text, nullable=False),
        sa.Column("safety_risk_tradeoff", sa.Text, nullable=False),
        sa.Column("shap_factors", postgresql.JSON, nullable=False),
        sa.Column("rejected_alternatives", postgresql.JSON, nullable=True),
        sa.Column("confidence_score", sa.Float, default=0.9),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── simulation_scenarios ──────────────────────────────────────────────────
    op.create_table(
        "simulation_scenarios",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("scenario_id", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("scenario_type", sa.String(50), nullable=False),
        sa.Column("base_optimization_id", sa.Integer, sa.ForeignKey("optimization_runs.id"), nullable=True),
        sa.Column("injected_parameters", postgresql.JSON, nullable=False),
        sa.Column("simulated_results", postgresql.JSON, nullable=False),
        sa.Column("reoptimization_wall_time_seconds", sa.Float, nullable=False),
        sa.Column("created_by_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=True),
    )

    # ── statutory_audit_logs (V3-03 G&SR Compliance) ─────────────────────────
    op.create_table(
        "statutory_audit_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("entity_type", sa.String(50)),      # "MAINTENANCE_BLOCK", "DISCONNECTION_MEMO"
        sa.Column("entity_id", sa.String(100), index=True),
        sa.Column("action", sa.String(50)),            # "SANCTION_GRANTED", "PTW_ISSUED"
        sa.Column("actor_user_id", sa.String(50)),
        sa.Column("actor_role", sa.String(50)),
        sa.Column("client_ip", sa.String(45)),
        sa.Column("timestamp", sa.DateTime, index=True),
        sa.Column("payload_sha256", sa.String(64)),    # Cryptographic hash of transaction
        sa.Column("metadata_json", postgresql.JSON),
    )


def downgrade() -> None:
    op.drop_table("statutory_audit_logs")
    op.drop_table("simulation_scenarios")
    op.drop_table("explainability_briefs")
    op.drop_table("train_impacts")
    op.drop_table("block_request_assignments")
    op.drop_index("idx_blocks_time_window", table_name="maintenance_blocks")
    op.drop_index("idx_blocks_div_status", table_name="maintenance_blocks")
    op.drop_table("maintenance_blocks")
    op.drop_table("optimization_runs")
    op.drop_table("train_schedules")
    op.drop_index("idx_requests_sec_dept", table_name="maintenance_requests")
    op.drop_table("maintenance_requests")
    op.drop_table("maintenance_machinery")
    op.drop_table("sections")
    op.drop_table("stations")
    op.drop_table("users")
    op.drop_table("operational_jurisdictions")
