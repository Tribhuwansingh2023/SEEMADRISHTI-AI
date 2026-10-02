import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import datetime
import time
from types import SimpleNamespace
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
import torch
from ultralytics.trackers.byte_tracker import BYTETracker

from cv_service.config import CVConfig
from cv_service.detection.yolo_detector import YoloDetector


class TrackLifecycleRecord:
    """
    Internal tracker lifecycle record with velocity estimation,
    Kalman-style position extrapolation, and anti-flicker persistence.
    """
    def __init__(self, track_id: int, class_id: int, class_name: str, bbox: Dict[str, Any], confidence: float = 0.9):
        self.track_id = track_id
        self.class_id = class_id
        self.class_name = class_name
        self.category = YoloDetector.get_category_for_class(class_name)
        self.age = 1  # Total frames since creation
        self.hits = 1  # Total times confirmed by detector
        self.time_since_update = 0  # Consecutive frames since last detection
        self.state = "ACTIVE"  # ACTIVE -> LOST_PREDICTED -> REMOVED
        self.last_bbox: Dict[str, Any] = dict(bbox)
        self.confidence = confidence
        self.vx = 0.0  # Pixels per frame
        self.vy = 0.0

        cx = (bbox["x1"] + bbox["x2"]) // 2
        cy = (bbox["y1"] + bbox["y2"]) // 2
        self.history: List[Dict[str, int]] = [{"cx": cx, "cy": cy}]

    def mark_detected(self, bbox: Dict[str, Any], confidence: float = 0.9):
        self.hits += 1
        self.time_since_update = 0
        self.age += 1
        self.state = "ACTIVE"

        cx = (bbox["x1"] + bbox["x2"]) // 2
        cy = (bbox["y1"] + bbox["y2"]) // 2

        if self.history:
            prev_cx = self.history[-1]["cx"]
            prev_cy = self.history[-1]["cy"]
            dx = cx - prev_cx
            dy = cy - prev_cy
            self.vx = 0.7 * self.vx + 0.3 * dx
            self.vy = 0.7 * self.vy + 0.3 * dy

        self.last_bbox = dict(bbox)
        self.confidence = confidence
        self.history.append({"cx": cx, "cy": cy})
        if len(self.history) > 30:
            self.history.pop(0)

    def mark_missed(self, max_lost_frames: int, max_buffer: int, frame_w: int, frame_h: int) -> bool:
        """
        Extrapolates position if within max_lost_frames tolerance to prevent visual flicker.
        Returns True if the track remains renderable as a predicted track.
        """
        self.time_since_update += 1
        self.age += 1

        if self.time_since_update <= max_lost_frames and self.hits >= 2:
            self.state = "LOST_PREDICTED"
            # Extrapolate gently using estimated velocity
            new_x1 = max(0, min(frame_w, int(self.last_bbox["x1"] + self.vx * 0.5)))
            new_y1 = max(0, min(frame_h, int(self.last_bbox["y1"] + self.vy * 0.5)))
            new_x2 = max(0, min(frame_w, int(self.last_bbox["x2"] + self.vx * 0.5)))
            new_y2 = max(0, min(frame_h, int(self.last_bbox["y2"] + self.vy * 0.5)))

            if new_x2 > new_x1 and new_y2 > new_y1:
                nx1 = round(new_x1 / frame_w, 4) if frame_w > 0 else 0.0
                ny1 = round(new_y1 / frame_h, 4) if frame_h > 0 else 0.0
                nx2 = round(new_x2 / frame_w, 4) if frame_w > 0 else 0.0
                ny2 = round(new_y2 / frame_h, 4) if frame_h > 0 else 0.0
                self.last_bbox = {
                    "x1": new_x1, "y1": new_y1, "x2": new_x2, "y2": new_y2,
                    "nx1": nx1, "ny1": ny1, "nx2": nx2, "ny2": ny2,
                    "w": new_x2 - new_x1, "h": new_y2 - new_y1,
                    "nw": round(nx2 - nx1, 4), "nh": round(ny2 - ny1, 4),
                }

            self.confidence = round(max(0.20, self.confidence * 0.95), 3)
            return True

        if self.time_since_update > max_buffer:
            self.state = "REMOVED"
        else:
            self.state = "LOST"
        return False


