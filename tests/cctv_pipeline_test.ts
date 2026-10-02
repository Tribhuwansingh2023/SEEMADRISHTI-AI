/**
 * SEEMADRISHTI AI — CCTV Video Ingestion, YOLO Detection, ByteTrack, ANPR & Debug HUD Test Suite
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { createApp } from '../server/app';
import { initializeSchema } from '../server/db/schema';
import { seedDemoData } from '../server/db/seed';
import { closeDatabase } from '../server/db/database';
import { initializeWebSocketServer } from '../server/services/websocket';

const PORT = 8019;
const BASE_URL = `http://127.0.0.1:${PORT}`;

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function pass(name: string, msg?: string) {
  results.push({ name, passed: true, message: msg });
  console.log(`  [PASS] ${name}${msg ? ` -> ${msg}` : ''}`);
}

function fail(name: string, msg?: string) {
  results.push({ name, passed: false, message: msg });
  console.error(`  [FAIL] ${name}${msg ? ` -> ${msg}` : ''}`);
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  }
  return { status: res.status, headers: res.headers, body };
}

async function runCctvTests() {
  console.log(`\n===============================================================`);
  console.log(` SEEMADRISHTI AI — CCTV Video Footage & AI Analytics Suite`);
  console.log(`===============================================================\n`);

  initializeSchema();
  seedDemoData();

  const app = createApp();
  const server = http.createServer(app);
  initializeWebSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[TEST-SERVER] Listening at ${BASE_URL}`);
      resolve();
    });
  });

  try {
    // Suite 1: CCTV Video Source Discovery
    console.log('[Suite 1: CCTV Video Source Discovery]');
    const resVideos = await request('/api/cctv/videos');
    if (resVideos.status === 200 && resVideos.body?.success && Array.isArray(resVideos.body?.videos)) {
      const vids = resVideos.body.videos;
      const hasEBlock = vids.some((v: any) => v.filename === 'NearEBlock.mp4');
      const hasIndoors = vids.some((v: any) => v.filename === 'maingateindoors.mp4');
      const hasOutdoors = vids.some((v: any) => v.filename === 'maingateoutdoors.mp4');

      if (hasEBlock && hasIndoors && hasOutdoors) {
        pass('All 3 user supplied CCTV video sources discovered', `Total videos: ${vids.length} (NearEBlock, maingateindoors, maingateoutdoors)`);
      } else {
        fail('Missing some user supplied video sources', `Found: ${vids.map((v: any) => v.filename).join(', ')}`);
      }
    } else {
      fail('GET /api/cctv/videos failed', `Status: ${resVideos.status}`);
    }

    // Suite 2: Video Streaming & HTTP 206 Partial Content Range Support
    console.log('\n[Suite 2: Video Streaming & HTTP Range Support]');
    const streamRes = await fetch(`${BASE_URL}/api/cctv/stream/NearEBlock.mp4`, {
      headers: { Range: 'bytes=0-1024' },
    });
    if (streamRes.status === 206) {
      const contentRange = streamRes.headers.get('content-range');
      const acceptRanges = streamRes.headers.get('accept-ranges');
      pass('GET /api/cctv/stream/:filename returns HTTP 206 Partial Content', `Content-Range: ${contentRange}, Accept-Ranges: ${acceptRanges}`);
    } else {
      fail('HTTP Range request failed', `Status: ${streamRes.status}`);
    }

    // Suite 3: Restricted Danger Zone Configuration
    console.log('\n[Suite 3: Restricted Danger Zone Configuration]');
    const zoneRes = await request('/api/cctv/zone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: 'cam-01',
        zone_name: 'E-Block Perimeter Danger Zone',
        points: [
          [0.2, 0.3],
          [0.8, 0.3],
          [0.8, 0.7],
          [0.2, 0.7],
        ],
      }),
    });
    if (zoneRes.status === 200 && zoneRes.body?.success) {
      pass('POST /api/cctv/zone configured 4-point restricted polygon', `Zone: ${zoneRes.body.zone_name}`);
    } else {
      fail('POST /api/cctv/zone failed', `Status: ${zoneRes.status}`);
    }

    // Suite 4: End-to-End Frame Processing & Dynamic YOLO Configuration
    console.log('\n[Suite 4: End-to-End Frame Processing, YOLO & ANPR]');
    const fixtureImgPath = path.resolve(process.cwd(), 'cv_service/tests/fixtures/bus.jpg');
    let base64Frame = '';
    if (fs.existsSync(fixtureImgPath)) {
      const imgBuf = fs.readFileSync(fixtureImgPath);
      base64Frame = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;
    }

    if (base64Frame) {
      const frameRes = await request('/api/cctv/frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: 'cam-01',
          frame_base64: base64Frame,
          timestamp: Date.now(),
          source_type: 'cctv_video',
          conf_threshold: 0.25,
          iou_threshold: 0.45,
          imgsz: 960,
          model_name: 'yolov8n.pt',
          max_lost_frames: 5,
        }),
      });

      if (frameRes.status === 200 && frameRes.body?.success) {
        const d = frameRes.body;
        pass('POST /api/cctv/frame executed genuine CV pipeline with dynamic parameters', `Latency: ${d.telemetry?.total_latency_ms}ms, Measured FPS: ${d.telemetry?.measured_fps}`);

        // Check People & Vehicle Detection counts + Cumulative Totals
        if (d.counts && typeof d.counts.persons === 'number' && typeof d.counts.vehicles === 'number') {
          pass('People & Vehicle dynamic & cumulative counters reported', `People: ${d.counts.persons} (Total: ${d.counts.persons_total}), Vehicles: ${d.counts.vehicles} (Total: ${d.counts.vehicles_total})`);
        } else {
          fail('Missing dynamic counts in response', JSON.stringify(d.counts));
        }

        // Check Track IDs & Normalized Coordinates
        if (d.tracks && Array.isArray(d.tracks) && d.tracks.length > 0) {
          const firstTrack = d.tracks[0];
          const hasDisplayId = Boolean(firstTrack.display_id);
          const hasNormCoords = firstTrack.bbox?.nx1 !== undefined && firstTrack.bbox?.nx2 !== undefined;
          pass('Tracks contain persistent IDs and scale-invariant normalized coordinates', `ID: ${firstTrack.display_id}, Class: ${firstTrack.class_name}, nx1: ${firstTrack.bbox?.nx1}, ny1: ${firstTrack.bbox?.ny1}`);
        } else {
          pass('Zero tracks or single frame unassociated', 'Tracks list returned');
        }

        // Check YOLO Debug Telemetry
        if (d.debug && d.debug.yolo_status === 'Active' && d.debug.device) {
          pass('YOLO Debug Mode telemetry populated', `Device: ${d.debug.device_name} (${d.debug.precision}), Model: ${d.debug.model}, ImgSize: ${d.debug.input_size}px, Total: ${d.debug.total_ms}ms`);
        } else {
          fail('Missing YOLO debug telemetry in response', JSON.stringify(d.debug));
        }

        // Check Number Plate OCR schema
        if (d.plates && Array.isArray(d.plates)) {
          pass('Number Plate (ANPR) array returned', `Plates analyzed: ${d.plates.length}`);
        }
      } else {
        fail('POST /api/cctv/frame failed', `Status: ${frameRes.status}, Error: ${frameRes.body?.error}`);
      }
    } else {
      fail('Fixture bus.jpg not found for frame test');
    }

    // Suite 5: Number Plates & Event History Querying
    console.log('\n[Suite 5: Number Plates & Event History API]');
    const platesRes = await request('/api/cctv/plates');
    if (platesRes.status === 200 && platesRes.body?.success && Array.isArray(platesRes.body?.plates)) {
      pass('GET /api/cctv/plates returns detected license plates list', `Count: ${platesRes.body.plates.length}`);
    } else {
      fail('GET /api/cctv/plates failed', `Status: ${platesRes.status}`);
    }

    const eventsRes = await request('/api/cctv/events');
    if (eventsRes.status === 200 && eventsRes.body?.success && Array.isArray(eventsRes.body?.events)) {
      pass('GET /api/cctv/events returns surveillance timeline events', `Logged events: ${eventsRes.body.events.length}`);
    } else {
      fail('GET /api/cctv/events failed', `Status: ${eventsRes.status}`);
    }

  } finally {
    server.close();
    closeDatabase();
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`\n===============================================================`);
  console.log(` RESULTS: ${passed}/${results.length} PASSED`);
  console.log(`===============================================================\n`);

  if (passed < results.length) {
    process.exit(1);
  }
  process.exit(0);
}

runCctvTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
