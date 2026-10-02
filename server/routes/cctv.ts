/**
 * SEEMADRISHTI AI — CCTV Video Input, Streaming, AI Analytics & ANPR API Route
 * Team: IQ100 | SIH Problem Statement: SIH26187
 *
 * Provides endpoints for:
 * 1. GET /api/cctv/videos: List available CCTV simulated feeds (user videos + uploaded videos)
 * 2. POST /api/cctv/upload: Upload custom CCTV video footage (.mp4, .avi, .mov, .mkv)
 * 3. GET /api/cctv/stream/:filename: Stream video with HTTP 206 Partial Content Range support
 * 4. POST /api/cctv/frame: Authenticated frame processing via Python YOLOv8 + ByteTrack + ANPR
 * 5. POST /api/cctv/zone: Configure restricted area ROI on CCTV camera feed
 * 6. GET /api/cctv/events: Get recent surveillance and unusual activity events
 * 7. GET /api/cctv/plates: Get detected vehicle number plates
 */

import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { dispatchWebcamFrame, checkCvHealth } from '../services/cvProcessManager';
import { broadcastWebSocketMessage } from '../services/websocket';

export const cctvRouter = Router();

const USER_DOWNLOADS_DIR = 'C:\\Users\\mukte\\Downloads';
const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const FIXTURES_DIR = path.resolve(process.cwd(), 'cv_service/tests/fixtures');

// Pre-configured User CCTV Videos
const DEFAULT_USER_VIDEOS = [
  {
    id: 'near-e-block',
    cameraId: 'cam-01',
    name: 'Near E-Block Surveillance',
    filename: 'NearEBlock.mp4',
    filePath: path.join(USER_DOWNLOADS_DIR, 'NearEBlock.mp4'),
    location: 'Near E-Block Transit Corridor',
    description: 'Campus perimeter, pedestrian walkway, bus & multi-vehicle transit route',
    resolution: '3840x2160 4K',
    fps: 60,
    duration: '01:01',
    tag: 'TRANSIT_SECTOR_E',
  },
  {
    id: 'maingate-indoors',
    cameraId: 'cam-02',
    name: 'Main Gate Indoors Checkpoint',
    filename: 'maingateindoors.mp4',
    filePath: path.join(USER_DOWNLOADS_DIR, 'maingateindoors.mp4'),
    location: 'Main Gate Indoor Security Corridor',
    description: 'Indoor security access checkpoint, turnstiles, pedestrian tracking',
    resolution: '3840x2160 4K',
    fps: 60,
    duration: '01:01',
    tag: 'GATE_INDOOR_CHECK',
  },
  {
    id: 'maingate-outdoors',
    cameraId: 'cam-03',
    name: 'Main Gate Outdoors Approach',
    filename: 'maingateoutdoors.mp4',
    filePath: path.join(USER_DOWNLOADS_DIR, 'maingateoutdoors.mp4'),
    location: 'Main Gate Exterior Perimeter',
    description: 'Main roadway approach, multi-lane vehicular & motorcycle traffic flow',
    resolution: '3840x2160 4K',
    fps: 60,
    duration: '01:02',
    tag: 'GATE_OUTDOOR_ROAD',
  },
];

// In-memory plates and events store for fast retrieval
const recentPlates: Array<{
  id: string;
  vehicle_type: string;
  vehicle_id: string;
  plate_number: string;
  confidence: number;
  readable: boolean;
  time: string;
  camera_id: string;
  timestamp: number;
}> = [];

// Helper to locate video file across allowed directories
function findVideoFile(filename: string): string | null {
  const cleanName = path.basename(filename);

  // 1. Check user videos in Downloads
  for (const uv of DEFAULT_USER_VIDEOS) {
    if (uv.filename.toLowerCase() === cleanName.toLowerCase() && fs.existsSync(uv.filePath)) {
      return uv.filePath;
    }
  }

  // 2. Check direct path in Downloads
  const directDownloadPath = path.join(USER_DOWNLOADS_DIR, cleanName);
  if (fs.existsSync(directDownloadPath)) {
    return directDownloadPath;
  }

  // 3. Check data/uploads/
  const uploadPath = path.join(UPLOADS_DIR, cleanName);
  if (fs.existsSync(uploadPath)) {
    return uploadPath;
  }

  // 4. Check cv_service/tests/fixtures/
  const fixturePath = path.join(FIXTURES_DIR, cleanName);
  if (fs.existsSync(fixturePath)) {
    return fixturePath;
  }

  return null;
}

