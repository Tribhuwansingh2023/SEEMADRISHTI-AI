/**
 * SEEMADRISHTI AI — Rate Limiter Unit Test Suite
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import express from 'express';
import http from 'http';
import { createRateLimiter } from '../server/middleware/rateLimiter';

const PORT = 8023;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function pass(name: string, detail?: string) {
  console.log(`  [PASS] ${name}${detail ? ` -> ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  process.exit(1);
}

async function runRateLimiterTests() {
  console.log(`\n===============================================================`);
  console.log(` SEEMADRISHTI AI — API Rate Limiter Verification Suite`);
  console.log(`===============================================================\n`);

  const app = express();
  // Allow 5 requests per 10 seconds for rapid testing
  app.use(createRateLimiter({ windowMs: 10000, maxRequests: 5 }));

  app.get('/test-endpoint', (_req, res) => {
    res.json({ success: true, message: 'Tactical payload delivered' });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => resolve());
  });

  try {
    console.log('[Suite 1: Token Quota & Standard Response Headers]');
    // Send 5 valid requests
    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${BASE_URL}/test-endpoint`);
      if (res.status === 200) {
        const remaining = res.headers.get('x-ratelimit-remaining');
        pass(`Request #${i} allowed within quota`, `Remaining: ${remaining}`);
      } else {
        fail(`Request #${i} unexpectedly failed with status ${res.status}`);
      }
    }

    console.log('\n[Suite 2: Threshold Breach Enforcement & HTTP 429]');
    // 6th request should be throttled
    const breachRes = await fetch(`${BASE_URL}/test-endpoint`);
    if (breachRes.status === 429) {
      const data = await breachRes.json();
      pass('Request #6 rejected with HTTP 429 Too Many Requests', `Error: ${data.error}`);
    } else {
      fail(`Request #6 was not throttled! Status: ${breachRes.status}`);
    }

    console.log('\n[Suite 3: Loopback Bypass Header]');
    const bypassRes = await fetch(`${BASE_URL}/test-endpoint`, {
      headers: { 'x-bypass-rate-limit': 'true' },
    });
    if (bypassRes.status === 200 && bypassRes.headers.get('x-ratelimit-bypassed') === 'true') {
      pass('Bypass request successfully honored with X-RateLimit-Bypassed header');
    } else {
      fail('Bypass request was not honored properly');
    }

    console.log(`\n===============================================================`);
    console.log(` RESULTS: 7/7 RATE LIMITER TESTS PASSED`);
    console.log(`===============================================================\n`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await new Promise((r) => setTimeout(r, 200));
  process.exit(0);
}

runRateLimiterTests().catch((err) => {
  console.error('[RateLimiter-Test-Runner] Unexpected failure:', err);
  process.exit(1);
});