class ByteTrackEngine:
    """
    High-accuracy Multi-Object Tracking engine with:
    - Dedicated per-camera isolated BYTETracker instances (zero cross-camera corruption)
    - True Kalman-filter motion state estimation
    - Anti-flicker temporal persistence across brief occlusions
    - Cumulative unique object counters (People seen, Vehicles seen)
    - Scale-invariant normalized coordinates
    - Class-consistent track locking
    """

    def __init__(self, config: Optional[CVConfig] = None, detector: Optional[YoloDetector] = None):
        self.config = config or CVConfig()
        self.detector = detector
        self.camera_trackers: Dict[str, BYTETracker] = {}
        self.active_tracks: Dict[str, Dict[int, TrackLifecycleRecord]] = {}  # cam_id -> {track_id: record}

        # Cumulative session trackers (Requirement 20)
        self.observed_session_track_ids: Set[int] = set()
        self.session_unique_persons: Set[int] = set()
        self.session_unique_vehicles: Set[int] = set()
        self.session_unique_objects: Set[int] = set()

        self._total_tracking_time_ms = 0.0
        self._total_track_calls = 0
        self._is_initialized = False

    def initialize(self) -> bool:
        """Initialize tracker resources and ensure YOLO detector is loaded."""
        if self.detector is None:
            self.detector = YoloDetector(self.config)
            self.detector.load_model()
        elif not self.detector.is_loaded:
            self.detector.load_model()

        self._is_initialized = True
        print(f"[ByteTrackEngine] Initialized ByteTrack (buffer: {self.config.track_buffer} frames, anti-flicker tolerance: {getattr(self.config, 'max_lost_frames', 5)} frames)")
        return True

    def _get_or_create_camera_tracker(self, camera_id: str) -> BYTETracker:
        """Ensures each camera has an independent BYTETracker to eliminate ID switching & crosstalk."""
        cam_key = str(camera_id).lower().strip()
        if cam_key not in self.camera_trackers:
            tracker_args = SimpleNamespace(
                track_high_thresh=getattr(self.config, "track_high_conf", 0.30),
                track_low_thresh=getattr(self.config, "track_low_conf", 0.10),
                new_track_thresh=getattr(self.config, "track_high_conf", 0.30),
                track_buffer=getattr(self.config, "track_buffer", 30),
                match_thresh=getattr(self.config, "match_threshold", 0.8),
                fuse_score=True,
            )
            self.camera_trackers[cam_key] = BYTETracker(tracker_args)
            self.active_tracks[cam_key] = {}
        return self.camera_trackers[cam_key]

    def track(
        self,
        frame: np.ndarray,
        camera_id: Optional[str] = None,
        frame_id: Optional[int] = None,
        timestamp: Optional[float] = None,
        conf_override: Optional[float] = None,
        iou_override: Optional[float] = None,
        imgsz_override: Optional[int] = None,
        max_lost_override: Optional[int] = None,
        filter_surveillance_only: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes YOLO inference followed by dedicated per-camera ByteTrack association.
        """
        if not self._is_initialized:
            self.initialize()

        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
            raise ValueError("[ByteTrackEngine] Invalid or empty frame provided for tracking.")

        h, w = frame.shape[:2]
        cam_id = (camera_id or self.config.camera_id).lower().strip()
        timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        effective_conf = conf_override if conf_override is not None else self.config.confidence_threshold
        effective_iou = iou_override if iou_override is not None else getattr(self.config, "iou_threshold", 0.45)
        effective_imgsz = imgsz_override if imgsz_override is not None else self.config.input_size
        max_lost = max_lost_override if max_lost_override is not None else getattr(self.config, "max_lost_frames", 5)

        # Step 1: Run YOLO detection on the frame
        t_det_start = time.perf_counter()
        predict_args = {
            "source": frame,
            "imgsz": effective_imgsz,
            "conf": effective_conf,
            "iou": effective_iou,
            "device": self.detector.device,
            "verbose": False,
        }
        if self.detector.half:
            predict_args["half"] = True

        with torch.inference_mode():
            results = self.detector.model.predict(**predict_args)
        inference_time_ms = round((time.perf_counter() - t_det_start) * 1000, 2)

        # Speed metrics from Ultralytics
        speed_dict = getattr(results[0], "speed", {}) if results else {}
        preprocess_ms = round(speed_dict.get("preprocess", 1.0), 2)
        raw_inference_ms = round(speed_dict.get("inference", inference_time_ms), 2)
        postprocess_ms = round(speed_dict.get("postprocess", 1.0), 2)

        # Step 2: Extract raw detections
        raw_detections: List[Dict[str, Any]] = []
        if results and len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
            boxes = results[0].boxes
            xyxy_raw = boxes.xyxy.cpu().numpy()
            conf_raw = boxes.conf.cpu().numpy()
            cls_raw = boxes.cls.cpu().numpy().astype(int)

            for i in range(len(boxes)):
                c_id = int(cls_raw[i])
                c_conf = round(float(conf_raw[i]), 4)
                c_name = self.detector.model_classes.get(c_id, f"class_{c_id}")

                if filter_surveillance_only and not YoloDetector.is_surveillance_relevant(c_name):
                    continue

                rx1 = max(0, min(w, int(xyxy_raw[i][0])))
                ry1 = max(0, min(h, int(xyxy_raw[i][1])))
                rx2 = max(0, min(w, int(xyxy_raw[i][2])))
                ry2 = max(0, min(h, int(xyxy_raw[i][3])))

                r_nx1 = round(rx1 / w, 4) if w > 0 else 0.0
                r_ny1 = round(ry1 / h, 4) if h > 0 else 0.0
                r_nx2 = round(rx2 / w, 4) if w > 0 else 0.0
                r_ny2 = round(ry2 / h, 4) if h > 0 else 0.0

                raw_detections.append({
                    "class_name": c_name,
                    "class": c_name,
                    "class_id": c_id,
                    "category": YoloDetector.get_category_for_class(c_name),
                    "confidence": c_conf,
                    "bbox": {
                        "x1": rx1, "y1": ry1, "x2": rx2, "y2": ry2,
                        "nx1": r_nx1, "ny1": r_ny1, "nx2": r_nx2, "ny2": r_ny2,
                        "w": rx2 - rx1, "h": ry2 - ry1,
                        "nw": round(r_nx2 - r_nx1, 4), "nh": round(r_ny2 - r_ny1, 4),
                    },
                })

        # Step 3: Run isolated ByteTrack update for this specific camera
        t_track_start = time.perf_counter()
        byte_tracker = self._get_or_create_camera_tracker(cam_id)
        cam_active = self.active_tracks[cam_id]

        tracks: List[Dict[str, Any]] = []
        observed_track_ids: Set[int] = set()

        if results and len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
            track_rows = byte_tracker.update(results[0].boxes)
            # track_rows format: [x1, y1, x2, y2, track_id, conf, cls_id, idx]
            if len(track_rows) > 0:
                for row in track_rows:
                    x1 = max(0, min(w, int(row[0])))
                    y1 = max(0, min(h, int(row[1])))
                    x2 = max(0, min(w, int(row[2])))
                    y2 = max(0, min(h, int(row[3])))

                    track_id = int(row[4])
                    conf_val = round(float(row[5]), 4)
                    cls_id = int(row[6])

                    class_name = self.detector.model_classes.get(cls_id, f"class_{cls_id}")

                    # Filter out non-surveillance classes
                    if filter_surveillance_only and not YoloDetector.is_surveillance_relevant(class_name):
                        continue

                    nx1 = round(x1 / w, 4) if w > 0 else 0.0
                    ny1 = round(y1 / h, 4) if h > 0 else 0.0
                    nx2 = round(x2 / w, 4) if w > 0 else 0.0
                    ny2 = round(y2 / h, 4) if h > 0 else 0.0

                    bbox_dict = {
                        "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "nx1": nx1, "ny1": ny1, "nx2": nx2, "ny2": ny2,
                        "w": x2 - x1, "h": y2 - y1,
                        "nw": round(nx2 - nx1, 4), "nh": round(ny2 - ny1, 4),
                    }
                    category = YoloDetector.get_category_for_class(class_name)

                    if track_id in cam_active:
                        rec = cam_active[track_id]
                        rec.mark_detected(bbox_dict, conf_val)
                    else:
                        rec = TrackLifecycleRecord(track_id, cls_id, class_name, bbox_dict, conf_val)
                        cam_active[track_id] = rec

                    observed_track_ids.add(track_id)
                    self.observed_session_track_ids.add(track_id)

                    if category == "HUMAN":
                        self.session_unique_persons.add(track_id)
                    elif category == "VEHICLE":
                        self.session_unique_vehicles.add(track_id)
                    else:
                        self.session_unique_objects.add(track_id)

                    cx = (x1 + x2) / 2.0
                    cy = (y1 + y2) / 2.0

                    tracks.append({
                        "track_id": track_id,
                        "class_name": class_name,
                        "class": class_name,
                        "class_id": cls_id,
                        "category": category,
                        "confidence": conf_val,
                        "state": "ACTIVE",
                        "bbox": bbox_dict,
                        "centroid": (cx, cy),
                        "vx": round(rec.vx, 2),
                        "vy": round(rec.vy, 2),
                        "nvx": round(rec.vx / w, 5) if w > 0 else 0.0,
                        "nvy": round(rec.vy / h, 5) if h > 0 else 0.0,
                        "frame_id": frame_id,
                        "is_predicted": False,
                        "trajectory": [{"x": p["cx"], "y": p["cy"]} for p in rec.history],
                    })

        # Step 4: Handle lost tracks with anti-flicker temporal persistence
        for tid in list(cam_active.keys()):
            if tid not in observed_track_ids:
                rec = cam_active[tid]
                keep_rendered = rec.mark_missed(max_lost, self.config.track_buffer, w, h)

                if keep_rendered and rec.hits >= 2:
                    p_box = rec.last_bbox
                    cx = (p_box["x1"] + p_box["x2"]) / 2.0
                    cy = (p_box["y1"] + p_box["y2"]) / 2.0

                    tracks.append({
                        "track_id": tid,
                        "class_name": rec.class_name,
                        "class": rec.class_name,
                        "class_id": rec.class_id,
                        "category": rec.category,
                        "confidence": rec.confidence,
                        "state": "LOST_PREDICTED",
                        "bbox": p_box,
                        "centroid": (cx, cy),
                        "vx": round(rec.vx, 2),
                        "vy": round(rec.vy, 2),
                        "nvx": round(rec.vx / w, 5) if w > 0 else 0.0,
                        "nvy": round(rec.vy / h, 5) if h > 0 else 0.0,
                        "frame_id": frame_id,
                        "is_predicted": True,
                        "trajectory": [{"x": p["cx"], "y": p["cy"]} for p in rec.history],
                    })
                elif rec.state == "REMOVED":
                    del cam_active[tid]

        tracking_time_ms = round((time.perf_counter() - t_track_start) * 1000, 2)
        self._total_tracking_time_ms += tracking_time_ms
        self._total_track_calls += 1
        total_latency_ms = round(inference_time_ms + tracking_time_ms, 2)

        return {
            "camera_id": cam_id,
            "frame_id": frame_id,
            "timestamp": timestamp_str,
            "source_timestamp": timestamp,
            "frame_width": w,
            "frame_height": h,
            "preprocess_ms": preprocess_ms,
            "inference_ms": raw_inference_ms,
            "postprocess_ms": postprocess_ms,
            "tracking_ms": tracking_time_ms,
            "total_ms": total_latency_ms,
            "detection_count": len(raw_detections),
            "detections": raw_detections,
            "active_count": len(tracks),
            "track_count": len(tracks),
            "unique_session_count": len(self.observed_session_track_ids),
            "cumulative_counts": {
                "total_seen": len(self.observed_session_track_ids),
                "persons_seen": len(self.session_unique_persons),
                "vehicles_seen": len(self.session_unique_vehicles),
                "objects_seen": len(self.session_unique_objects),
            },
            "tracks": tracks,
            "device": self.detector.device.upper(),
            "device_name": self.detector.device_name,
            "half_precision": self.detector.half,
            "precision": self.detector.precision,
            "model_name": self.detector.config.model_name,
            "imgsz": effective_imgsz,
            "conf_threshold": effective_conf,
            "iou_threshold": effective_iou,
        }

    def get_average_tracking_latency_ms(self) -> float:
        if self._total_track_calls == 0:
            return 0.0
        return round(self._total_tracking_time_ms / self._total_track_calls, 2)

    def reset(self, camera_id: Optional[str] = None):
        """Reset active track states and internal tracker memory upon video loop."""
        if camera_id:
            cam_key = str(camera_id).lower().strip()
            self.camera_trackers.pop(cam_key, None)
            self.active_tracks.pop(cam_key, None)
        else:
            self.camera_trackers.clear()
            self.active_tracks.clear()
            self.observed_session_track_ids.clear()
            self.session_unique_persons.clear()
            self.session_unique_vehicles.clear()
            self.session_unique_objects.clear()

# Alias for backwards compatibility
ByteTracker = ByteTrackEngine
