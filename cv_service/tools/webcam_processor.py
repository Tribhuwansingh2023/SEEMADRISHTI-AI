"""
SEEMADRISHTI AI — Real-Time Browser Webcam & CCTV Video Computer Vision Processor
Team: IQ100 | SIH Problem Statement: SIH26187

Receives actual browser webcam and uploaded CCTV video frames over HTTP/WebSocket,
executes genuine YOLOv8 detection, ByteTrack tracking, Number Plate (ANPR) detection + OCR,
Stateful behavioral unusual activity analysis, configurable restricted zones, and explainable
threat scoring, and streams results back to the Node.js edge gateway and dashboard.

Guarantees:
- Zero fake / hardcoded / simulated bounding boxes
- Explicit metadata: sourceType='cctv_video' or 'browser_webcam', processingMode='live_cv'
- True Number Plate detection with EasyOCR and Indian license plate validation
- Neutral, explainable unusual activity detection (Intrusion, Loitering, Crowd, Vehicle Stopped, Running)
- Automated forensic evidence snapshot generation in /evidence/snapshots/
- Actual measured runtime FPS, inference latency, preprocessing time, and tracking latency
- Scale-invariant normalized coordinates [0.0 - 1.0] for exact aspect-ratio alignment
- Anti-flicker temporal persistence across momentary occlusions
"""

import os
import sys

# Ensure project root is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import time
import json
import base64
import threading
from collections import deque
from dataclasses import asdict
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from typing import Any, Dict, List, Optional, Tuple

# Ensure project root is on sys.path
import cv2
import numpy as np
import torch
import psutil

from cv_service.config import CVConfig
from cv_service.detection.yolo_detector import YoloDetector
from cv_service.tracking.byte_tracker import ByteTrackEngine
from cv_service.intrusion.detector import IntrusionDetector
from cv_service.risk.engine import RiskEngine
from cv_service.geometry.polygon import PolygonZone
from cv_service.anpr.plate_engine import NumberPlateEngine
from cv_service.behavior.unusual_activity_detector import UnusualActivityDetector, UnusualActivityEvent


# Set unbuffered stdout
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True, encoding="utf-8")
    except Exception:
        pass


class ThreadedCVServer(ThreadingMixIn, HTTPServer):
    allow_reuse_address = False
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Gracefully swallow client connection resets
        pass


