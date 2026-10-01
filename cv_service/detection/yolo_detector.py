import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import datetime
import time
from typing import Any, Dict, List, Optional
import numpy as np
import torch
from cv_service.config import CVConfig

class YoloDetector:
    """
    Ultralytics YOLO inference wrapper for high-accuracy CCTV object detection.
    
    Features:
    - Auto GPU/CPU device selection with FP16 half-precision on CUDA and optimized multi-thread CPU fallback
    - Dynamic runtime reconfiguration (model, resolution, confidence, IoU)
    - Normalized and absolute coordinates for aspect-ratio preservation
    - Granular speed profiling (preprocess, raw inference, NMS postprocess)
    - Strict surveillance class filtering and dynamic model class validation
    """

    def __init__(self, config: Optional[CVConfig] = None):
        self.config = config or CVConfig()
        self.model = None
        self.is_loaded = False
        self._total_inferences = 0
        self._total_inference_time_ms = 0.0
        self.model_classes: Dict[int, str] = {}

        # Automatic Hardware Acceleration Selection
        self._resolve_device()

    def _resolve_device(self) -> None:
        """Determines optimal inference device (CUDA GPU vs multi-threaded CPU)."""
        cfg_dev = getattr(self.config, "device", "auto").lower()
        if cfg_dev == "cuda" or (cfg_dev == "auto" and torch.cuda.is_available()):
            self.device = "cuda"
            self.half = True
            dev_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CUDA Device"
            self.device_name = f"NVIDIA GPU ({dev_name})"
            self.precision = "FP16"
        else:
            self.device = "cpu"
            self.half = False
            num_threads = min(8, os.cpu_count() or 4)
            try:
                torch.set_num_threads(num_threads)
            except Exception:
                pass
            self.device_name = f"CPU ({num_threads}-Thread Optimized)"
            self.precision = "FP32"

    def load_model(self, model_name: Optional[str] = None) -> bool:
        """Load pretrained YOLO weights, validate model classes, and run a warm-up inference."""
        try:
            from ultralytics import YOLO

            target_model = model_name or self.config.model_name
            print(f"[YoloDetector] Loading YOLO model: '{target_model}' on {self.device_name} (Precision: {self.precision})...")
            
            self.model = YOLO(target_model)
            self.config.model_name = target_model

            # Inspect model classes
            if hasattr(self.model, "names") and self.model.names:
                self.model_classes = {int(k): str(v) for k, v in self.model.names.items()}
                print(f"[YoloDetector] Model '{target_model}' loaded successfully. Verified {len(self.model_classes)} classes on {self.device_name}.")
            else:
                self.model_classes = {}

            # Warm-up inference with blank image
            dummy_img = np.zeros((self.config.input_size, self.config.input_size, 3), dtype=np.uint8)
            predict_kwargs = {
                "source": dummy_img,
                "imgsz": self.config.input_size,
                "conf": self.config.confidence_threshold,
                "device": self.device,
                "verbose": False,
            }
            if self.half:
                predict_kwargs["half"] = True
            self.model.predict(**predict_kwargs)

            self.is_loaded = True
            return True
        except Exception as e:
            self.is_loaded = False
            raise RuntimeError(
                f"[YoloDetector] Failed to load YOLO model '{self.config.model_name}': {str(e)}"
            ) from e

    def switch_model_if_needed(self, new_model_name: Optional[str]) -> bool:
        """Hot-swaps YOLO model weights if requested model differs from currently loaded model."""
        if not new_model_name or new_model_name == self.config.model_name:
            return False
        return self.load_model(new_model_name)

    @staticmethod
    def get_category_for_class(class_name: str) -> str:
        """
        Maps a specific YOLO class name to high-level security categories:
        HUMAN, VEHICLE, ANIMAL, OBJECT.
        """
        cn = str(class_name).lower().strip()
        if cn in ("person", "pedestrian", "human"):
            return "HUMAN"
        elif cn in ("car", "truck", "bus", "motorcycle", "motor", "bicycle", "bike", "van", "suv", "vehicle"):
            return "VEHICLE"
        elif cn in ("bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"):
            return "ANIMAL"
        elif cn in ("backpack", "handbag", "suitcase", "knife", "scissors"):
            return "OBJECT"
        else:
            return "OTHER"

    def is_animal_capable(self) -> bool:
        """Verifies whether the loaded model contains animal classes."""
        if not self.is_loaded or not self.model or not hasattr(self.model, "names"):
            return False
        known_animals = {"bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe"}
        model_classes = {str(name).lower() for name in self.model.names.values()}
        return len(known_animals.intersection(model_classes)) > 0

    def detect(
        self,
        frame: np.ndarray,
        camera_id: Optional[str] = None,
        conf_override: Optional[float] = None,
        iou_override: Optional[float] = None,
        imgsz_override: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Execute high-accuracy YOLO inference with custom resolution, aspect-ratio preservation,
        and normalized coordinate outputs.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("[YoloDetector] Model is not loaded. Call load_model() first.")

        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
            raise ValueError("[YoloDetector] Invalid or empty frame provided for detection.")

        h, w = frame.shape[:2]
        cam_id = camera_id or self.config.camera_id
        timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        effective_conf = conf_override if conf_override is not None else self.config.confidence_threshold
        effective_iou = iou_override if iou_override is not None else getattr(self.config, "iou_threshold", 0.45)
        effective_imgsz = imgsz_override if imgsz_override is not None else self.config.input_size

        t_start = time.perf_counter()

        predict_args = {
            "source": frame,
            "imgsz": effective_imgsz,
            "conf": effective_conf,
            "iou": effective_iou,
            "device": self.device,
            "classes": list(self.config.target_classes.keys()) if self.config.target_classes else None,
            "verbose": False,
        }
        if self.half:
            predict_args["half"] = True
        results = self.model.predict(**predict_args)

        total_inference_time_ms = round((time.perf_counter() - t_start) * 1000, 2)
        self._total_inferences += 1
        self._total_inference_time_ms += total_inference_time_ms

        # Extract detailed speeds from Ultralytics if available
        speed_dict = getattr(results[0], "speed", {}) if results else {}
        preprocess_ms = round(speed_dict.get("preprocess", 1.0), 2)
        raw_inference_ms = round(speed_dict.get("inference", total_inference_time_ms), 2)
        postprocess_ms = round(speed_dict.get("postprocess", 1.0), 2)

        detections: List[Dict[str, Any]] = []

        if results and len(results) > 0:
            boxes = results[0].boxes
            if boxes is not None and len(boxes) > 0:
                xyxy = boxes.xyxy.cpu().numpy()  # [x1, y1, x2, y2]
                confs = boxes.conf.cpu().numpy()  # confidence
                classes = boxes.cls.cpu().numpy().astype(int)  # class id

                limit = min(len(boxes), self.config.max_detections)
                for i in range(limit):
                    cls_id = int(classes[i])
                    conf_val = round(float(confs[i]), 4)
                    box = xyxy[i]

                    # Clamp absolute coordinates to actual frame boundaries
                    x1 = max(0, min(w, int(box[0])))
                    y1 = max(0, min(h, int(box[1])))
                    x2 = max(0, min(w, int(box[2])))
                    y2 = max(0, min(h, int(box[3])))

                    # Normalized coordinates [0.0 - 1.0] for scale-invariant frontend rendering
                    nx1 = round(x1 / w, 4) if w > 0 else 0.0
                    ny1 = round(y1 / h, 4) if h > 0 else 0.0
                    nx2 = round(x2 / w, 4) if w > 0 else 0.0
                    ny2 = round(y2 / h, 4) if h > 0 else 0.0

                    class_name = self.config.target_classes.get(
                        cls_id,
                        self.model.names.get(cls_id, f"class_{cls_id}")
                    )
                    category = self.get_category_for_class(class_name)

                    detections.append({
                        "class_name": class_name,
                        "class_id": cls_id,
                        "category": category,
                        "confidence": conf_val,
                        "bbox": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2,
                            "nx1": nx1,
                            "ny1": ny1,
                            "nx2": nx2,
                            "ny2": ny2,
                        },
                    })

        return {
            "camera_id": cam_id,
            "timestamp": timestamp_str,
            "frame_width": w,
            "frame_height": h,
            "inference_ms": raw_inference_ms,
            "preprocess_ms": preprocess_ms,
            "postprocess_ms": postprocess_ms,
            "total_ms": total_inference_time_ms,
            "detection_count": len(detections),
            "detections": detections,
            "device": self.device.upper(),
            "device_name": self.device_name,
            "half_precision": self.half,
            "model_name": self.config.model_name,
            "imgsz": effective_imgsz,
            "conf_threshold": effective_conf,
            "iou_threshold": effective_iou,
            "animal_detection_capable": self.is_animal_capable(),
            "detection_mode": getattr(self.config, "detection_mode", "BALANCED"),
        }

    def get_average_latency_ms(self) -> float:
        if self._total_inferences == 0:
            return 0.0
        return round(self._total_inference_time_ms / self._total_inferences, 2)

# Alias for backwards compatibility
YOLODetector = YoloDetector
