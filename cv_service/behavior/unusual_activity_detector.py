"""
SEEMADRISHTI AI — Surveillance Behavioral & Unusual Activity Detection Engine
Team: IQ100 | SIH Problem Statement: SIH26187

Identifies surveillance-relevant operational events with neutral, professional security labels:
1. RESTRICTED AREA INTRUSION: Tracked person or vehicle entering configured ROI
2. UNUSUAL LOITERING: Person dwelling in a localized perimeter for an extended period (> 8s)
3. UNUSUAL CROWD ACTIVITY: Multiple people gathering (>= 4) in proximity or restricted sector
4. VEHICLE STOPPED: Vehicle remaining stationary / stopped in active corridor (> 8s)
5. UNUSUAL MOVEMENT: Sudden running, rapid acceleration, or erratic trajectory shift
"""

import os
import time
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict

from cv_service.geometry.polygon import PolygonZone, calculate_centroid


@dataclass
class UnusualActivityEvent:
    event_id: str
    event_type: str
    severity: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    camera_id: str
    track_id: int
    object_label: str  # 'Person #01', 'Vehicle #02'
    confidence: float
    timestamp: str
    details: str
    snapshot_path: Optional[str] = None
    bbox: Optional[Dict[str, int]] = None
    position: Optional[Dict[str, float]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TrackActivityHistory:
    """State record for a tracked entity across consecutive frames."""

    def __init__(self, track_id: int, class_name: str, category: str, initial_pos: Tuple[float, float], timestamp: float):
        self.track_id = track_id
        self.class_name = class_name.lower().strip()
        self.category = category.upper()  # 'HUMAN', 'VEHICLE', 'OBJECT'
        self.first_seen = timestamp
        self.last_seen = timestamp
        self.positions: List[Tuple[float, float, float]] = [(initial_pos[0], initial_pos[1], timestamp)]  # (x, y, t)
        self.speeds: List[float] = []
        self.is_inside_restricted = False
        self.loitering_alerted = False
        self.intrusion_alerted = False
        self.stopped_alerted = False
        self.speed_spike_alerted = False
        self.anchor_pos = initial_pos

    def update(self, pos: Tuple[float, float], timestamp: float):
        self.last_seen = timestamp
        prev_x, prev_y, prev_t = self.positions[-1]
        dt = max(0.001, timestamp - prev_t)
        dist = math.hypot(pos[0] - prev_x, pos[1] - prev_y)
        speed = dist / dt  # pixels per second

        self.speeds.append(speed)
        if len(self.speeds) > 20:
            self.speeds.pop(0)

        self.positions.append((pos[0], pos[1], timestamp))
        if len(self.positions) > 60:
            self.positions.pop(0)

        # Update anchor position if significant deliberate movement occurred
        anchor_dist = math.hypot(pos[0] - self.anchor_pos[0], pos[1] - self.anchor_pos[1])
        if anchor_dist > 65:  # Drifted outside localized loitering perimeter
            self.anchor_pos = pos


class UnusualActivityDetector:
    """
    Evaluates tracking trajectories, spatial geofences, and dwell dynamics to detect
    suspicious or unusual events without assigning bias or criminal labels.
    """

    def __init__(
        self,
        loitering_threshold_sec: float = 8.0,
        vehicle_stopped_threshold_sec: float = 7.0,
        running_speed_threshold_px_s: float = 220.0,
        crowd_gathering_threshold: int = 4,
    ):
        self.loitering_threshold_sec = loitering_threshold_sec
        self.vehicle_stopped_threshold_sec = vehicle_stopped_threshold_sec
        self.running_speed_threshold_px_s = running_speed_threshold_px_s
        self.crowd_gathering_threshold = crowd_gathering_threshold
        self.tracks: Dict[int, TrackActivityHistory] = {}
        self.restricted_zones: Dict[str, PolygonZone] = {}
        self.last_crowd_alert_time = 0.0

    def set_restricted_zone(self, camera_id: str, zone_name: str, polygon_points: List[Tuple[float, float]]) -> None:
        """Configures or updates a restricted region of interest (ROI)."""
        key = camera_id.lower().strip()
        if len(polygon_points) >= 3:
            self.restricted_zones[key] = PolygonZone(
                zone_id=f"zone-{key}",
                name=zone_name,
                points=polygon_points,
                camera_id=key,
            )
            print(f"[ActivityDetector] Configured restricted zone '{zone_name}' ({len(polygon_points)} vertices) for camera {key}")

    def evaluate_frame(
        self,
        camera_id: str,
        tracks: List[Dict[str, Any]],
        frame_width: int,
        frame_height: int,
        timestamp: Optional[float] = None,
    ) -> List[UnusualActivityEvent]:
        """
        Processes active tracks and generates events for:
        - RESTRICTED AREA INTRUSION
        - UNUSUAL LOITERING
        - UNUSUAL CROWD ACTIVITY
        - VEHICLE STOPPED
        - UNUSUAL MOVEMENT
        """
        now = timestamp or time.time()
        time_str = time.strftime("%H:%M:%S")
        events: List[UnusualActivityEvent] = []
        cam_id = camera_id.lower().strip()

        # Prune dead tracks older than 10 seconds
        active_tids = {t.get("track_id") for t in tracks if t.get("track_id") is not None}
        dead_tids = [tid for tid, rec in self.tracks.items() if (now - rec.last_seen) > 10.0 and tid not in active_tids]
        for tid in dead_tids:
            del self.tracks[tid]

        current_people_positions: List[Tuple[float, float, int]] = []
        restricted_zone = self.restricted_zones.get(cam_id)

        for trk in tracks:
            tid = trk.get("track_id")
            if tid is None:
                continue

            c_name = trk.get("class_name", "person").lower()
            cat = trk.get("category", "HUMAN").upper()
            conf = float(trk.get("confidence", 0.90))
            bbox = trk.get("bbox", {})

            # Centroid calculation
            if "x1" in bbox:
                cx = (bbox["x1"] + bbox["x2"]) / 2.0
                cy = (bbox["y1"] + bbox["y2"]) / 2.0
            else:
                cx, cy = 0.0, 0.0

            # Normalize centroid to 0-1 scale if raw pixels
            norm_cx = cx / frame_width if frame_width > 0 and cx > 1.0 else cx
            norm_cy = cy / frame_height if frame_height > 0 and cy > 1.0 else cy

            if tid not in self.tracks:
                self.tracks[tid] = TrackActivityHistory(tid, c_name, cat, (cx, cy), now)
            else:
                self.tracks[tid].update((cx, cy), now)

            rec = self.tracks[tid]
            is_human = cat == "HUMAN" or c_name in ("person", "pedestrian")
            is_vehicle = cat == "VEHICLE" or c_name in ("car", "truck", "bus", "motorcycle", "van", "bicycle")

            obj_label = f"Person #{tid:02d}" if is_human else f"Vehicle #{tid:02d}"

            if is_human:
                current_people_positions.append((cx, cy, tid))

            # 1. RESTRICTED AREA INTRUSION EVALUATION
            if restricted_zone:
                # Check point in polygon
                is_inside = restricted_zone.contains_point((norm_cx, norm_cy))
                if is_inside and not rec.intrusion_alerted:
                    rec.intrusion_alerted = True
                    rec.is_inside_restricted = True
                    events.append(
                        UnusualActivityEvent(
                            event_id=f"EV-INTRUSION-{cam_id}-{tid}-{int(now)}",
                            event_type="RESTRICTED AREA INTRUSION",
                            severity="HIGH" if is_human else "CRITICAL",
                            camera_id=camera_id,
                            track_id=tid,
                            object_label=obj_label,
                            confidence=round(conf, 2),
                            timestamp=time_str,
                            details=f"{obj_label} entered {restricted_zone.name} without clearance",
                            bbox=bbox,
                            position={"x": round(cx, 1), "y": round(cy, 1)},
                        )
                    )
                elif not is_inside:
                    rec.intrusion_alerted = False
                    rec.is_inside_restricted = False

            # 2. UNUSUAL LOITERING EVALUATION (HUMANS)
            if is_human and not rec.loitering_alerted:
                dwell_duration = now - rec.first_seen
                drift_from_anchor = math.hypot(cx - rec.anchor_pos[0], cy - rec.anchor_pos[1])
                if dwell_duration >= self.loitering_threshold_sec and drift_from_anchor < 80.0:
                    rec.loitering_alerted = True
                    events.append(
                        UnusualActivityEvent(
                            event_id=f"EV-LOITER-{cam_id}-{tid}-{int(now)}",
                            event_type="UNUSUAL LOITERING",
                            severity="MEDIUM",
                            camera_id=camera_id,
                            track_id=tid,
                            object_label=obj_label,
                            confidence=0.88,
                            timestamp=time_str,
                            details=f"{obj_label} observed dwelling in perimeter sector for {dwell_duration:.1f}s",
                            bbox=bbox,
                            position={"x": round(cx, 1), "y": round(cy, 1)},
                        )
                    )

            # 3. VEHICLE STOPPED EVALUATION (VEHICLES)
            if is_vehicle and not rec.stopped_alerted:
                dwell_duration = now - rec.first_seen
                avg_speed = (sum(rec.speeds) / len(rec.speeds)) if rec.speeds else 0.0
                drift_from_anchor = math.hypot(cx - rec.anchor_pos[0], cy - rec.anchor_pos[1])
                if dwell_duration >= self.vehicle_stopped_threshold_sec and avg_speed < 15.0 and drift_from_anchor < 50.0:
                    rec.stopped_alerted = True
                    events.append(
                        UnusualActivityEvent(
                            event_id=f"EV-STOPPED-{cam_id}-{tid}-{int(now)}",
                            event_type="VEHICLE STOPPED",
                            severity="MEDIUM",
                            camera_id=camera_id,
                            track_id=tid,
                            object_label=obj_label,
                            confidence=0.91,
                            timestamp=time_str,
                            details=f"{obj_label} ({c_name.upper()}) stationary in access corridor for {dwell_duration:.1f}s",
                            bbox=bbox,
                            position={"x": round(cx, 1), "y": round(cy, 1)},
                        )
                    )

            # 4. UNUSUAL MOVEMENT (SUDDEN RUNNING / SPEED SPIKE)
            if is_human and not rec.speed_spike_alerted and len(rec.speeds) >= 3:
                recent_speed = rec.speeds[-1]
                if recent_speed > self.running_speed_threshold_px_s:
                    rec.speed_spike_alerted = True
                    events.append(
                        UnusualActivityEvent(
                            event_id=f"EV-RUN-{cam_id}-{tid}-{int(now)}",
                            event_type="UNUSUAL MOVEMENT",
                            severity="MEDIUM",
                            camera_id=camera_id,
                            track_id=tid,
                            object_label=obj_label,
                            confidence=0.85,
                            timestamp=time_str,
                            details=f"{obj_label} exhibiting sudden high-velocity movement ({recent_speed:.1f} px/s)",
                            bbox=bbox,
                            position={"x": round(cx, 1), "y": round(cy, 1)},
                        )
                    )

        # 5. UNUSUAL CROWD ACTIVITY EVALUATION
        # Check if >= 4 people form a close cluster
        if len(current_people_positions) >= self.crowd_gathering_threshold:
            if (now - self.last_crowd_alert_time) > 15.0:  # 15s cooldown
                # Calculate pairwise distances
                cluster_count = 0
                centroid_x, centroid_y = 0.0, 0.0
                for i in range(len(current_people_positions)):
                    x1, y1, _ = current_people_positions[i]
                    close_neighbors = 0
                    for j in range(len(current_people_positions)):
                        if i == j:
                            continue
                        x2, y2, _ = current_people_positions[j]
                        if math.hypot(x1 - x2, y1 - y2) < 180.0:  # Cluster proximity
                            close_neighbors += 1
                    if close_neighbors >= (self.crowd_gathering_threshold - 1):
                        cluster_count += 1
                        centroid_x += x1
                        centroid_y += y1

                if cluster_count >= self.crowd_gathering_threshold:
                    self.last_crowd_alert_time = now
                    avg_x = centroid_x / cluster_count
                    avg_y = centroid_y / cluster_count
                    events.append(
                        UnusualActivityEvent(
                            event_id=f"EV-CROWD-{cam_id}-{int(now)}",
                            event_type="UNUSUAL CROWD ACTIVITY",
                            severity="MEDIUM",
                            camera_id=camera_id,
                            track_id=0,
                            object_label=f"Crowd ({cluster_count} Persons)",
                            confidence=0.89,
                            timestamp=time_str,
                            details=f"Unusual crowd density observed: {cluster_count} people gathered in close proximity",
                            position={"x": round(avg_x, 1), "y": round(avg_y, 1)},
                        )
                    )

        return events
