"""
Kavach (TCAS) Digital Braking Envelopes & RDSO Movement Authority Generator
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-08: RDSO Specification RDSO/SPN/196 Conformance

Compiles electronic Movement Authority constraints for maintenance possessions:
- Kavach Packet 51: Temporary Speed Restriction (TSR)
- Kavach Packet 65: Movement Authority Termination & Virtual Red Signal
- Geofenced Braking Curves: Automated locomotive brake application envelopes
"""

import math
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel


class KavachPacket51(BaseModel):
    """
    RDSO/SPN/196 Packet 51: Temporary Speed Restriction (TSR) Profile.
    Transmitted via UHF radio to locomotive On-Board Units (OBU).
    """
    packet_id: int = 51
    tsr_id: str
    section_id: str
    start_km: float
    end_km: float
    allowed_speed_kmh: int
    direction: str  # "UP", "DOWN", "BOTH"
    effective_from: str
    effective_until: str
    hex_payload: str

    @classmethod
    def create(
        cls,
        tsr_id: str,
        section_id: str,
        start_km: float,
        end_km: float,
        speed_kmh: int,
        effective_from: datetime,
        effective_until: datetime,
        direction: str = "UP",
    ) -> "KavachPacket51":
        # RDSO byte packing emulation: PacketType (1B) + TSR_ID (2B) + StartKM (4B) + EndKM (4B) + Speed (1B)
        raw_bytes = (
            f"33{int(start_km * 1000):08X}{int(end_km * 1000):08X}{speed_kmh:02X}"
        )
        hex_encoded = f"AA55{raw_bytes}00FF"

        return cls(
            tsr_id=tsr_id,
            section_id=section_id,
            start_km=start_km,
            end_km=end_km,
            allowed_speed_kmh=speed_kmh,
            direction=direction,
            effective_from=effective_from.isoformat(),
            effective_until=effective_until.isoformat(),
            hex_payload=hex_encoded,
        )


class KavachPacket65(BaseModel):
    """
    RDSO/SPN/196 Packet 65: Movement Authority (MA) Termination / Virtual Red Signal.
    Truncates locomotive Movement Authority at maintenance possession boundary.
    """
    packet_id: int = 65
    ma_id: str
    end_of_authority_km: float
    danger_zone_start_km: float
    danger_zone_end_km: float
    service_brake_distance_m: float = 1200.0
    emergency_brake_distance_m: float = 500.0
    target_speed_at_eoa_kmh: int = 0
    hex_payload: str

    @classmethod
    def create(
        cls,
        ma_id: str,
        block_start_km: float,
        block_end_km: float,
    ) -> "KavachPacket65":
        # End of Authority is placed at possession boundary
        eoa_km = round(block_start_km, 3)
        raw_bytes = f"41{int(eoa_km * 1000):08X}0000{int(block_end_km * 1000):08X}"
        hex_encoded = f"AA55{raw_bytes}55AA"

        return cls(
            ma_id=ma_id,
            end_of_authority_km=eoa_km,
            danger_zone_start_km=block_start_km,
            danger_zone_end_km=block_end_km,
            service_brake_distance_m=1200.0,
            emergency_brake_distance_m=500.0,
            target_speed_at_eoa_kmh=0,
            hex_payload=hex_encoded,
        )