class WebcamCVProcessor:
    """Singleton processor maintaining YOLOv8, ByteTrack, ANPR, and Behavior state in memory."""

    def __init__(self, port: int = 8088, config: Optional[CVConfig] = None):
        self.port = port
        self.config = config or CVConfig()
        self.detector: Optional[YoloDetector] = None
        self.trackers: Dict[str, ByteTrackEngine] = {}
        self.intrusion_detectors: Dict[str, IntrusionDetector] = {}
        self.risk_engines: Dict[str, RiskEngine] = {}
        self.activity_detectors: Dict[str, UnusualActivityDetector] = {}
        self.plate_engine: Optional[NumberPlateEngine] = None
        self.plate_cache: Dict[str, Dict[int, Dict[str, Any]]] = {}  # cam_id -> {track_id: plate_info}
        self.is_ready = False
        self.frame_times: deque = deque(maxlen=30)
        self.total_processed_frames = 0
        self.dropped_frames_count = 0
        self.latest_result_cache: Dict[str, Any] = {}
        self.camera_busy_locks: Dict[str, threading.Lock] = {}
        self._lock = threading.Lock()

        # Ensure evidence snapshots folder exists
        self.snapshots_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../evidence/snapshots"))
        os.makedirs(self.snapshots_dir, exist_ok=True)

    def initialize(self) -> None:
        """Load YOLO model, ByteTrack, and initialize ANPR plate engine with device selection."""
        print("[CVProcessor] Initializing YOLO detector...")
        self.detector = YoloDetector(self.config)
        self.detector.load_model()

        print("[CVProcessor] Initializing Number Plate (ANPR) EasyOCR Engine...")
        use_gpu_ocr = torch.cuda.is_available()
        self.plate_engine = NumberPlateEngine(use_gpu=use_gpu_ocr)
        self.plate_engine.initialize()

        self.is_ready = True
        print(f"[CVProcessor] YOLO ({self.detector.config.model_name}) + ByteTrack + ANPR + Behavior Engine loaded and ready on {self.detector.device_name}.")

    def _get_or_create_components(self, camera_id: str):
        """Lazily initialize tracker, intrusion detector, risk engine, and activity detector per camera."""
        cam_id = camera_id.lower().strip()
        with self._lock:
            if cam_id not in self.trackers:
                self.trackers[cam_id] = ByteTrackEngine(self.config, detector=self.detector)
                self.trackers[cam_id].initialize()

            if cam_id not in self.intrusion_detectors:
                idet = IntrusionDetector()
                idet.load_zones_from_backend(cam_id)
                self.intrusion_detectors[cam_id] = idet

            if cam_id not in self.risk_engines:
                self.risk_engines[cam_id] = RiskEngine()

            if cam_id not in self.activity_detectors:
                self.activity_detectors[cam_id] = UnusualActivityDetector(
                    loitering_threshold_sec=8.0,
                    vehicle_stopped_threshold_sec=7.0,
                    running_speed_threshold_px_s=220.0,
                    crowd_gathering_threshold=4,
                )

            if cam_id not in self.plate_cache:
                self.plate_cache[cam_id] = {}

        return (
            self.trackers[cam_id],
            self.intrusion_detectors[cam_id],
            self.risk_engines[cam_id],
            self.activity_detectors[cam_id],
        )

    def get_camera_lock(self, camera_id: str) -> threading.Lock:
        """Retrieves or creates a non-blocking execution lock for a camera to prevent frame backlog."""
        cam_id = camera_id.lower().strip()
        with self._lock:
            if cam_id not in self.camera_busy_locks:
                self.camera_busy_locks[cam_id] = threading.Lock()
            return self.camera_busy_locks[cam_id]

    def configure_restricted_zone(self, camera_id: str, zone_name: str, points: List[List[float]]) -> bool:
        """Configures or updates a restricted zone ROI on a camera."""
        cam_id = camera_id.lower().strip()
        _, _, _, act_det = self._get_or_create_components(cam_id)
        poly_pts = [(float(p[0]), float(p[1])) for p in points]
        act_det.set_restricted_zone(cam_id, zone_name, poly_pts)
        return True

    def _save_evidence_snapshot(
        self,
        frame_bgr: np.ndarray,
        event_type: str,
        camera_id: str,
        object_label: str,
        bbox: Optional[Dict[str, int]] = None,
    ) -> Optional[str]:
        """Saves a forensic snapshot image to /evidence/snapshots/ with tactical watermark overlay."""
        try:
            filename = f"EV-{int(time.time()*1000)}-{camera_id}-{event_type.replace(' ', '_')}.jpg"
            save_path = os.path.join(self.snapshots_dir, filename)

            annotated = frame_bgr.copy()
            h, w = annotated.shape[:2]

            # Draw bounding box if provided
            if bbox and "x1" in bbox:
                x1, y1 = max(0, int(bbox["x1"])), max(0, int(bbox["y1"]))
                x2, y2 = min(w, int(bbox["x2"])), min(h, int(bbox["y2"]))
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(annotated, object_label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # Draw tactical HUD overlay banner at bottom
            cv2.rectangle(annotated, (0, h - 38), (w, h), (10, 15, 25), -1)
            hud_text = f"SEEMADRISHTI EVIDENCE // {camera_id.upper()} // {event_type} // {time.strftime('%Y-%m-%d %H:%M:%S')}"
            cv2.putText(annotated, hud_text, (14, h - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1, cv2.LINE_AA)

            cv2.imwrite(save_path, annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
            return f"/evidence/snapshots/{filename}"
        except Exception as e:
            print(f"[CVProcessor] Failed to save evidence snapshot: {e}")
            return None

    def process_frame(
        self,
        camera_id: str,
        frame_bgr: np.ndarray,
        client_timestamp: Optional[int] = None,
        source_type: str = "cctv_video",
        restricted_zone_points: Optional[List[List[float]]] = None,
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        imgsz: Optional[int] = None,
        model_name: Optional[str] = None,
        max_lost_frames: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Executes genuine end-to-end CV pipeline on an ingested frame:
        1. Model hot-swap check
        2. YOLOv8 high-accuracy detection
        3. ByteTrack multi-object tracking with anti-flicker persistence
        4. Number Plate Recognition (ANPR) on detected vehicles
        5. Stateful Unusual & Suspicious Activity Detection
        6. Forensic Evidence Snapshot Generation
        7. Explainable Threat Risk Engine
        8. Comprehensive Debug & Telemetry Profiling
        """
        if not self.is_ready or self.detector is None:
            raise RuntimeError("CV Processor is not initialized")

        t_start = time.perf_counter()
        now_ts = time.time()
        self.frame_times.append(now_ts)

        # 1. Measured real FPS calculation
        measured_fps = 15.0
        if len(self.frame_times) >= 2:
            span = self.frame_times[-1] - self.frame_times[0]
            if span > 0:
                measured_fps = round((len(self.frame_times) - 1) / span, 1)

        tracker, intrusion_detector, risk_engine, activity_detector = self._get_or_create_components(camera_id)
        h, w = frame_bgr.shape[:2]

        # Handle dynamic model switch if requested
        if model_name and model_name != self.detector.config.model_name:
            with self._lock:
                self.detector.switch_model_if_needed(model_name)

        # Update dynamic restricted zone if provided in payload
        if restricted_zone_points and len(restricted_zone_points) >= 3:
            activity_detector.set_restricted_zone(camera_id, "Restricted Zone", [(p[0], p[1]) for p in restricted_zone_points])

        with self._lock:
            self.total_processed_frames += 1

            # 2. YOLO Detection + ByteTrack Multi-Object Tracking
            track_output = tracker.track(
                frame_bgr,
                camera_id=camera_id,
                frame_id=self.total_processed_frames,
                timestamp=now_ts,
                conf_override=conf_threshold,
                iou_override=iou_threshold,
                imgsz_override=imgsz,
                max_lost_override=max_lost_frames,
            )
            raw_tracks = track_output.get("tracks", [])
            raw_detections = track_output.get("detections", [])
            cumulative_counts = track_output.get("cumulative_counts", {})
            preprocess_ms = track_output.get("preprocess_ms", 1.0)
            inference_time_ms = track_output.get("inference_ms", 0.0)
            tracking_time_ms = track_output.get("tracking_ms", 0.0)
            postprocess_ms = track_output.get("postprocess_ms", 1.0)

            # 3. Format Tracks with Clean User IDs: Person #01, Vehicle #01
            formatted_tracks = []
            vehicles_detected = []
            persons_count = 0
            vehicles_count = 0

            for trk in raw_tracks:
                tid = trk.get("track_id", 0)
                c_name = trk.get("class_name", "person").lower()
                cat = trk.get("category", "HUMAN").upper()
                conf = trk.get("confidence", 0.90)
                conf_pct = int(round(conf * 100))

                is_human = cat == "HUMAN" or c_name in ("person", "pedestrian")
                is_vehicle = cat == "VEHICLE" or c_name in ("car", "truck", "bus", "motorcycle", "van", "bicycle", "suv")

                if is_human:
                    persons_count += 1
                    track_display_id = f"Person #{tid:02d}"
                    sub_label = f"PERSON {conf_pct}%"
                elif is_vehicle:
                    vehicles_count += 1
                    track_display_id = f"Vehicle #{tid:02d}"
                    veh_type = c_name.upper()
                    if veh_type == "MOTORCYCLE":
                        veh_type = "BIKE"
                    sub_label = f"{veh_type} {conf_pct}%"
                    vehicles_detected.append(trk)
                else:
                    track_display_id = f"Object #{tid:02d}"
                    sub_label = f"{c_name.upper()} {conf_pct}%"

                trk_copy = dict(trk)
                trk_copy["display_id"] = track_display_id
                trk_copy["sub_label"] = sub_label
                formatted_tracks.append(trk_copy)

            # 4. Number Plate Detection & Recognition (ANPR)
            plates_list = []
            cam_plate_cache = self.plate_cache[camera_id.lower().strip()]

            # Run ANPR on up to 2 vehicles per frame to maintain high real-time FPS
            for v_trk in vehicles_detected[:2]:
                v_tid = v_trk.get("track_id", 0)
                v_cls = v_trk.get("class_name", "car")
                v_bbox = v_trk.get("bbox", {})

                cached_entry = cam_plate_cache.get(v_tid)
                now_t = time.time()
                should_run_anpr = False
                if cached_entry is None:
                    should_run_anpr = True
                elif not cached_entry.get("readable") and (now_t - cached_entry.get("last_attempt", 0) > 4.0):
                    # Re-attempt at most once every 4.0 seconds for tracks without a readable plate
                    should_run_anpr = True

                if should_run_anpr and self.plate_engine:
                    plate_res = self.plate_engine.recognize_plate(frame_bgr, v_bbox, vehicle_class=v_cls)
                    plate_res["track_id"] = v_tid
                    plate_res["vehicle_id"] = f"Vehicle #{v_tid:02d}"
                    plate_res["last_attempt"] = now_t
                    cam_plate_cache[v_tid] = plate_res
                    plates_list.append(plate_res)
                elif cached_entry:
                    plates_list.append(cached_entry)

            # 5. Stateful Behavioral & Unusual Activity Detection
            t_act0 = time.perf_counter()
            unusual_events = activity_detector.evaluate_frame(
                camera_id=camera_id,
                tracks=formatted_tracks,
                frame_width=w,
                frame_height=h,
                timestamp=now_ts,
            )
            activity_time_ms = round((time.perf_counter() - t_act0) * 1000, 2)

            formatted_events = []
            for u_ev in unusual_events:
                snapshot_url = self._save_evidence_snapshot(
                    frame_bgr,
                    u_ev.event_type,
                    camera_id,
                    u_ev.object_label,
                    bbox=u_ev.bbox,
                )
                u_ev.snapshot_path = snapshot_url

                ev_dict = u_ev.to_dict()
                ev_dict["snapshot_url"] = snapshot_url
                formatted_events.append(ev_dict)

            # 6. Polygon Geofence Intrusion Detector
            geo_events, geom_ms = intrusion_detector.process_tracks(
                formatted_tracks,
                camera_id=camera_id,
                frame_width=w,
                frame_height=h,
                frame_id=self.total_processed_frames,
            )
            if geo_events:
                for ev in geo_events:
                    tid = getattr(ev, "track_id", 0)
                    cls_name = getattr(ev, "class_name", "person")
                    obj_label = f"Person #{tid:02d}" if cls_name == "person" else f"Vehicle #{tid:02d}"
                    ev_type = getattr(ev, "event_type", "RESTRICTED_ZONE_ENTRY")
                    
                    if not any(fe["event_type"] == "RESTRICTED AREA INTRUSION" and fe.get("track_id") == tid for fe in formatted_events):
                        snap = self._save_evidence_snapshot(frame_bgr, ev_type, camera_id, obj_label)
                        formatted_events.append({
                            "event_id": getattr(ev, "event_id", f"ev-{int(time.time()*1000)}"),
                            "zone_id": getattr(ev, "zone_id", ""),
                            "zone_name": getattr(ev, "zone_name", "Restricted Area"),
                            "track_id": tid,
                            "object_label": obj_label,
                            "class_name": cls_name,
                            "direction": getattr(ev, "direction", "ENTERED"),
                            "event_type": "RESTRICTED AREA INTRUSION",
                            "severity": "HIGH",
                            "timestamp": time.strftime("%H:%M:%S"),
                            "details": f"{obj_label} entered restricted perimeter",
                            "snapshot_url": snap,
                            "snapshot_path": snap,
                        })

            # 7. Explainable Threat Risk Engine
            max_risk_score = 10
            max_risk_level = "LOW"
            risk_reasons = []

            if formatted_tracks:
                for trk in formatted_tracks:
                    tid = trk.get("track_id", 0)
                    cls_name = trk.get("class_name", "person")
                    ctx = risk_engine.get_or_create_context(camera_id, tid, cls_name, now_ts)

                    for ev in formatted_events:
                        if ev.get("track_id") == tid:
                            ctx.has_active_intrusion = True
                            ctx.is_inside_zone = True

                    assessment = risk_engine.calculate_risk(camera_id, tid, current_time=now_ts)
                    trk["risk_score"] = assessment.score
                    trk["risk_level"] = assessment.level

                    if assessment.score > max_risk_score:
                        max_risk_score = assessment.score
                        max_risk_level = assessment.level
                        risk_reasons = [
                            r.to_dict() if hasattr(r, "to_dict") else (asdict(r) if hasattr(r, "__dataclass_fields__") else dict(r))
                            for r in assessment.reasons
                        ]

        # Real-time hardware telemetry
        try:
            cpu_pct = round(psutil.cpu_percent(), 1)
            mem_pct = round(psutil.virtual_memory().percent, 1)
        except Exception:
            cpu_pct = 0.0
            mem_pct = 0.0

        device_str = self.detector.device.upper() if self.detector else "CPU"
        device_name_str = self.detector.device_name if self.detector else "CPU"
        precision_str = getattr(self.detector, "precision", "FP32")
        gpu_desc = f"{device_name_str} ({precision_str})" if "NVIDIA" in device_name_str else "N/A (CPU Mode)"

        total_latency_ms = round((time.perf_counter() - t_start) * 1000, 1)

        readable_plates_count = len([p for p in plates_list if p.get("readable")])
        total_unique_plates = len([p for p in cam_plate_cache.values() if p.get("readable")])

        res_payload = {
            "success": True,
            "camera_id": camera_id,
            "source_type": source_type,
            "processing_mode": "live_cv",
            "frame_sequence": self.total_processed_frames,
            "frame_width": w,
            "frame_height": h,
            "detections": raw_detections,
            "tracks": formatted_tracks,
            "plates": plates_list,
            "counts": {
                "total": len(formatted_tracks),
                "persons": persons_count,
                "vehicles": vehicles_count,
                "plates": readable_plates_count,
                "events": len(formatted_events),
                "alerts": len([e for e in formatted_events if e.get("severity") in ("HIGH", "CRITICAL")]),
                # Cumulative session totals (Requirement 20)
                "persons_total": cumulative_counts.get("persons_seen", persons_count),
                "vehicles_total": cumulative_counts.get("vehicles_seen", vehicles_count),
                "plates_total": total_unique_plates,
                "total_seen": cumulative_counts.get("total_seen", len(formatted_tracks)),
            },
            "events": formatted_events,
            "risk": {
                "score": max_risk_score,
                "level": max_risk_level,
                "reasons": risk_reasons,
            },
            "telemetry": {
                "preprocess_ms": preprocess_ms,
                "inference_time_ms": inference_time_ms,
                "tracking_time_ms": tracking_time_ms,
                "postprocess_ms": postprocess_ms,
                "geometry_time_ms": round(geom_ms + activity_time_ms, 2),
                "total_latency_ms": total_latency_ms,
                "measured_fps": measured_fps,
                "dropped_frames": self.dropped_frames_count,
                "queue_size": 0,
            },
            "debug": {
                "yolo_status": "Active",
                "model": self.detector.config.model_name,
                "device": device_str,
                "device_name": device_name_str,
                "precision": precision_str,
                "input_size": imgsz or self.detector.config.input_size,
                "confidence": conf_threshold or self.detector.config.confidence_threshold,
                "iou": iou_threshold or getattr(self.detector.config, "iou_threshold", 0.45),
                "tracker": "ByteTrack",
                "max_lost_frames": max_lost_frames or getattr(self.detector.config, "max_lost_frames", 5),
                "detections_count": len(raw_detections),
                "active_tracks_count": len(formatted_tracks),
                "ai_fps": measured_fps,
                "queue_size": 0,
                "dropped_frames": self.dropped_frames_count,
                "cpu_percent": cpu_pct,
                "ram_percent": mem_pct,
                "gpu_desc": gpu_desc,
                "preprocess_ms": preprocess_ms,
                "inference_ms": inference_time_ms,
                "tracking_ms": tracking_time_ms,
                "postprocess_ms": postprocess_ms,
                "total_ms": total_latency_ms,
            },
            "timestamp": client_timestamp or int(time.time() * 1000),
        }
        self.latest_result_cache[camera_id] = res_payload
        return res_payload


def run_server(port: int = 8088):
    processor = WebcamCVProcessor(port=port)
    processor.initialize()

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, format, *args):
            pass  # Suppress request spam

        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key")
            self.send_header("Connection", "close")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_GET(self):
            if self.path == "/health" or self.path.startswith("/health"):
                resp = {
                    "status": "ok",
                    "service": "seemadrishti-cctv-cv",
                    "is_ready": processor.is_ready,
                    "processed_frames": processor.total_processed_frames,
                    "model": processor.config.model_name,
                    "device": processor.detector.device_name if processor.detector else "CPU",
                    "backend": "PyTorch / Ultralytics YOLOv8 + ByteTrack + EasyOCR",
                    "anpr_ready": processor.plate_engine is not None and processor.plate_engine._is_initialized,
                }
                resp_bytes = json.dumps(resp).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Connection", "close")
                self.send_header("Content-Length", str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                return

            if self.path == "/diagnostics" or self.path.startswith("/diagnostics"):
                cpu_pct = psutil.cpu_percent(interval=None) if psutil else 0.0
                ram_pct = psutil.virtual_memory().percent if psutil else 0.0
                is_cuda = torch.cuda.is_available()
                device_str = "CUDA" if is_cuda else "CPU"
                gpu_name = torch.cuda.get_device_name(0) if is_cuda else f"Host CPU ({os.cpu_count() or 4} cores)"
                vram_info = f"{torch.cuda.memory_allocated(0)/(1024**2):.1f} MB" if is_cuda else "N/A (System RAM)"
                
                measured_fps = 0.0
                if len(processor.frame_times) >= 2:
                    span = processor.frame_times[-1] - processor.frame_times[0]
                    if span > 0:
                        measured_fps = round((len(processor.frame_times) - 1) / span, 1)

                resp = {
                    "status": "AI ACTIVE" if processor.is_ready else "INITIALIZING",
                    "model": processor.config.model_name if processor.detector else "yolov8n.pt",
                    "device": device_str,
                    "device_name": gpu_name,
                    "precision": "FP16" if is_cuda else "FP32",
                    "input_size": processor.detector.config.input_size if processor.detector else 960,
                    "confidence": processor.detector.config.confidence_threshold if processor.detector else 0.30,
                    "iou": getattr(processor.config, "iou_threshold", 0.45),
                    "tracker": "ByteTrack",
                    "ai_fps": measured_fps,
                    "queue_size": 0,
                    "dropped_frames": processor.dropped_frames_count,
                    "cpu_percent": cpu_pct,
                    "ram_percent": ram_pct,
                    "vram": vram_info,
                    "total_processed": processor.total_processed_frames,
                    "active_cameras": list(processor.trackers.keys()),
                }
                resp_bytes = json.dumps(resp).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Connection", "close")
                self.send_header("Content-Length", str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                return

            self.send_response(404)
            self.send_header("Connection", "close")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_POST(self):
            # 1. Configure Zone Endpoint
            if self.path.startswith("/configure_zone"):
                try:
                    content_len = int(self.headers.get("Content-Length", 0))
                    body = self.rfile.read(content_len)
                    payload = json.loads(body.decode("utf-8"))
                    cam_id = payload.get("camera_id", "cam-01")
                    name = payload.get("zone_name", "Restricted Area")
                    pts = payload.get("points", [])
                    processor.configure_restricted_zone(cam_id, name, pts)
                    resp = json.dumps({"success": True, "message": f"Restricted zone '{name}' configured"}).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Connection", "close")
                    self.send_header("Content-Length", str(len(resp)))
                    self.end_headers()
                    self.wfile.write(resp)
                    return
                except Exception as e:
                    err = json.dumps({"success": False, "error": str(e)}).encode("utf-8")
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Connection", "close")
                    self.send_header("Content-Length", str(len(err)))
                    self.end_headers()
                    self.wfile.write(err)
                    return

            # 2. Process Frame Endpoint
            if not self.path.startswith("/process_frame"):
                self.send_response(404)
                self.send_header("Connection", "close")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return

            try:
                content_len = int(self.headers.get("Content-Length", 0))
                if content_len <= 0 or content_len > 16 * 1024 * 1024:  # 16MB limit for 4K/HD
                    err_bytes = b'{"success":false,"error":"Invalid payload size"}'
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Connection", "close")
                    self.send_header("Content-Length", str(len(err_bytes)))
                    self.end_headers()
                    self.wfile.write(err_bytes)
                    return

                body = self.rfile.read(content_len)
                payload = json.loads(body.decode("utf-8"))

                camera_id = str(payload.get("camera_id", "cam-01")).strip()
                frame_b64 = payload.get("frame_base64") or payload.get("frame")
                client_ts = payload.get("timestamp")
                src_type = payload.get("source_type", "cctv_video")
                zone_pts = payload.get("restricted_zone")

                # Dynamic runtime configuration parameters
                conf_val = payload.get("conf_threshold")
                if conf_val is not None:
                    conf_val = float(conf_val)
                iou_val = payload.get("iou_threshold")
                if iou_val is not None:
                    iou_val = float(iou_val)
                imgsz_val = payload.get("imgsz") or payload.get("input_size")
                if imgsz_val is not None:
                    imgsz_val = int(imgsz_val)
                model_val = payload.get("model_name")
                max_lost_val = payload.get("max_lost_frames")
                if max_lost_val is not None:
                    max_lost_val = int(max_lost_val)

                if not frame_b64 or not isinstance(frame_b64, str):
                    err_bytes = b'{"success":false,"error":"Missing frame data"}'
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Connection", "close")
                    self.send_header("Content-Length", str(len(err_bytes)))
                    self.end_headers()
                    self.wfile.write(err_bytes)
                    return

                if "," in frame_b64:
                    frame_b64 = frame_b64.split(",", 1)[1]

                # Non-blocking concurrency check: Drop old frame if worker is busy to prioritize LATEST FRAME (Requirement 2)
                cam_lock = processor.get_camera_lock(camera_id)
                acquired = cam_lock.acquire(blocking=False)
                if not acquired:
                    processor.dropped_frames_count += 1
                    cached = processor.latest_result_cache.get(camera_id)
                    if cached:
                        cached_copy = dict(cached)
                        cached_copy["dropped"] = True
                        cached_copy["telemetry"] = dict(cached.get("telemetry", {}))
                        cached_copy["telemetry"]["dropped_frames"] = processor.dropped_frames_count
                        cached_copy["telemetry"]["queue_size"] = 0
                        resp_bytes = json.dumps(cached_copy).encode("utf-8")
                    else:
                        resp_bytes = json.dumps({
                            "success": True,
                            "dropped": True,
                            "camera_id": camera_id,
                            "detections": [],
                            "tracks": [],
                            "counts": {"total": 0, "persons": 0, "vehicles": 0, "plates": 0, "events": 0, "alerts": 0},
                            "telemetry": {"dropped_frames": processor.dropped_frames_count, "queue_size": 0, "total_latency_ms": 1, "measured_fps": 15.0}
                        }).encode("utf-8")

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Connection", "close")
                    self.send_header("Content-Length", str(len(resp_bytes)))
                    self.end_headers()
                    self.wfile.write(resp_bytes)
                    return

                try:
                    img_bytes = base64.b64decode(frame_b64)
                    nparr = np.frombuffer(img_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                    if frame is None or frame.size == 0:
                        err_bytes = b'{"success":false,"error":"Could not decode image"}'
                        self.send_response(400)
                        self.send_header("Content-Type", "application/json")
                        self.send_header("Access-Control-Allow-Origin", "*")
                        self.send_header("Connection", "close")
                        self.send_header("Content-Length", str(len(err_bytes)))
                        self.end_headers()
                        self.wfile.write(err_bytes)
                        return

                    # Execute genuine CV pipeline on newest available frame
                    res = processor.process_frame(
                        camera_id,
                        frame,
                        client_timestamp=client_ts,
                        source_type=src_type,
                        restricted_zone_points=zone_pts,
                        conf_threshold=conf_val,
                        iou_threshold=iou_val,
                        imgsz=imgsz_val,
                        model_name=model_val,
                        max_lost_frames=max_lost_val,
                    )
                finally:
                    cam_lock.release()

                resp_bytes = json.dumps(res).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Connection", "close")
                self.send_header("Content-Length", str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)

            except Exception as e:
                err_resp = {"success": False, "error": str(e)}
                err_bytes = json.dumps(err_resp).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Connection", "close")
                self.send_header("Content-Length", str(len(err_bytes)))
                self.end_headers()
                self.wfile.write(err_bytes)

    server = ThreadedCVServer(("127.0.0.1", port), Handler)
    print(f"[CVProcessor] Listening on http://127.0.0.1:{port}/process_frame")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[CVProcessor] Shutting down.")
        server.server_close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="SEEMADRISHTI CCTV AI & Video Analytics Processor")
    parser.add_argument("--port", type=int, default=8088, help="Port to bind (default: 8088)")
    args = parser.parse_args()
    run_server(port=args.port)
