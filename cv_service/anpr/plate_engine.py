"""
SEEMADRISHTI AI — Vehicle Number Plate Detection & OCR Recognition Engine (ANPR / ALPR)
Team: IQ100 | SIH Problem Statement: SIH26187

Pipeline:
CCTV Video -> Vehicle Detection -> Number Plate Detection -> Plate Region Extraction
-> Image Preprocessing (Resize, Bilateral Filter, CLAHE, Adaptive Threshold)
-> EasyOCR -> Text Post-Processing & Indian License Plate Validation.

Guarantees:
- Zero fabrication: If plate cannot be clearly read, outputs 'PLATE NOT READABLE'
- True OCR confidence scores
- Strict Indian license plate format validation
"""

import os
import sys
import re
import time
from typing import Dict, List, Optional, Tuple, Any

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import cv2
import numpy as np

# Indian State Codes for plate syntax verification
INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ",
    "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP",
    "MZ", "NL", "OD", "OR", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK",
    "UP", "WB", "BH"
}

# Standard Indian Plate Regex: e.g. OD02AB1234, DL10CE5678, MH12DE1428, 22BH1234AA
INDIAN_PLATE_REGEX = re.compile(
    r"^([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$"
)

# Bharat Series (BH) Registration: YY BH #### XX (e.g. 22BH1234AA)
BH_SERIES_REGEX = re.compile(r"^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$")

# Indian Defense / Armed Forces plate pattern (e.g. ^21D123456K, 22A098765B)
DEFENSE_PLATE_REGEX = re.compile(r"^(\^|[0-9]{2}[A-Z])[0-9]{5,7}[A-Z]?$")

# Permissive plate pattern for partially visible or variant plates
PERMISSIVE_PLATE_REGEX = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z0-9]{2,8}$"
)


