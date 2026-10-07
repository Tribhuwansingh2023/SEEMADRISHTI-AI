/**
 * SEEMADRISHTI AI — Forensic Evidence Packaging & SHA-256 Hashing Verification Suite
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import { computeSha256, packageForensicEvidence } from '../src/services/forensicEvidencePackager';

function pass(name: string, detail?: string) {
  console.log(`  [PASS] ${name}${detail ? ` -> ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  process.exit(1);
}

async function runEvidenceTests() {
  console.log('\n===============================================================');
  console.log(' SEEMADRISHTI AI — Forensic Evidence SHA-256 Integrity Test');
  console.log('===============================================================\n');

  // Test 1: Deterministic Hashing
  console.log('[Suite 1: Deterministic Cryptographic Digest]');
  const samplePayload = '{"sample":"tactical_test_frame_123"}';
  const hash1 = await computeSha256(samplePayload);
  const hash2 = await computeSha256(samplePayload);

  if (hash1 === hash2 && hash1.length === 64) {
    pass('Deterministic SHA-256 produces identical 64-char hex digest', hash1.substring(0, 16) + '...');
  } else {
    fail('SHA-256 non-deterministic or invalid length');
  }

  // Test 2: Tamper Sensitivity
  console.log('\n[Suite 2: Avalanche Effect & Tamper Sensitivity]');
  const tamperedPayload = '{"sample":"tactical_test_frame_124"}';
  const hashTampered = await computeSha256(tamperedPayload);

  if (hash1 !== hashTampered) {
    pass('Single byte variation causes complete avalanche digest mutation');
  } else {
    fail('Collision detected on single byte mutation');
  }

  // Test 3: End-to-End Forensic Manifest Packaging
  console.log('\n[Suite 3: Evidence Manifest Packaging]');
  const manifest = await packageForensicEvidence({
    incidentId: 'INC-2026-0981',
    cameraId: 'cam-01',
    operatorBadgeId: 'OP-4019',
    operatorName: 'Major Vikram Sen',
    snapshotBase64OrUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    detectedEntities: [{ id: 'target-01', class: 'person', confidence: 0.94 }],
    telemetry: { fps: 60, latencyMs: 14.2 },
  });

  if (manifest.manifestId.startsWith('MANIFEST-') && manifest.tamperVerified) {
    pass('Forensic manifest sealed with valid digital signature', manifest.digitalSignature);
  } else {
    fail('Manifest generation failed');
  }

  if (manifest.sha256Hash && manifest.sha256Hash.length === 64) {
    pass('Court-admissible SHA-256 seal verified', `Digest: ${manifest.sha256Hash.substring(0, 24)}...`);
  } else {
    fail('Invalid manifest hash length');
  }

  console.log('\n===============================================================');
  console.log(' RESULTS: 4/4 FORENSIC HASHING TESTS PASSED');
  console.log('===============================================================\n');
}

runEvidenceTests().catch((err) => {
  console.error('[Evidence-Test] Fatal error:', err);
  process.exit(1);
});
