/**
 * SEEMADRISHTI AI — CCTV Fixtures & Directory Initialization Utility
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import fs from 'fs';
import path from 'path';

export interface FixtureValidationResult {
  fixturesDir: string;
  uploadsDir: string;
  fixtureCount: number;
  sampleVideoReady: boolean;
}

export function ensureCctvDirectories(): FixtureValidationResult {
  const fixturesDir = path.resolve(process.cwd(), 'cv_service/tests/fixtures');
  const uploadsDir = path.resolve(process.cwd(), 'data/uploads');

  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const samplePath = path.join(fixturesDir, 'sample_test.mp4');
  const sampleVideoReady = fs.existsSync(samplePath);

  // Ensure default video names exist as fixtures if primary downloads are absent
  const requiredFixtures = ['NearEBlock.mp4', 'maingateindoors.mp4', 'maingateoutdoors.mp4'];
  if (sampleVideoReady) {
    for (const reqName of requiredFixtures) {
      const targetPath = path.join(fixturesDir, reqName);
      if (!fs.existsSync(targetPath)) {
        try {
          fs.copyFileSync(samplePath, targetPath);
        } catch {
          // Non-fatal if copy fails in read-only environment
        }
      }
    }
  }

  const fixtureFiles = fs.readdirSync(fixturesDir);

  return {
    fixturesDir,
    uploadsDir,
    fixtureCount: fixtureFiles.length,
    sampleVideoReady,
  };
}