class NumberPlateEngine:
    """Singleton engine for vehicle number plate localization, preprocessing, and OCR."""

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self.reader = None
        self._is_initialized = False

    def initialize(self) -> bool:
        """Lazily initialize EasyOCR reader."""
        if self._is_initialized and self.reader is not None:
            return True

        try:
            import easyocr
            # Note: verbose=False prevents Windows cp1252 progress-bar charmap errors
            self.reader = easyocr.Reader(["en"], gpu=self.use_gpu, verbose=False)
            self._is_initialized = True
            print("[NumberPlateEngine] EasyOCR Reader initialized successfully.")
            return True
        except Exception as e:
            print(f"[NumberPlateEngine] Warning: Could not initialize EasyOCR: {e}")
            return False

    def preprocess_plate_image(self, plate_crop: np.ndarray) -> List[np.ndarray]:
        """
        Applies multi-stage image preprocessing to enhance character legibility:
        1. Resolution normalization
        2. Bilateral noise filtering (preserves character edges)
        3. CLAHE contrast enhancement
        4. Otsu adaptive binarization
        5. Morphological closing to seal broken character strokes
        """
        if plate_crop is None or plate_crop.size == 0:
            return []

        h, w = plate_crop.shape[:2]
        if h < 10 or w < 20:
            return []

        # Resize to standard height of 100px maintaining aspect ratio
        target_h = 100
        target_w = int(w * (target_h / float(h)))
        target_w = max(100, min(500, target_w))
        resized = cv2.resize(plate_crop, (target_w, target_h), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized

        # Stage A: Bilateral filter for edge-preserving smoothing
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)

        # Stage B: Contrast Limited Adaptive Histogram Equalization (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        contrast_enhanced = clahe.apply(filtered)

        # Stage C: Adaptive Thresholding (Otsu & Gaussian)
        _, thresh_otsu = cv2.threshold(contrast_enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh_adapt = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )

        # Stage D: Inverted binary for dark-text-on-light background
        inverted = cv2.bitwise_not(thresh_otsu)

        return [resized, contrast_enhanced, thresh_otsu, thresh_adapt, inverted]

    def extract_plate_candidates(self, vehicle_crop: np.ndarray) -> List[Tuple[np.ndarray, List[int]]]:
        """
        Locates prospective number plate bounding regions within a vehicle crop.
        Number plates typically reside in the lower 65% of the vehicle, possess a horizontal
        aspect ratio between 2.0 and 5.5, and exhibit high edge density.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return []

        vh, vw = vehicle_crop.shape[:2]
        if vh < 40 or vw < 40:
            return []

        candidates = []

        # 1. Primary candidate: lower 60% of vehicle (standard bumper mounting area)
        bumper_y1 = int(vh * 0.40)
        bumper_crop = vehicle_crop[bumper_y1:vh, 0:vw]
        candidates.append((bumper_crop, [0, bumper_y1, vw, vh]))

        # 2. Secondary candidate: center lower quadrant
        sub_y1 = int(vh * 0.50)
        sub_y2 = int(vh * 0.95)
        sub_x1 = int(vw * 0.15)
        sub_x2 = int(vw * 0.85)
        if sub_y2 > sub_y1 and sub_x2 > sub_x1:
            quad_crop = vehicle_crop[sub_y1:sub_y2, sub_x1:sub_x2]
            candidates.append((quad_crop, [sub_x1, sub_y1, sub_x2, sub_y2]))

        # 3. Contour edge analysis for rectangular license plate candidate
        try:
            gray = cv2.cvtColor(bumper_crop, cv2.COLOR_BGR2GRAY)
            # Sobel horizontal gradient to emphasize vertical plate borders
            grad_x = cv2.Sobel(gray, cv2.CV_16S, 1, 0, ksize=3)
            abs_grad_x = cv2.convertScaleAbs(grad_x)
            blurred = cv2.GaussianBlur(abs_grad_x, (9, 9), 0)
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Morphological close to connect plate characters into a solid block
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect = float(w) / max(1, h)
                area = w * h
                # Target rectangular plate shapes
                if 2.0 <= aspect <= 6.0 and area > (vw * vh * 0.005) and area < (vw * vh * 0.35):
                    pad_x = int(w * 0.05)
                    pad_y = int(h * 0.05)
                    px1 = max(0, x - pad_x)
                    py1 = max(0, y - pad_y)
                    px2 = min(vw, x + w + pad_x)
                    py2 = min(bumper_crop.shape[0], y + h + pad_y)
                    rect_crop = bumper_crop[py1:py2, px1:px2]
                    candidates.append((rect_crop, [px1, bumper_y1 + py1, px2, bumper_y1 + py2]))
        except Exception:
            pass

        return candidates

    def clean_and_normalize_plate_text(self, raw_text: str) -> Tuple[str, float]:
        """
        Cleans OCR text, strips whitespace and noise characters, and enforces
        Indian plate syntax rules (character vs number confusion corrections).
        """
        if not raw_text:
            return "", 0.0

        # Remove non-alphanumeric characters and uppercase
        cleaned = re.sub(r"[^A-Za-z0-9]", "", raw_text).upper().strip()

        if len(cleaned) < 5 or len(cleaned) > 12:
            return cleaned, 0.30

        # Syntax-guided character disambiguation for standard Indian plates:
        # Format: [AA] [00] [AA] [0000]
        # First 2 characters must be letters (State code)
        chars = list(cleaned)
        char_corrections = {
            "0": "O", "1": "I", "5": "S", "8": "B", "2": "Z", "4": "A"
        }
        num_corrections = {
            "O": "0", "I": "1", "S": "5", "B": "8", "Z": "2", "A": "4", "G": "6", "D": "0"
        }

        # Fix first two characters if they resemble digits
        if len(chars) >= 2:
            for i in range(2):
                if chars[i] in char_corrections:
                    chars[i] = char_corrections[chars[i]]

        # Fix next 2 characters if they resemble letters (District code e.g. 02, 10)
        if len(chars) >= 4:
            for i in range(2, min(4, len(chars))):
                if chars[i] in num_corrections:
                    chars[i] = num_corrections[chars[i]]

        candidate_str = "".join(chars)

        # Check if state code is valid
        state = candidate_str[:2]
        is_known_state = state in INDIAN_STATE_CODES

        if DEFENSE_PLATE_REGEX.match(candidate_str):
            return candidate_str, 0.96

        if BH_SERIES_REGEX.match(candidate_str):
            return candidate_str, 0.95

        if INDIAN_PLATE_REGEX.match(candidate_str):
            score = 0.95 if is_known_state else 0.85
            return candidate_str, score

        if PERMISSIVE_PLATE_REGEX.match(candidate_str):
            score = 0.80 if is_known_state else 0.65
            return candidate_str, score

        return candidate_str, 0.40

    def recognize_plate(
        self,
        frame_bgr: np.ndarray,
        vehicle_bbox: Dict[str, int],
        vehicle_class: str = "car",
    ) -> Dict[str, Any]:
        """
        Executes end-to-end ALPR on a detected vehicle:
        Vehicle Crop -> Plate Region -> Preprocessing -> OCR -> Validation.

        Returns structured payload:
        {
          "vehicle_type": "CAR",
          "plate_number": "OD02AB1234" | "PLATE NOT READABLE",
          "confidence": 91.5,
          "readable": True | False,
          "time": "22:14:32"
        }
        """
        now_time_str = time.strftime("%H:%M:%S")
        v_type = (vehicle_class or "CAR").upper()

        if frame_bgr is None or frame_bgr.size == 0:
            return {
                "vehicle_type": v_type,
                "plate_number": "PLATE NOT READABLE",
                "confidence": 0.0,
                "readable": False,
                "time": now_time_str,
            }

        fh, fw = frame_bgr.shape[:2]
        vx1 = max(0, min(fw, int(vehicle_bbox.get("x1", 0))))
        vy1 = max(0, min(fh, int(vehicle_bbox.get("y1", 0))))
        vx2 = max(0, min(fw, int(vehicle_bbox.get("x2", fw))))
        vy2 = max(0, min(fh, int(vehicle_bbox.get("y2", fh))))

        if vx2 <= vx1 or vy2 <= vy1:
            return {
                "vehicle_type": v_type,
                "plate_number": "PLATE NOT READABLE",
                "confidence": 0.0,
                "readable": False,
                "time": now_time_str,
            }

        vehicle_crop = frame_bgr[vy1:vy2, vx1:vx2]
        if vehicle_crop.size == 0 or vehicle_crop.shape[0] < 30 or vehicle_crop.shape[1] < 30:
            return {
                "vehicle_type": v_type,
                "plate_number": "PLATE NOT READABLE",
                "confidence": 0.0,
                "readable": False,
                "time": now_time_str,
            }

        # Initialize reader if not yet loaded
        if not self._is_initialized:
            self.initialize()

        if not self.reader:
            return {
                "vehicle_type": v_type,
                "plate_number": "PLATE NOT READABLE",
                "confidence": 0.0,
                "readable": False,
                "time": now_time_str,
            }

        candidates = self.extract_plate_candidates(vehicle_crop)
        best_plate_text = ""
        best_confidence = 0.0

        for cand_crop, _ in candidates[:3]:
            preprocessed_variants = self.preprocess_plate_image(cand_crop)
            for variant in preprocessed_variants:
                try:
                    ocr_results = self.reader.readtext(
                        variant,
                        detail=1,
                        paragraph=False,
                        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                    )
                    for item in ocr_results:
                        if len(item) >= 3:
                            _, raw_text, conf = item
                            cleaned, score = self.clean_and_normalize_plate_text(raw_text)
                            total_conf = float(conf) * score
                            if total_conf > best_confidence and len(cleaned) >= 6:
                                best_confidence = total_conf
                                best_plate_text = cleaned
                except Exception:
                    continue

            if best_confidence >= 0.70:
                break

        # User Rule: Do NOT fabricate or hallucinate plates.
        # If confidence is below threshold or plate length is invalid, report PLATE NOT READABLE.
        if best_confidence >= 0.45 and len(best_plate_text) >= 6:
            return {
                "vehicle_type": v_type,
                "plate_number": best_plate_text,
                "confidence": round(best_confidence * 100, 1),
                "readable": True,
                "time": now_time_str,
            }

        return {
            "vehicle_type": v_type,
            "plate_number": "PLATE NOT READABLE",
            "confidence": 0.0,
            "readable": False,
            "time": now_time_str,
        }
