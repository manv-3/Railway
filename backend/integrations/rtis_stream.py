"""
ISRO NavIC / RTIS Satellite Telemetry Streaming Ingester & Kalman ETA Predictor
PS 26027 - Indian Railways AI Block Planning Platform
Task V5-07: Real-Time Train Information System (RTIS) Integration

Ingests ISRO NavIC satellite transponder packets transmitted every 30 seconds
by locomotives (WAP-7, WAP-5, Vande Bharat EMU rakes).
Filters GPS noise using a 1-D kinematic Kalman filter, estimates dynamic arrival
drift against timetables, and triggers closed-loop solver replanning opportunities.
"""

import math
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


@dataclass
class NavICTransponderPacket:
    locomotive_number: str
    train_number: str
    timestamp: datetime
    latitude: float
    longitude: float
    speed_kmh: float
    heading_degrees: float
    current_km_mark: float
    section_id: str
    gnss_fix_quality: str = "NAVIC_3D_FIX"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "NavICTransponderPacket":
        ts = data.get("timestamp")
        if isinstance(ts, str):
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                dt = datetime.utcnow()
        elif isinstance(ts, datetime):
            dt = ts
        else:
            dt = datetime.utcnow()

        return cls(
            locomotive_number=str(data.get("locomotive_number", "WAP7-30001")),
            train_number=str(data.get("train_number", "22436")),
            timestamp=dt,
            latitude=float(data.get("latitude", 28.66)),
            longitude=float(data.get("longitude", 77.43)),
            speed_kmh=float(data.get("speed_kmh", 110.0)),
            heading_degrees=float(data.get("heading_degrees", 125.0)),
            current_km_mark=float(data.get("current_km_mark", 45.0)),
            section_id=str(data.get("section_id", "SEC_GZB_ALJN_UP")),
            gnss_fix_quality=str(data.get("gnss_fix_quality", "NAVIC_3D_FIX")),
        )


class KalmanPositionFilter:
    """
    1-D Kinematic Kalman Filter for track kilometer position and velocity smoothing.
    State: x = [position_km, velocity_km_per_min]^T
    Eliminates satellite multipath noise and GPS jitter in deep cuttings or station sheds.
    """

    def __init__(
        self,
        initial_km: float = 0.0,
        initial_speed_kmh: float = 0.0,
        process_variance: float = 0.05,
        measurement_variance: float = 0.25,
    ):
        # State: [position (km), velocity (km/min)]
        self.pos = initial_km
        self.vel = initial_speed_kmh / 60.0  # km/min

        # Covariance matrix P
        self.p_pos = 1.0
        self.p_vel = 1.0
        self.p_pos_vel = 0.0

        # Noise parameters
        self.q = process_variance
        self.r = measurement_variance
        self.last_update = datetime.utcnow()

    def update(self, measured_km: float, measured_speed_kmh: float, dt_seconds: float = 30.0) -> Dict[str, float]:
        """Runs Predict and Update step given new NavIC satellite fix."""
        dt = max(1.0, dt_seconds) / 60.0  # minutes

        # 1. State Prediction: x = F * x
        pred_pos = self.pos + self.vel * dt
        pred_vel = self.vel

        # Covariance Prediction: P = F * P * F^T + Q
        pred_p_pos = self.p_pos + 2.0 * dt * self.p_pos_vel + (dt ** 2) * self.p_vel + self.q
        pred_p_vel = self.p_vel + self.q
        pred_p_pos_vel = self.p_pos_vel + dt * self.p_vel

        # 2. Measurement Update (Kalman Gain)
        measured_vel = measured_speed_kmh / 60.0
        s_pos = pred_p_pos + self.r
        s_vel = pred_p_vel + self.r

        k_pos = pred_p_pos / s_pos
        k_vel = pred_p_vel / s_vel

        # Updated State
        self.pos = pred_pos + k_pos * (measured_km - pred_pos)
        self.vel = max(0.0, pred_vel + k_vel * (measured_vel - pred_vel))

        # Updated Covariance
        self.p_pos = (1.0 - k_pos) * pred_p_pos
        self.p_vel = (1.0 - k_vel) * pred_p_vel
        self.p_pos_vel = (1.0 - k_pos) * pred_p_pos_vel

        return {
            "smoothed_km": round(self.pos, 3),
            "smoothed_speed_kmh": round(self.vel * 60.0, 1),
        }


