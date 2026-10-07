# SEEMADRISHTI AI — REST API Reference Specification
**Tactical Command Matrix & Surveillance API (v1 / v4.2.0)**

---

## 1. Authentication & System Health

### `POST /api/auth/login`
Authenticates an operator and returns a signed JWT.
- **Request Body**: `{ "username": "vikram", "password": "SecurePassword@2026" }`
- **Response**: `{ "success": true, "token": "...", "user": { ... } }`

### `GET /api/health`
Returns system health, CPU/RAM telemetry, database connectivity, and uptime.
- **Response**:
```json
{
  "status": "ok",
  "service": "seemadrishti-backend",
  "processUptimeSeconds": 1420,
  "subsystems": {
    "database": { "status": "OK", "dialect": "sqlite3" },
    "cvEngine": { "status": "ONLINE", "targetPort": 8088 },
    "webSocketHub": { "status": "ACTIVE", "protocol": "RFC-6455" }
  }
}
```

---

## 2. CCTV & Video Ingestion

### `GET /api/cctv/videos`
Lists pre-configured surveillance camera feeds and uploaded test videos.

### `GET /api/cctv/stream/:filename`
Streams CCTV video footage supporting **HTTP 206 Partial Content** byte range requests.

### `POST /api/cctv/frame`
Submits a base64 video frame for real-time YOLOv8 detection, ByteTrack tracking, and ANPR plate recognition.
- **Request Body**:
```json
{
  "cameraId": "cam-01",
  "frame": "data:image/jpeg;base64,...",
  "confidenceThreshold": 0.3,
  "anprEnabled": true
}
```

### `POST /api/cctv/zone`
Configures a restricted polygonal ROI on the camera feed.

---

## 3. Forensics & Chain-of-Custody

### `GET /api/evidence/:id`
Retrieves forensic evidence snapshot with SHA-256 verification status.

### `GET /api/cctv/plates`
Returns recently detected license plates with timestamps, vehicle classes, and confidence ratings.
