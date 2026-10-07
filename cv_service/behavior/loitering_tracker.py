"""
SEEMADRISHTI AI — Geospatial Loitering Dwell Time & Radius Tracker
Team: IQ100 | SIH Problem Statement: SIH26187
"""

import time
from typing import Dict, List, Optional, Tuple, Any
import math


class LoiteringTracker:
    """Tracks centroid movements across frames to calculate dwell duration and displacement."""

    def __init__(self, dwell_threshold_seconds: float = 10.0, max_displacement_radius: float = 0.08):
        self.dwell_threshold = dwell_threshold_seconds
        self.max_displacement = max_displacement_radius
        # Map: track_id -> { "start_time": float, "last_seen": float, "initial_pos": (x,y), "current_pos": (x,y) }
        self.tracks: Dict[str, Dict[str, Any]] = {}

    def update_track(self, track_id: str, nx: float, ny: float, timestamp: Optional[float] = None) -> Dict[str, Any]:
        """
        Updates tracking point with normalized coordinates (nx, ny in range [0.0, 1.0]).
        Returns analysis status: is_loitering, dwell_duration, displacement.
        """
        now = timestamp if timestamp is not None else time.time()

        if track_id not in self.tracks:
            self.tracks[track_id] = {
                "start_time": now,
                "last_seen": now,
                "initial_pos": (nx, ny),
                "current_pos": (nx, ny),
                "alert_triggered": False,
            }
            return {
                "track_id": track_id,
                "is_loitering": False,
                "dwell_seconds": 0.0,
                "displacement": 0.0,
            }

        rec = self.tracks[track_id]
        rec["last_seen"] = now
        rec["current_pos"] = (nx, ny)

        dwell = now - rec["start_time"]
        init_x, init_y = rec["initial_pos"]
        displacement = math.sqrt((nx - init_x) ** 2 + (ny - init_y) ** 2)

        is_loitering = dwell >= self.dwell_threshold and displacement <= self.max_displacement

        if is_loitering:
            rec["alert_triggered"] = True

        return {
            "track_id": track_id,
            "is_loitering": is_loitering,
            "dwell_seconds": round(dwell, 2),
            "displacement": round(displacement, 4),
            "alert_triggered": rec["alert_triggered"],
        }

    def purge_stale_tracks(self, timeout_seconds: float = 5.0, current_time: Optional[float] = None) -> int:
        """Removes tracks that have not been observed recently."""
        now = current_time if current_time is not None else time.time()
        stale_ids = [
            tid for tid, rec in self.tracks.items()
            if now - rec["last_seen"] > timeout_seconds
        ]
        for tid in stale_ids:
            del self.tracks[tid]
        return len(stale_ids)