class RTISStreamIngester:
    """
    Manages active locomotive GPS tracking, applies Kalman trajectory filtering,
    evaluates station boundary arrival drift, and detects corridor capacity slots.
    """

    DRIFT_ALERT_THRESHOLD_MINUTES = 10.0

    def __init__(self):
        self._filters: Dict[str, KalmanPositionFilter] = {}
        self._latest_telemetry: Dict[str, Dict[str, Any]] = {}

    def ingest_packet(
        self,
        packet: NavICTransponderPacket,
        timetabled_arrival: Optional[datetime] = None,
        destination_km: float = 131.2,  # e.g., ALJN boundary
    ) -> Dict[str, Any]:
        """
        Processes an incoming NavIC telemetry packet.
        Returns filtered tracking data and replanning opportunities if drift >= 10 minutes.
        """
        train_no = packet.train_number

        if train_no not in self._filters:
            self._filters[train_no] = KalmanPositionFilter(
                initial_km=packet.current_km_mark,
                initial_speed_kmh=packet.speed_kmh
            )

        smoothed = self._filters[train_no].update(
            measured_km=packet.current_km_mark,
            measured_speed_kmh=packet.speed_kmh
        )

        curr_km = smoothed["smoothed_km"]
        curr_speed = smoothed["smoothed_speed_kmh"]

        # Calculate estimated time of arrival (ETA) at destination boundary
        dist_remaining = max(0.0, destination_km - curr_km)
        effective_speed = max(15.0, curr_speed)  # min 15 km/h to prevent div-by-zero
        transit_minutes_remaining = (dist_remaining / effective_speed) * 60.0
        predicted_eta = packet.timestamp + timedelta(minutes=transit_minutes_remaining)

        # Compute arrival drift against timetabled schedule
        if timetabled_arrival is None:
            # Default timetable assumption: 130 km/h nominal traversal
            nominal_minutes = (dist_remaining / 130.0) * 60.0
            timetabled_arrival = packet.timestamp + timedelta(minutes=nominal_minutes)

        drift_seconds = (predicted_eta - timetabled_arrival).total_seconds()
        drift_minutes = round(drift_seconds / 60.0, 1)

        # Replanning trigger evaluation (V5-07 specification)
        drift_threshold_exceeded = drift_minutes >= self.DRIFT_ALERT_THRESHOLD_MINUTES
        replanning_opportunity = None

        if drift_threshold_exceeded:
            replanning_opportunity = {
                "opportunity_type": "VACATED_CORRIDOR_SLOT",
                "train_number": train_no,
                "section_id": packet.section_id,
                "drift_minutes": drift_minutes,
                "vacated_window_start": timetabled_arrival.isoformat(),
                "vacated_window_end": predicted_eta.isoformat(),
                "vacated_duration_minutes": drift_minutes,
                "trigger_hot_restart": True,
                "recommendation": (
                    f"Train {train_no} is delayed by {drift_minutes}m. "
                    f"Corridor {packet.section_id} capacity slot is vacated. "
                    f"Suitable for inserting urgent track or S&T possession."
                )
            }

        telemetry_record = {
            "train_number": train_no,
            "locomotive_number": packet.locomotive_number,
            "timestamp": packet.timestamp.isoformat(),
            "raw_km": packet.current_km_mark,
            "raw_speed_kmh": packet.speed_kmh,
            "kalman_smoothed_km": curr_km,
            "kalman_smoothed_speed_kmh": curr_speed,
            "destination_km": destination_km,
            "distance_remaining_km": round(dist_remaining, 2),
            "estimated_transit_minutes": round(transit_minutes_remaining, 1),
            "predicted_eta": predicted_eta.isoformat(),
            "timetabled_arrival": timetabled_arrival.isoformat(),
            "eta_drift_minutes": drift_minutes,
            "drift_threshold_exceeded": drift_threshold_exceeded,
            "replanning_opportunity": replanning_opportunity,
            "fix_quality": packet.gnss_fix_quality
        }

        self._latest_telemetry[train_no] = telemetry_record
        return telemetry_record

    def get_latest_telemetry(self, train_number: Optional[str] = None) -> Any:
        """Get latest cached telemetry for a train or all tracked trains."""
        if train_number:
            return self._latest_telemetry.get(train_number)
        return list(self._latest_telemetry.values())


# Global singleton instance for live ingestion
rtis_ingester = RTISStreamIngester()
