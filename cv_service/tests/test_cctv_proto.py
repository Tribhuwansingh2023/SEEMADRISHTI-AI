"""
Test prototype for CCTV Video AI Pipeline on user video.
"""
import os
import sys
import time
import json
import re

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
sys.stdout.reconfigure(encoding="utf-8")

import cv2
import numpy as np
from ultralytics import YOLO

print("[TEST] Loading YOLOv8...")
model = YOLO("d:/SEEMADRISHTI/yolov8n.pt")
print("[TEST] YOLOv8 loaded.")

# Test on NearEBlock.mp4
video_path = r"C:\Users\mukte\Downloads\NearEBlock.mp4"
cap = cv2.VideoCapture(video_path)
print(f"[TEST] Video opened: {cap.isOpened()}, Total Frames: {int(cap.get(cv2.CAP_PROP_FRAME_COUNT))}")

# Read frame at 10 seconds
cap.set(cv2.CAP_PROP_POS_FRAMES, 600)
ret, frame = cap.read()
if ret:
    h, w = frame.shape[:2]
    print(f"[TEST] Read frame shape: {w}x{h}")
    # Run YOLO
    results = model(cv2.resize(frame, (1280, 720)), verbose=False)
    boxes = results[0].boxes
    print(f"[TEST] Detections in frame: {len(boxes)}")
    for b in boxes:
        cls_id = int(b.cls[0])
        cls_name = model.names[cls_id]
        conf = float(b.conf[0])
        print(f"  - {cls_name.upper()} ({conf*100:.1f}%)")
cap.release()
print("[TEST] Completed successfully.")