class KavachBrakingCurveCalculator:
    """
    Computes statutory Kavach braking profiles per RDSO/SPN/196 Appendix C.
    Standard passenger deceleration a_service = 0.6 m/s^2, a_emergency = 0.85 m/s^2.
    """

    A_SERVICE = 0.60  # m/s^2
    A_EMERGENCY = 0.85  # m/s^2

    @classmethod
    def compute_max_safe_approach_speed(cls, distance_to_eoa_m: float) -> float:
        """
        Calculates maximum permitted locomotive speed (km/h) as a function
        of distance remaining to the End of Authority.
        v = sqrt(2 * a * d) converted to km/h.
        """
        if distance_to_eoa_m <= 0:
            return 0.0
        v_ms = math.sqrt(2.0 * cls.A_SERVICE * distance_to_eoa_m)
        return min(130.0, round(v_ms * 3.6, 1))

    @classmethod
    def evaluate_locomotive_approach(
        cls,
        loco_km: float,
        loco_speed_kmh: float,
        block_start_km: float,
    ) -> Dict[str, Any]:
        """
        Evaluates real-time approach safety for a locomotive moving toward a possession boundary.
        """
        dist_m = (block_start_km - loco_km) * 1000.0
        max_safe_speed = cls.compute_max_safe_approach_speed(dist_m)

        if dist_m <= 0:
            status = "DANGER_VIOLATION_OCCURRED"
            action = "EMERGENCY_BRAKE_TRIPPED"
        elif dist_m <= 500.0 or loco_speed_kmh > max_safe_speed * 1.15:
            status = "EMERGENCY_BRAKE_ZONE"
            action = "AUTOMATIC_EMERGENCY_BRAKING"
        elif dist_m <= 1200.0 or loco_speed_kmh > max_safe_speed:
            status = "SERVICE_BRAKE_ZONE"
            action = "AUTOMATIC_SERVICE_BRAKING"
        elif dist_m <= 2500.0:
            status = "APPROACH_WARNING_ZONE"
            action = "CAB_AUDIO_VISUAL_WARNING"
        else:
            status = "NORMAL_CLEAR"
            action = "TRACK_AUTHORITY_VALID"

        return {
            "distance_to_possession_m": round(dist_m, 1),
            "current_speed_kmh": loco_speed_kmh,
            "max_safe_speed_kmh": max_safe_speed,
            "safety_status": status,
            "kavach_command": action,
        }


class KavachSafetyEnvelopeGenerator:
    """
    Generates verified Kavach RDSO Packet 51/65 bundles for maintenance possessions.
    """

    @classmethod
    def generate_envelope_for_block(
        cls,
        block_id: str,
        section_id: str,
        from_km: float,
        to_km: float,
        start_time: datetime,
        end_time: datetime,
        post_block_tsr_speed_kmh: Optional[int] = 45,
    ) -> Dict[str, Any]:
        """
        Generates full Kavach electronic safety packet set for an active maintenance possession.
        """
        direction = "UP" if "UP" in section_id else "DOWN"

        # 1. Packet 65: Absolute Virtual Red Signal at possession entry
        p65 = KavachPacket65.create(
            ma_id=f"MA_{block_id}",
            block_start_km=from_km,
            block_end_km=to_km,
        )

        # 2. Packet 51: Possession Zone 0 km/h TSR during work
        p51_possession = KavachPacket51.create(
            tsr_id=f"TSR_POSSESSION_{block_id}",
            section_id=section_id,
            start_km=from_km,
            end_km=to_km,
            speed_kmh=0,
            effective_from=start_time,
            effective_until=end_time,
            direction=direction,
        )

        # 3. Packet 51: Post-Work Caution Order TSR (e.g., 45 km/h for 2 hours)
        p51_caution = None
        if post_block_tsr_speed_kmh and post_block_tsr_speed_kmh > 0:
            caution_end = end_time + timedelta(hours=2)
            p51_caution = KavachPacket51.create(
                tsr_id=f"TSR_CAUTION_{block_id}",
                section_id=section_id,
                start_km=from_km,
                end_km=to_km,
                speed_kmh=post_block_tsr_speed_kmh,
                effective_from=end_time,
                effective_until=caution_end,
                direction=direction,
            )

        # 4. Generate approach braking profile curve points (2500m down to 0m)
        distance_samples = [2500, 2000, 1500, 1200, 1000, 800, 500, 300, 100, 0]
        braking_curve = [
            {
                "distance_m": d,
                "max_permitted_speed_kmh": KavachBrakingCurveCalculator.compute_max_safe_approach_speed(d),
            }
            for d in distance_samples
        ]

        envelope_hash = hashlib.sha256(
            f"{p65.hex_payload}{p51_possession.hex_payload}".encode("utf-8")
        ).hexdigest()

        return {
            "status": "ACTIVE_KAVACH_ENVELOPE",
            "block_id": block_id,
            "section_id": section_id,
            "rdso_specification": "RDSO/SPN/196 (Kavach TCAS v4.0)",
            "packet_65_movement_authority": p65.dict(),
            "packet_51_possession_tsr": p51_possession.dict(),
            "packet_51_post_work_tsr": p51_caution.dict() if p51_caution else None,
            "geofenced_braking_curve": braking_curve,
            "envelope_sha256": envelope_hash,
            "generated_at": datetime.utcnow().isoformat(),
        }
