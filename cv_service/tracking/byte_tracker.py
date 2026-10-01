import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import datetime
import time
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
import torch
from cv_service.config import CVConfig
from cv_service.detection.yolo_detector import YoloDetector

class TrackLifecycleRecord:
    """
    Internal tracker lifecycle record with velocity estimation,
    Kalman-style position extrapolation, and anti-flicker persistence.
    """
    def __init__(self, track_id: int, class_id: int, class_name: str, bbox: Dict[str, int], confidence: float = 0.9):
        self.track_id = track_id
        self.class_id = class_id
        self.class_name = class_name
        self.category = YoloDetector.get_category_for_class(class_name)
        self.age = 1  # Total frames since creation
        self.hits = 1  # Total times confirmed by detector
        self.time_since_update = 0  # Consecutive frames since last detection
        self.state = "NEW"  # NEW -> ACTIVE -> LOST_PREDICTED -> REMOVED
        self.last_bbox: Dict[str, int] = dict(bbox)
        self.confidence = confidence
        self.vx = 0.0  # Pixels per frame
        self.vy = 0.0

        cx = (bbox["x1"] + bbox["x2"]) // 2
        cy = (bbox["y1"] + bbox["y2"]) // 2
        self.history: List[Dict[str, int]] = [{"cx": cx, "cy": cy}]

    def mark_detected(self, bbox: Dict[str, int], confidence: float = 0.9):
        self.hits += 1
        self.time_since_update = 0
        self.age += 1
        if self.hits >= 2:
            self.state = "ACTIVE"

        cx = (bbox["x1"] + bbox["x2"]) // 2
        cy = (bbox["y1"] + bbox["y2"]) // 2

        if self.history:
            prev_cx = self.history[-1]["cx"]
            prev_cy = self.history[-1]["cy"]
            # Exponential moving average velocity
            dx = cx - prev_cx
            dy = cy - prev_cy
            self.vx = 0.6 * self.vx + 0.4 * dx
            self.vy = 0.6 * self.vy + 0.4 * dy

        # Bounding box smoothing (suppresses pixel trembling while preserving agile motion)
        if self.last_bbox and self.hits > 1:
            alpha = 0.82
            smooth_x1 = int(round(alpha * bbox["x1"] + (1 - alpha) * self.last_bbox["x1"]))
            smooth_y1 = int(round(alpha * bbox["y1"] + (1 - alpha) * self.last_bbox["y1"]))
            smooth_x2 = int(round(alpha * bbox["x2"] + (1 - alpha) * self.last_bbox["x2"]))
            smooth_y2 = int(round(alpha * bbox["y2"] + (1 - alpha) * self.last_bbox["y2"]))
            self.last_bbox = {"x1": smooth_x1, "y1": smooth_y1, "x2": smooth_x2, "y2": smooth_y2}
        else:
            self.last_bbox = dict(bbox)

        self.confidence = confidence
        self.history.append({"cx": cx, "cy": cy})
        if len(self.history) > 40:
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
            # Extrapolate bounding box using estimated velocity
            new_x1 = max(0, min(frame_w, int(self.last_bbox["x1"] + self.vx)))
            new_y1 = max(0, min(frame_h, int(self.last_bbox["y1"] + self.vy)))
            new_x2 = max(0, min(frame_w, int(self.last_bbox["x2"] + self.vx)))
            new_y2 = max(0, min(frame_h, int(self.last_bbox["y2"] + self.vy)))

            # Prevent box inversion or zero size
            if new_x2 > new_x1 and new_y2 > new_y1:
                self.last_bbox = {"x1": new_x1, "y1": new_y1, "x2": new_x2, "y2": new_y2}

            # Decay confidence slightly over missed frames
            self.confidence = round(max(0.20, self.confidence * 0.94), 3)

            cx = (self.last_bbox["x1"] + self.last_bbox["x2"]) // 2
            cy = (self.last_bbox["y1"] + self.last_bbox["y2"]) // 2
            self.history.append({"cx": cx, "cy": cy})
            if len(self.history) > 40:
                self.history.pop(0)
            return True

        if self.time_since_update > max_buffer:
            self.state = "REMOVED"
        else:
            self.state = "LOST"
        return False


