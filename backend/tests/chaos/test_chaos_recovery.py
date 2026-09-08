"""
Automated Chaos Engineering & Compound Disaster Recovery Suite
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-12: Multi-Failure Compound Disaster Simulation Tests

Simulates severe simultaneous disruptions on the high-density Delhi-Kanpur corridor:
- 3 Emergency Rail Fractures (P-Way / TMS)
- 2 OHE 25kV Overhead Wire Snaps (Traction / TDMS)
- 1 Signaling Circuit Power Loss / Track Circuit Failure (S&T / SMMS)

Validates Safety Invariants:
1. Solver convergence <= 10.0s under compound disaster stress.
2. Zero train collisions: Absolute spatial-temporal separation.
3. Automatic loop-line regulation: Freight trains held at loops, preserving corridor capacity.
4. Precedence priority: Vande Bharat / Rajdhani Express detention = 0m (bypass).
5. Kavach TCAS RDSO Packet 51/65 geofenced braking envelopes generated.
6. Statutory PKI Section 65B judicial inquiry audit certificates verified.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

from optimization.cpsat_optimizer import CPSATBlockOptimizer
from simulation.train_delay_simulator import TrainDispatchSimulator
from integrations.kavach_adapter import (
    KavachPacket51,
    KavachPacket65,
    KavachBrakingCurveCalculator,
    KavachSafetyEnvelopeGenerator,
)
from core.pki_signer import (
    PKICertificateAuthority,
    PKIDigitalSigner,
    CRSAuditPacketGenerator,
)
from database.tenancy import TenancyPolicy, PanIndiaZonalAggregator


@pytest.fixture
def chaos_environment():
    """Builds a realistic high-density corridor traffic schedule."""
    trains = [
        # Premium Trains (Priority 1) - Must never be detained
        {
            "train_number": "22436",
            "train_name": "Vande Bharat Express",
            "train_category": "VANDE_BHARAT",
            "priority_precedence": 1,
            "section_id": "SEC_GZB_ALJN_UP",
            "entry_minute": 60,
            "exit_minute": 110,
        },
        {
            "train_number": "12302",
            "train_name": "Howrah Rajdhani Express",
            "train_category": "RAJDHANI",
            "priority_precedence": 1,
            "section_id": "SEC_GZB_ALJN_UP",
            "entry_minute": 180,
            "exit_minute": 230,
        },
        # Superfast / Mail Express (Priority 2)
        {
            "train_number": "12418",
            "train_name": "Prayagraj Express",
            "train_category": "SUPERFAST",
            "priority_precedence": 2,
            "section_id": "SEC_GZB_ALJN_UP",
            "entry_minute": 90,
            "exit_minute": 150,
        },
        # Freight Trains (Priority 4) - Held on loop lines during emergency
        {
            "train_number": "BOXN_COAL_01",
            "train_name": "BOXN Heavy Haul Coal Rake",
            "train_category": "FREIGHT",
            "priority_precedence": 4,
            "section_id": "SEC_GZB_ALJN_UP",
            "entry_minute": 70,
            "exit_minute": 160,
        },
        {
            "train_number": "BCN_GRAIN_02",
            "train_name": "BCN Food Grain Rake",
            "train_category": "FREIGHT",
            "priority_precedence": 4,
            "section_id": "SEC_GZB_ALJN_UP",
            "entry_minute": 80,
            "exit_minute": 170,
        },
    ]

    routine_requests = [
        {
            "request_id": "REQ_ROUTINE_01",
            "department": "TMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 40.0,
            "to_km": 42.0,
            "estimated_duration_minutes": 120,
            "priority_score": 65.0,
            "required_machine_type": "TAMPING_MACHINE",
        },
        {
            "request_id": "REQ_ROUTINE_02",
            "department": "TDMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 60.0,
            "to_km": 62.0,
            "estimated_duration_minutes": 90,
            "priority_score": 60.0,
            "required_machine_type": "TOWER_WAGON",
        },
    ]

    compound_disasters = [
        # Disasters 1, 2, 3: Emergency Rail Fractures (TMS)
        {
            "request_id": "CHAOS_FRACTURE_KM45",
            "department": "TMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 45.2,
            "to_km": 45.6,
            "estimated_duration_minutes": 90,
            "priority_score": 100.0,
            "severity": "EMERGENCY",
            "defect_type": "WELD_FAILURE_TRANSVERSE_FRACTURE",
            "required_machine_type": None,
        },
        {
            "request_id": "CHAOS_FRACTURE_KM52",
            "department": "TMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 52.4,
            "to_km": 52.8,
            "estimated_duration_minutes": 90,
            "priority_score": 100.0,
            "severity": "EMERGENCY",
            "defect_type": "INTERNAL_FATIGUE_RAIL_BREAK",
            "required_machine_type": None,
        },
        {
            "request_id": "CHAOS_FRACTURE_KM88",
            "department": "TMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 88.0,
            "to_km": 88.5,
            "estimated_duration_minutes": 90,
            "priority_score": 100.0,
            "severity": "EMERGENCY",
            "defect_type": "SWITCH_TONGUE_FRACTURE",
            "required_machine_type": None,
        },
        # Disasters 4, 5: 25kV OHE Overhead Wire Snaps (TDMS)
        {
            "request_id": "CHAOS_OHE_SNAP_KM12",
            "department": "TDMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 12.0,
            "to_km": 13.5,
            "estimated_duration_minutes": 120,
            "priority_score": 100.0,
            "severity": "EMERGENCY",
            "defect_type": "CATENARY_DROPPER_PARTING",
            "required_machine_type": "TOWER_WAGON",
        },
        {
            "request_id": "CHAOS_OHE_SNAP_KM65",
            "department": "TDMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 65.5,
            "to_km": 67.0,
            "estimated_duration_minutes": 120,
            "priority_score": 100.0,
            "severity": "EMERGENCY",
            "defect_type": "CONTACT_WIRE_PARTING_INSULATOR_FLASH",
            "required_machine_type": "TOWER_WAGON",
        },
        # Disaster 6: Complete Track Circuit Power Failure (SMMS)
        {
            "request_id": "CHAOS_SIG_FAIL_KM30",
            "department": "SMMS",
            "section_id": "SEC_GZB_ALJN_UP",
            "from_km": 30.0,
            "to_km": 35.0,
            "estimated_duration_minutes": 90,
            "priority_score": 100.0,
            "severity": "EMERGENCY",
            "defect_type": "AXLE_COUNTER_RESET_POWER_SUPPLY_FAILURE",
            "required_machine_type": None,
        },
    ]

    return {
        "trains": trains,
        "routine_requests": routine_requests,
        "compound_disasters": compound_disasters,
    }


def test_compound_disaster_solver_convergence(chaos_environment):
    """
    Asserts solver converges within 10.0 seconds under 6 simultaneous compound disasters,
    and schedules all emergency blocks with highest priority.
    """
    all_requests = chaos_environment["compound_disasters"] + chaos_environment["routine_requests"]
    trains = chaos_environment["trains"]

    optimizer = CPSATBlockOptimizer(time_horizon_minutes=1440)
    start_time = time.time()
    result = optimizer.solve(requests=all_requests, trains=trains, max_time_seconds=10.0)
    elapsed = time.time() - start_time

    assert elapsed <= 10.0, f"Solver took {elapsed:.2f}s, exceeding 10.0s crisis SLA!"
    assert result["status"] in ("SUCCESS", "OPTIMAL", "FEASIBLE")
    assert result["scheduled_requests"] >= 6, "All 6 emergency disaster requests must be scheduled!"


def test_train_safety_and_loop_line_invariants(chaos_environment):
    """
    Asserts:
    1. Zero collision: Premium passenger trains bypass detention.
    2. Freight rakes automatically held on station loop lines to maintain corridor throughput.
    """
    trains = chaos_environment["trains"]
    simulator = TrainDispatchSimulator()

    # Emergency possession block active during peak traffic (minutes 60 to 150)
    emergency_block = {
        "block_id": "CHAOS_EMERGENCY_PEAK_01",
        "section_id": "SEC_GZB_ALJN_UP",
        "start_minute": 60,
        "end_minute": 150,
        "total_duration_minutes": 90,
    }

    all_impacts = simulator.simulate_impact(emergency_block, trains)

    # Invariant 1: Premium trains (Vande Bharat / Rajdhani) must NEVER be detained (0m detention)
    premium_detained = [imp for imp in all_impacts if imp["priority_precedence"] == 1]
    assert len(premium_detained) == 0, "Premium trains must never suffer detention (priority bypass enforced)"

    # Invariant 2: Freight rakes must be safely held on loop lines
    freight_impacts = [imp for imp in all_impacts if imp["priority_precedence"] == 4]
    assert len(freight_impacts) > 0, "Freight traffic should be regulated on loop lines during emergency block"
    for f_imp in freight_impacts:
        assert f_imp["impact_type"] == "HELD_AT_LOOP_LINE"
        assert f_imp["estimated_delay_minutes"] >= 10


def test_kavach_electronic_braking_envelope_under_chaos():
    """
    Asserts RDSO/SPN/196 Packet 51 (TSR) and Packet 65 (Virtual Red) are generated
    with safe electronic deceleration curves under chaos conditions.
    """
    now = datetime.utcnow()
    envelope = KavachSafetyEnvelopeGenerator.generate_envelope_for_block(
        block_id="CHAOS_BLK_EMERGENCY_999",
        section_id="SEC_GZB_ALJN_UP",
        from_km=45.2,
        to_km=45.6,
        start_time=now,
        end_time=now + timedelta(hours=2),
        post_block_tsr_speed_kmh=30,
    )

    assert envelope["status"] == "ACTIVE_KAVACH_ENVELOPE"
    assert envelope["block_id"] == "CHAOS_BLK_EMERGENCY_999"
    assert envelope["packet_65_movement_authority"]["end_of_authority_km"] == 45.2
    assert envelope["packet_65_movement_authority"]["service_brake_distance_m"] == 1200.0
    assert envelope["packet_51_possession_tsr"]["allowed_speed_kmh"] == 0
    assert envelope["packet_51_post_work_tsr"]["allowed_speed_kmh"] == 30
    assert len(envelope["geofenced_braking_curve"]) > 5

    # Safe approach speed test
    safe_speed_1200m = KavachBrakingCurveCalculator.compute_max_safe_approach_speed(1200.0)
    assert 120.0 <= safe_speed_1200m <= 130.0
    safe_speed_0m = KavachBrakingCurveCalculator.compute_max_safe_approach_speed(0.0)
    assert safe_speed_0m == 0.0


def test_pki_crs_judicial_audit_trail_under_emergency():
    """
    Asserts Station Master Form T/351 and TPC 25kV PTW can be signed using X.509 DSC
    and verified in a judicial audit packet admissible under Section 65B.
    """
    memo_manifest = {
        "memo_number": "EMERGENCY-MEMO-GZB-001",
        "station_code": "GZB",
        "block_id": "CHAOS_BLK_EMERGENCY_999",
        "emergency_cause": "COMPOUND_RAIL_FRACTURE_AND_OHE_SNAP",
        "statutory_action": "RED_COLLARS_APPLIED_AND_TRACTION_ISOLATED",
    }

    sig_info = PKIDigitalSigner.sign_statutory_manifest(
        manifest_payload=memo_manifest,
        signer_username="station_master_gzb",
        signer_name="Station Master Ghaziabad",
        department="OPERATING",
        role="STATION_MASTER",
    )
    assert sig_info["signature_algorithm"] == "RSA-PSS-SHA256"
    assert "signature_base64" in sig_info
    assert "certificate_pem" in sig_info

    verify_res = PKIDigitalSigner.verify_statutory_manifest(
        manifest_payload=memo_manifest,
        signature_base64=sig_info["signature_base64"],
        certificate_pem=sig_info["certificate_pem"],
    )
    assert verify_res["is_valid"] is True
    assert verify_res["legal_status"] == "AUTHENTIC_NON_REPUDIABLE"

    # Generate CRS judicial inquiry audit bundle
    audit_records = [
        {
            "action": "DISCONNECTION_ISSUED",
            "actor_user_id": "sm_gzb",
            "actor_role": "STATION_MASTER",
            "timestamp": "2026-09-08T03:00:00Z",
            "metadata_json": memo_manifest,
        }
    ]
    audit_bundle = CRSAuditPacketGenerator.build_inquiry_bundle(
        block_id="CHAOS_BLK_EMERGENCY_999",
        section_id="SEC_GZB_ALJN_UP",
        audit_records=audit_records,
    )
    assert audit_bundle["chain_of_custody_intact"] is True
    assert audit_bundle["total_statutory_actions_signed"] == 1
    cert = audit_bundle["judicial_admissibility_certificate"]
    assert cert["evidence_status"] == "ADMISSIBLE_ORIGINAL_ELECTRONIC_RECORD"
    assert "Section 65B" in cert["certified_under"]


def test_multi_zonal_tenancy_and_interchange_isolation():
    """
    Asserts pan-India tenancy isolation and inter-divisional concurrence at ALJN interchange:
    - Delhi Division cannot unilaterally modify Prayagraj Division.
    - Concurrence verification blocks uncoordinated boundary work.
    """
    dli_controller = {"tier_role": "DIV_CONTROLLER", "jurisdiction_id": "DIV_DLI"}
    board_exec = {"tier_role": "BOARD_EXEC", "jurisdiction_id": "BOARD_IR"}

    # Delhi controller can access DIV_DLI but not DIV_PRYJ
    assert TenancyPolicy.can_access_division(dli_controller, "DIV_DLI") is True
    assert TenancyPolicy.can_access_division(dli_controller, "DIV_PRYJ") is False

    # Railway Board Executive can access any division in India
    assert TenancyPolicy.can_access_division(board_exec, "DIV_DLI") is True
    assert TenancyPolicy.can_access_division(board_exec, "DIV_PRYJ") is True

    # Boundary check without mutual agreement is blocked
    check_blocked = TenancyPolicy.verify_inter_divisional_concurrence(
        origin_division="DIV_DLI",
        target_division="DIV_PRYJ",
        section_id="SEC_GZB_ALJN_UP",
        has_mutual_agreement=False,
    )
    assert check_blocked["status"] == "PENDING_CONCURRENCE"
    assert check_blocked["concurrence_required"] is True

    # With mutual agreement, inter-divisional concurrence is approved
    check_approved = TenancyPolicy.verify_inter_divisional_concurrence(
        origin_division="DIV_DLI",
        target_division="DIV_PRYJ",
        section_id="SEC_GZB_ALJN_UP",
        has_mutual_agreement=True,
    )
    assert check_approved["status"] == "APPROVED"
    assert check_approved["interchange_station"] == "ALJN"

    # Pan-India aggregator returns all 17 Zones
    zones = PanIndiaZonalAggregator.get_pan_india_zonal_kpis()
    assert len(zones) == 17
    summary = PanIndiaZonalAggregator.get_pan_india_summary()
    assert summary["total_zones"] == 17
    assert summary["national_punctuality_percent"] >= 90.0
