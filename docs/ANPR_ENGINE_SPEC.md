# SEEMADRISHTI AI — Automatic Number Plate Recognition (ANPR / ALPR) Specification
**Smart India Hackathon (SIH26187) | Team: IQ100**

---

## 1. Overview
The SEEMADRISHTI ANPR engine recognizes vehicle registration plates from real-time 4K CCTV video streams and edge webcam feeds without requiring manual trigger sensors.

---

## 2. Multi-Stage Pipeline

```
Vehicle Detection (YOLOv8) 
  ↳ Bounding Box Filter (Car, Truck, Bus, Motorcycle)
    ↳ Aspect Ratio Crop (1.5 < W/H < 5.0)
      ↳ Multi-Stage Preprocessing:
          1. Bilateral Filtering (Edge-preserving noise removal)
          2. CLAHE (Contrast-limited adaptive histogram equalization)
          3. Otsu Adaptive Binarization
          4. Morphological Closing (Connect broken strokes)
            ↳ EasyOCR English Engine
              ↳ Indian Registration Regex Validation:
                  • Standard RTO (e.g. OD02AB1234, DL10CE5678)
                  • Bharat Series (e.g. 22BH1234AA)
                  • Defense / Military Plates (e.g. ^21D123456K)
                    ↳ Database Event Stream + WebSocket Notification
```

---

## 3. Ambiguity Resolution Heuristics
Because OCR optical sensors often confuse similar characters, SEEMADRISHTI applies contextual syntax-guided character disambiguation:
- **First 2 Characters**: Must be letters (State code). `0` maps to `O`, `1` to `I`, `5` to `S`, `8` to `B`, `2` to `Z`.
- **Characters 3 & 4**: Must be numeric (District code). `O` maps to `0`, `I` to `1`, `S` to `5`, `B` to `8`, `Z` to `2`.
- **Final 4 Characters**: Must be numeric.
