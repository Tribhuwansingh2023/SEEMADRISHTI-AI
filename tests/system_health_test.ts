/**
 * SEEMADRISHTI AI — System Health & Diagnostics Test Suite
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import http from 'http';
import { createApp } from '../server/app';
import { initializeSchema } from '../server/db/schema';
import { seedDemoData } from '../server/db/seed';

const PORT = 8021;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function pass(name: string, detail?: string) {
  console.log(`  [PASS] ${name}${detail ? ` -> ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  process.exit(1);
}

async function request(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  }
  return { status: res.status, body };
}

async function runHealthTests() {
  console.log(`\n===============================================================`);
  console.log(` SEEMADRISHTI AI — System Health & Telemetry Test Suite`);
  console.log(`===============================================================\n`);

  initializeSchema();
  seedDemoData();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[TEST-SERVER] Health probe listening at ${BASE_URL}`);
      resolve();
    });
  });

  try {
    // 1. GET /api/health returns 200 with status ok
    console.log('[Suite 1: Comprehensive Subsystem Health]');
    const healthRes = await request('/api/health');
    if (healthRes.status === 200 && (healthRes.body?.status === 'ok' || healthRes.body?.status === 'HEALTHY')) {
      pass('GET /api/health reports healthy status', `Uptime: ${healthRes.body.processUptimeSeconds}s`);
    } else {
      fail('GET /api/health failed', `Status: ${healthRes.status}`);
    }

    if (healthRes.body?.subsystems?.database?.status === 'OK') {
      pass('Database subsystem reported OK with sqlite3 dialect');
    } else {
      fail('Database subsystem reported error');
    }

    if (healthRes.body?.processMemory?.heapUsedBytes > 0) {
      pass('Process memory heap metrics reported accurately', `Heap: ${(healthRes.body.processMemory.heapUsedBytes / 1024 / 1024).toFixed(1)}MB`);
    } else {
      fail('Missing process heap metrics');
    }

    // 2. GET /api/health/ready returns READY
    console.log('\n[Suite 2: Orchestration Readiness Probe]');
    const readyRes = await request('/api/health/ready');
    if (readyRes.status === 200 && readyRes.body?.status === 'READY') {
      pass('GET /api/health/ready returns READY state');
    } else {
      fail('GET /api/health/ready failed');
    }

    // 3. GET /api/health/live returns ALIVE
    console.log('\n[Suite 3: Liveness Probe]');
    const liveRes = await request('/api/health/live');
    if (liveRes.status === 200 && liveRes.body?.status === 'ALIVE') {
      pass('GET /api/health/live returns ALIVE state');
    } else {
      fail('GET /api/health/live failed');
    }

    // 4. GET /api/v1/health alias
    console.log('\n[Suite 4: V1 API Alias Compatibility]');
    const v1Res = await request('/api/v1/health');
    if (v1Res.status === 200 && (v1Res.body?.status === 'ok' || v1Res.body?.status === 'HEALTHY')) {
      pass('GET /api/v1/health correctly mapped to health subsystem');
    } else {
      fail('GET /api/v1/health alias failed');
    }

    console.log(`\n===============================================================`);
    console.log(` RESULTS: 6/6 HEALTH TESTS PASSED`);
    console.log(`===============================================================\n`);
    process.exit(0);
  } finally {
    server.close();
  }
}

runHealthTests().catch((err) => {
  console.error('[Health-Test-Runner] Unexpected failure:', err);
  process.exit(1);
});
