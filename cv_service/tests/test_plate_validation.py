"""
SEEMADRISHTI AI — Unit Tests for Indian Vehicle Registration Number Plate Validation
Team: IQ100 | SIH Problem Statement: SIH26187
"""

import unittest
import sys
import os

# Ensure cv_service root is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from cv_service.anpr.plate_engine import (
    NumberPlateEngine,
    INDIAN_STATE_CODES,
    INDIAN_PLATE_REGEX,
    BH_SERIES_REGEX,
    DEFENSE_PLATE_REGEX,
)


class TestPlateValidation(unittest.TestCase):
    def setUp(self):
        self.engine = NumberPlateEngine(use_gpu=False)

    def test_standard_indian_plate_formats(self):
        valid_plates = [
            "OD02AB1234",
            "DL10CE5678",
            "MH12DE1428",
            "KA05MJ9999",
            "UP32AB0001",
            "HR26DA1234",
        ]
        for plate in valid_plates:
            text, score = self.engine.clean_and_normalize_plate_text(plate)
            self.assertEqual(text, plate)
            self.assertGreaterEqual(score, 0.85)

    def test_bharat_series_registration(self):
        bh_plates = [
            "22BH1234AA",
            "21BH9999Z",
            "23BH0001AB",
        ]
        for plate in bh_plates:
            self.assertTrue(bool(BH_SERIES_REGEX.match(plate)))
            text, score = self.engine.clean_and_normalize_plate_text(plate)
            self.assertEqual(text, plate)
            self.assertGreaterEqual(score, 0.90)

    def test_ocr_character_disambiguation(self):
        # OCR confusion: "O" instead of "0", "I" instead of "1"
        noisy_plate = "DLIO CE 5678"  # "I" and "O" in place of 1 and 0
        text, score = self.engine.clean_and_normalize_plate_text(noisy_plate)
        self.assertEqual(text, "DL10CE5678")
        self.assertGreaterEqual(score, 0.85)

    def test_defense_plate_format(self):
        defense_plates = [
            "^21D123456K",
            "22A098765B",
        ]
        for plate in defense_plates:
            self.assertTrue(bool(DEFENSE_PLATE_REGEX.match(plate)))
            text, score = self.engine.clean_and_normalize_plate_text(plate)
            self.assertGreaterEqual(score, 0.90)

    def test_invalid_noise_rejection(self):
        invalid_texts = ["", "XYZ", "123", "@@@###$$$"]
        for noisy in invalid_texts:
            text, score = self.engine.clean_and_normalize_plate_text(noisy)
            self.assertLess(score, 0.50)


if __name__ == "__main__":
    unittest.main()
