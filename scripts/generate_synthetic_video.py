"""
SEEMADRISHTI AI — Synthetic Tactical Video Clip Generator for CI/CD
Team: IQ100 | SIH Problem Statement: SIH26187
"""

import os
import sys
import numpy as np
import cv2

def generate_synthetic_surveillance_clip(output_path: str, duration_sec: int = 3, fps: int = 15):
    """Generates an MP4 video clip with simulated background and moving surveillance targets."""
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    total_frames = duration_sec * fps

    for frame_idx in range(total_frames):
        # Tactical dark grid background
        frame = np.full((height, width, 3), 20, dtype=np.uint8)

        # Draw grid lines
        for y in range(0, height, 40):
            cv2.line(frame, (0, y), (width, y), (35, 35, 35), 1)
        for x in range(0, width, 40):
            cv2.line(frame, (x, 0), (x, height), (35, 35, 35), 1)

        # Draw moving target (simulating vehicle)
        pos_x = int((frame_idx / total_frames) * (width - 120)) + 40
        pos_y = 240 + int(np.sin(frame_idx * 0.2) * 20)
        cv2.rectangle(frame, (pos_x, pos_y), (pos_x + 60, pos_y + 40), (0, 200, 255), 2)
        cv2.putText(frame, "TARGET-CAR", (pos_x, pos_y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 200, 255), 1)

        out.write(frame)

    out.release()
    print(f"[SyntheticVideo] Successfully generated {total_frames} frames at {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "cv_service/tests/fixtures/synthetic_ci_test.mp4"
    generate_synthetic_surveillance_clip(out_file)