class ByteTrackEngine:
    """
    High-accuracy Multi-Object Tracking engine with:
    - ByteTrack identity preservation
    - Temporal anti-flicker trajectory smoothing
    - Cumulative unique object counters (People seen, Vehicles seen)
    - Scale-invariant normalized coordinates
    - Class-consistent track locking
    """

    def __init__(self, config: Optional[CVConfig] = None, detector: Optional[YoloDetector] = None):
        self.config = config or CVConfig()
        self.detector = detector
        self.active_tracks: Dict[int, TrackLifecycleRecord] = {}
        
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
    ) -> Dict[str, Any]:
        """
        Executes YOLO detection followed by ByteTrack association with anti-flicker persistence.
        """
        if not self._is_initialized:
            self.initialize()

        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
            raise ValueError("[ByteTrackEngine] Invalid or empty frame provided for tracking.")

        h, w = frame.shape[:2]
        cam_id = camera_id or self.config.camera_id
        timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        effective_conf = conf_override if conf_override is not None else self.config.confidence_threshold
        effective_iou = iou_override if iou_override is not None else getattr(self.config, "iou_threshold", 0.45)
        effective_imgsz = imgsz_override if imgsz_override is not None else self.config.input_size
        max_lost = max_lost_override if max_lost_override is not None else getattr(self.config, "max_lost_frames", 5)

        # Step 1: Run YOLO tracking
        t_det_start = time.perf_counter()
        track_args = {
            "source": frame,
            "persist": True,
            "tracker": "bytetrack.yaml",
            "conf": effective_conf,
            "iou": effective_iou,
            "imgsz": effective_imgsz,
            "device": self.detector.device,
            "classes": list(self.config.target_classes.keys()) if self.config.target_classes else None,
            "verbose": False,
            "save": False,
        }
        if self.detector.half:
            track_args["half"] = True
        results = self.detector.model.track(**track_args)
        inference_time_ms = round((time.perf_counter() - t_det_start) * 1000, 2)

        # Speed metrics from Ultralytics
        speed_dict = getattr(results[0], "speed", {}) if results else {}
        preprocess_ms = round(speed_dict.get("preprocess", 1.0), 2)
        raw_inference_ms = round(speed_dict.get("inference", inference_time_ms), 2)
        postprocess_ms = round(speed_dict.get("postprocess", 1.0), 2)

        # Step 2: Extract tracks & enforce anti-flicker temporal consistency
        t_track_start = time.perf_counter()

        raw_detections: List[Dict[str, Any]] = []
        tracks: List[Dict[str, Any]] = []
        observed_track_ids: Set[int] = set()

        if results and len(results) > 0:
            boxes = results[0].boxes
            if boxes is not None and len(boxes) > 0:
                xyxy = boxes.xyxy.cpu().numpy()
                confs = boxes.conf.cpu().numpy()
                classes = boxes.cls.cpu().numpy().astype(int)
                track_ids = boxes.id.cpu().numpy().astype(int) if boxes.id is not None else None

                for i in range(len(boxes)):
                    cls_id = int(classes[i])
                    conf_val = round(float(confs[i]), 4)
                    box = xyxy[i]

                    # Clamp coordinates
                    x1 = max(0, min(w, int(box[0])))
                    y1 = max(0, min(h, int(box[1])))
                    x2 = max(0, min(w, int(box[2])))
                    y2 = max(0, min(h, int(box[3])))

                    nx1 = round(x1 / w, 4) if w > 0 else 0.0
                    ny1 = round(y1 / h, 4) if h > 0 else 0.0
                    nx2 = round(x2 / w, 4) if w > 0 else 0.0
                    ny2 = round(y2 / h, 4) if h > 0 else 0.0

                    bbox_dict = {"x1": x1, "y1": y1, "x2": x2, "y2": y2, "nx1": nx1, "ny1": ny1, "nx2": nx2, "ny2": ny2}
                    class_name = self.config.target_classes.get(
                        cls_id,
                        self.detector.model.names.get(cls_id, f"class_{cls_id}")
                    )
                    category = YoloDetector.get_category_for_class(class_name)

                    raw_detections.append({
                        "class_name": class_name,
                        "class": class_name,
                        "class_id": cls_id,
                        "category": category,
                        "confidence": conf_val,
                        "bbox": bbox_dict,
                    })

                    # Stable track id assignment
                    if track_ids is not None and i < len(track_ids):
                        track_id = int(track_ids[i])
                    else:
                        # Fallback to association by nearest active centroid if track_id is temporarily missing
                        cx_curr = (x1 + x2) / 2.0
                        cy_curr = (y1 + y2) / 2.0
                        best_tid = None
                        min_dist = float("inf")
                        for act_id, act_rec in self.active_tracks.items():
                            if act_id not in observed_track_ids and act_rec.class_id == cls_id:
                                last_cx = (act_rec.last_bbox["x1"] + act_rec.last_bbox["x2"]) / 2.0
                                last_cy = (act_rec.last_bbox["y1"] + act_rec.last_bbox["y2"]) / 2.0
                                dist = ((cx_curr - last_cx)**2 + (cy_curr - last_cy)**2)**0.5
                                if dist < 80.0 and dist < min_dist:
                                    min_dist = dist
                                    best_tid = act_id
                        track_id = best_tid if best_tid is not None else (i + 1)

                    # Update or create track record
                    if track_id in self.active_tracks:
                        record = self.active_tracks[track_id]
                        # Preserve established class name to prevent class-hopping
                        class_name = record.class_name
                        cls_id = record.class_id
                        category = record.category
                        record.mark_detected(bbox_dict, conf_val)
                    else:
                        record = TrackLifecycleRecord(track_id, cls_id, class_name, bbox_dict, conf_val)
                        self.active_tracks[track_id] = record

                    observed_track_ids.add(track_id)
                    self.observed_session_track_ids.add(track_id)

                    # Register in cumulative category sets once confirmed (hits >= 2)
                    if record.hits >= 2:
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
                        "state": record.state,
                        "bbox": bbox_dict,
                        "centroid": (cx, cy),
                        "vx": round(record.vx, 2),
                        "vy": round(record.vy, 2),
                        "nvx": round(record.vx / w, 5) if w > 0 else 0.0,
                        "nvy": round(record.vy / h, 5) if h > 0 else 0.0,
                        "frame_id": frame_id,
                        "is_predicted": False,
                        "trajectory": [{"x": p["cx"], "y": p["cy"]} for p in record.history],
                    })

        # Step 3: Handle lost tracks with anti-flicker temporal persistence
        current_active_ids = list(self.active_tracks.keys())
        for tid in current_active_ids:
            if tid not in observed_track_ids:
                record = self.active_tracks[tid]
                keep_rendered = record.mark_missed(max_lost, self.config.track_buffer, w, h)

                if keep_rendered and record.hits >= 2:
                    # Append predicted position so the bounding box does NOT vanish/flicker!
                    p_box = record.last_bbox
                    nx1 = round(p_box["x1"] / w, 4) if w > 0 else 0.0
                    ny1 = round(p_box["y1"] / h, 4) if h > 0 else 0.0
                    nx2 = round(p_box["x2"] / w, 4) if w > 0 else 0.0
                    ny2 = round(p_box["y2"] / h, 4) if h > 0 else 0.0
                    p_bbox_dict = {"x1": p_box["x1"], "y1": p_box["y1"], "x2": p_box["x2"], "y2": p_box["y2"], "nx1": nx1, "ny1": ny1, "nx2": nx2, "ny2": ny2}
                    cx = (p_box["x1"] + p_box["x2"]) / 2.0
                    cy = (p_box["y1"] + p_box["y2"]) / 2.0

                    tracks.append({
                        "track_id": tid,
                        "class_name": record.class_name,
                        "class": record.class_name,
                        "class_id": record.class_id,
                        "category": record.category,
                        "confidence": record.confidence,
                        "state": record.state,
                        "bbox": p_bbox_dict,
                        "centroid": (cx, cy),
                        "vx": round(record.vx, 2),
                        "vy": round(record.vy, 2),
                        "nvx": round(record.vx / w, 5) if w > 0 else 0.0,
                        "nvy": round(record.vy / h, 5) if h > 0 else 0.0,
                        "frame_id": frame_id,
                        "is_predicted": True,
                        "trajectory": [{"x": p["cx"], "y": p["cy"]} for p in record.history],
                    })

                elif record.state == "REMOVED":
                    del self.active_tracks[tid]

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
            "model_name": self.detector.config.model_name,
            "imgsz": effective_imgsz,
            "conf_threshold": effective_conf,
            "iou_threshold": effective_iou,
        }

    def get_average_tracking_latency_ms(self) -> float:
        if self._total_track_calls == 0:
            return 0.0
        return round(self._total_tracking_time_ms / self._total_track_calls, 2)

    def reset(self):
        """Reset active track states and internal tracker memory upon video loop."""
        self.active_tracks.clear()
        self.observed_session_track_ids.clear()
        self.session_unique_persons.clear()
        self.session_unique_vehicles.clear()
        self.session_unique_objects.clear()
        if self.detector and self.detector.model:
            try:
                predictor = getattr(self.detector.model, "predictor", None)
                if predictor and hasattr(predictor, "trackers"):
                    for trk in predictor.trackers:
                        if hasattr(trk, "reset"):
                            trk.reset()
            except Exception:
                pass

# Alias for backwards compatibility
ByteTracker = ByteTrackEngine
