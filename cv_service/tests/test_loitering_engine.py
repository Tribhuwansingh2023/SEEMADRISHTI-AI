"""
SEEMADRISHTI AI — Unit Tests for Loitering Dwell Time & Radius Engine
Team: IQ100 | SIH Problem Statement: SIH26187
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from cv_service.behavior.loitering_tracker import LoiteringTracker


class TestLoiteringEngine(unittest.TestCase):
    def setUp(self):
        # 5 second threshold, 0.1 normalized radius
        self.tracker = LoiteringTracker(dwell_threshold_seconds=5.0, max_displacement_radius=0.10)

    def test_loitering_detection_on_dwelling(self):
        t0 = 1000.0
        # Track 1 appears at (0.5, 0.5)
        res1 = self.tracker.update_track("track-01", 0.50, 0.50, timestamp=t0)
        self.assertFalse(res1["is_loitering"])
        self.assertEqual(res1["dwell_seconds"], 0.0)

        # Track 1 after 3 seconds: minor jitter within radius
        res2 = self.tracker.update_track("track-01", 0.51, 0.52, timestamp=t0 + 3.0)
        self.assertFalse(res2["is_loitering"])
        self.assertEqual(res2["dwell_seconds"], 3.0)

        # Track 1 after 6 seconds: still near (0.5, 0.5) -> LOITERING ALARM
        res3 = self.tracker.update_track("track-01", 0.52, 0.51, timestamp=t0 + 6.0)
        self.assertTrue(res3["is_loitering"])
        self.assertEqual(res3["dwell_seconds"], 6.0)
        self.assertTrue(res3["alert_triggered"])

    def test_moving_track_does_not_trigger_loiter(self):
        t0 = 1000.0
        # Track 2 moves across frame continuously
        self.tracker.update_track("track-02", 0.10, 0.10, timestamp=t0)
        self.tracker.update_track("track-02", 0.30, 0.30, timestamp=t0 + 3.0)
        res = self.tracker.update_track("track-02", 0.70, 0.70, timestamp=t0 + 6.0)
        # Dwell is 6s but displacement > 0.10, so not loitering
        self.assertFalse(res["is_loitering"])

    def test_stale_track_purging(self):
        t0 = 1000.0
        self.tracker.update_track("track-03", 0.4, 0.4, timestamp=t0)
        self.assertIn("track-03", self.tracker.tracks)

        # After 10s of absence, should be purged
        purged = self.tracker.purge_stale_tracks(timeout_seconds=5.0, current_time=t0 + 10.0)
        self.assertEqual(purged, 1)
        self.assertNotIn("track-03", self.tracker.tracks)


if __name__ == "__main__":
    unittest.main()