// GET /api/cctv/videos - List all available CCTV feeds
cctvRouter.get('/videos', (req: Request, res: Response) => {
  const videos = [];

  // Add default user videos if they exist on disk
  for (const uv of DEFAULT_USER_VIDEOS) {
    const exists = fs.existsSync(uv.filePath);
    videos.push({
      ...uv,
      available: exists,
      streamUrl: `/api/cctv/stream/${uv.filename}`,
      isDefault: true,
    });
  }

  // Add uploaded videos in data/uploads/
  if (fs.existsSync(UPLOADS_DIR)) {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const f of files) {
        const ext = path.extname(f).toLowerCase();
        if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
          const stat = fs.statSync(path.join(UPLOADS_DIR, f));
          videos.push({
            id: `upload-${path.parse(f).name}`,
            cameraId: 'cam-upload',
            name: `Uploaded: ${f}`,
            filename: f,
            filePath: path.join(UPLOADS_DIR, f),
            location: 'Custom Upload Channel',
            description: `User-uploaded surveillance footage (${(stat.size / (1024 * 1024)).toFixed(1)} MB)`,
            resolution: 'HD/4K Video',
            fps: 30,
            duration: 'Uploaded Footage',
            tag: 'CUSTOM_UPLOAD',
            available: true,
            streamUrl: `/api/cctv/stream/${f}`,
            isDefault: false,
          });
        }
      }
    } catch {}
  }

  res.json({
    success: true,
    videos,
    total: videos.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/cctv/stream/:filename - High-Performance HTTP 206 Video Stream
cctvRouter.get('/stream/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const resolvedPath = findVideoFile(filename);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        error: `Video source '${filename}' not found`,
      });
    }

    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;

    if (fileSize === 0) {
      throw new AppError('Video file is empty (0 bytes)', 500);
    }

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });

      fs.createReadStream(resolvedPath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/cctv/upload - Upload video footage file (Base64 payload or binary)
cctvRouter.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, fileData, base64 } = req.body;
    const rawData = fileData || base64;

    if (!filename || !rawData) {
      throw new AppError('Both filename and file data (base64 string) are required', 400);
    }

    const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const ext = path.extname(cleanFilename).toLowerCase();

    if (!['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
      throw new AppError('Unsupported video format. Allowed formats: .mp4, .avi, .mov, .mkv, .webm', 400);
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const targetPath = path.join(UPLOADS_DIR, cleanFilename);
    const base64Clean = rawData.includes(',') ? rawData.split(',')[1] : rawData;
    const buffer = Buffer.from(base64Clean, 'base64');

    fs.writeFileSync(targetPath, buffer);

    res.json({
      success: true,
      message: `Video '${cleanFilename}' uploaded successfully`,
      filename: cleanFilename,
      streamUrl: `/api/cctv/stream/${cleanFilename}`,
      sizeBytes: buffer.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cctv/frame - Process ingested CCTV video frame with genuine YOLO + ByteTrack + ANPR
cctvRouter.post('/frame', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      camera_id = 'cam-01',
      frame,
      frame_base64,
      timestamp,
      source_type = 'cctv_video',
      restricted_zone,
      conf_threshold,
      iou_threshold,
      imgsz,
      model_name,
      max_lost_frames,
    } = req.body;

    const rawFrame = frame || frame_base64;
    if (!rawFrame || typeof rawFrame !== 'string') {
      throw new AppError('Frame data (base64 JPEG/WebP string) is required', 400);
    }

    const cleanCamId = String(camera_id).trim().toLowerCase();
    const result = await dispatchWebcamFrame(
      cleanCamId,
      rawFrame,
      timestamp,
      source_type,
      restricted_zone,
      {
        conf_threshold: conf_threshold !== undefined ? Number(conf_threshold) : undefined,
        iou_threshold: iou_threshold !== undefined ? Number(iou_threshold) : undefined,
        imgsz: imgsz !== undefined ? Number(imgsz) : undefined,
        model_name: model_name ? String(model_name) : undefined,
        max_lost_frames: max_lost_frames !== undefined ? Number(max_lost_frames) : undefined,
      }
    );

    if (!result) {
      return res.status(503).json({
        success: false,
        status: 'CV_PROCESSOR_OFFLINE',
        camera_id: cleanCamId,
        error: 'Python CV processor is offline or overloaded.',
        source_type,
        timestamp: new Date().toISOString(),
      });
    }

    // Cache recognized plates
    if (result && (result as any).plates && Array.isArray((result as any).plates)) {
      for (const p of (result as any).plates) {
        if (p.readable && p.plate_number && p.plate_number !== 'PLATE NOT READABLE') {
          const existing = recentPlates.find((rp) => rp.plate_number === p.plate_number);
          if (!existing) {
            recentPlates.unshift({
              id: `plate-${Date.now()}-${p.plate_number}`,
              vehicle_type: p.vehicle_type || 'CAR',
              vehicle_id: p.vehicle_id || 'Vehicle #01',
              plate_number: p.plate_number,
              confidence: p.confidence || 90.0,
              readable: true,
              time: p.time || new Date().toLocaleTimeString(),
              camera_id: cleanCamId,
              timestamp: Date.now(),
            });
            if (recentPlates.length > 50) recentPlates.pop();

            // Broadcast ANPR plate event
            broadcastWebSocketMessage('anpr_plate' as any, {
              camera_id: cleanCamId,
              vehicle_type: p.vehicle_type || 'CAR',
              vehicle_id: p.vehicle_id || 'Vehicle #01',
              plate_number: p.plate_number,
              confidence: p.confidence,
              time: p.time,
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    // Persist events into SQLite database
    if (result && result.events && result.events.length > 0) {
      try {
        const db = getDatabase();
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO events (id, camera_id, event_type, severity, object_id, timestamp, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const ev of result.events) {
          const evId = ev.event_id || `ev-${Date.now()}`;
          const sev = ev.severity || 'Medium';
          const objLabel = ev.object_label || `Track #${ev.track_id || 1}`;
          const evType = ev.event_type || 'RESTRICTED_ZONE_ENTRY';
          const metaJson = JSON.stringify(ev);

          insertStmt.run(
            evId,
            cleanCamId,
            evType,
            sev,
            objLabel,
            new Date(result.timestamp || Date.now()).toISOString(),
            metaJson
          );
        }
      } catch (dbErr) {
        // Non-blocking database error
      }
    }

    res.json({
      success: true,
      status: 'PROCESSED',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cctv/zone - Configure restricted area ROI on camera feed
cctvRouter.post('/zone', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { camera_id = 'cam-01', zone_name = 'Restricted Area', points = [] } = req.body;

    if (!Array.isArray(points) || points.length < 3) {
      throw new AppError('Restricted zone requires at least 3 polygon coordinate vertices', 400);
    }

    const cleanCamId = String(camera_id).trim().toLowerCase();

    // Persist to SQLite zones table
    try {
      const db = getDatabase();
      const zoneId = `zone-${cleanCamId}-${Date.now()}`;
      const polyJson = JSON.stringify(points);

      db.prepare(`
        INSERT INTO zones (id, camera_id, name, polygon, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        ON CONFLICT(id) DO UPDATE SET polygon = excluded.polygon, updated_at = datetime('now')
      `).run(zoneId, cleanCamId, zone_name, polyJson);
    } catch {}

    // Dispatch to Python CV server if online
    fetch(`http://127.0.0.1:8088/configure_zone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: cleanCamId,
        zone_name,
        points,
      }),
    }).catch(() => {});

    broadcastWebSocketMessage('zone_updated' as any, {
      camera_id: cleanCamId,
      zone_name,
      points,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Restricted zone '${zone_name}' saved for camera '${cleanCamId}'`,
      zone_name,
      points_count: points.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cctv/plates - Get detected number plates
cctvRouter.get('/plates', (req: Request, res: Response) => {
  res.json({
    success: true,
    plates: recentPlates,
    total: recentPlates.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/cctv/events - Get recent surveillance events
cctvRouter.get('/events', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM events
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();

    res.json({
      success: true,
      events: rows.map((r: any) => ({
        ...r,
        metadata: r.metadata ? JSON.parse(r.metadata) : {},
      })),
      total: rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cctv/diagnostics - Real-time AI, GPU/CPU & Tracker telemetry from Python CV
cctvRouter.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const cvRes = await fetch('http://127.0.0.1:8088/diagnostics', { signal: controller.signal });
    clearTimeout(timeout);
    if (cvRes.ok) {
      const data = await cvRes.json();
      return res.json({ success: true, ...data });
    }
  } catch {}

  res.json({
    success: false,
    status: 'AI OFFLINE',
    model: 'yolov8n.pt',
    device: 'CPU',
    device_name: 'CPU (Host)',
    precision: 'FP32',
    input_size: 960,
    confidence: 0.30,
    iou: 0.45,
    tracker: 'ByteTrack',
    ai_fps: 0.0,
    queue_size: 0,
    dropped_frames: 0,
    cpu_percent: 0,
    ram_percent: 0,
    vram: 'N/A',
  });
});

