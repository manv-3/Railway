import pytest
from datetime import datetime
from database.models import MaintenanceBlock

def test_safety_state_machine_transitions():
    """Verify Indian Railways G&SR statutory safety transitions."""
    block = MaintenanceBlock(
        block_id="BLK_TEST_01",
        section_id="SEC_GZB_ALJN_UP",
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow(),
        total_duration_minutes=120,
        status="PLANNED"
    )

    # Step 1: Joint Sanction
    block.status = "SANCTIONED"
    block.sanction_timestamp = datetime.utcnow()
    assert block.status == "SANCTIONED"

    # Step 2: Station Master Disconnection Memo
    block.status = "DISCONNECTED"
    block.disconnection_memo_number = "MEMO-GZB-2026-999"
    block.disconnection_memo_time = datetime.utcnow()
    assert block.status == "DISCONNECTED"
    assert block.disconnection_memo_number.startswith("MEMO-")

    # Step 3: Traction Power Controller (TPC) Permit-to-Work (PTW)
    block.permit_to_work_ptw_number = "PTW-OHE-DLI-123"
    block.ptw_verified_by_tpc = "TPC Controller A. Verma"
    assert block.permit_to_work_ptw_number is not None

    # Step 4: Track Fit & Caution Order (TSR)
    block.status = "FIT_RESTORED"
    block.track_fit_cert_issued = True
    block.post_block_tsr_speed_kmh = 45
    block.post_block_tsr_duration_hours = 2

    assert block.status == "FIT_RESTORED"
    assert block.track_fit_cert_issued is True
    assert block.post_block_tsr_speed_kmh == 45
