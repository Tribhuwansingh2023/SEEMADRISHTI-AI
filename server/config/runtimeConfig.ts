/**
 * SEEMADRISHTI AI — Typed Runtime Configuration Manager
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import path from 'path';

export interface ServerRuntimeConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  cvPort: number;
  jwtSecret: string;
  apiKey: string;
  databasePath: string;
  cameraZonesPath: string;
  evidenceStorageDir: string;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
}

export function getRuntimeConfig(): ServerRuntimeConfig {
  const env = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const port = parseInt(process.env.PORT || '3000', 10);
  const cvPort = parseInt(process.env.CV_PORT || '8088', 10);
  const jwtSecret = process.env.JWT_SECRET || 'seemadrishti-tactical-secret-fallback-key-2026';
  const apiKey = process.env.API_KEY || 'seemadrishti-m2m-service-key-2026';
  const databasePath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'database.sqlite');
  const cameraZonesPath = process.env.CAMERA_ZONES_PATH || path.resolve(process.cwd(), 'config/camera_zones.json');
  const evidenceStorageDir = process.env.EVIDENCE_STORAGE_DIR || path.resolve(process.cwd(), 'evidence');
  const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10);
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

  return {
    env,
    port,
    cvPort,
    jwtSecret,
    apiKey,
    databasePath,
    cameraZonesPath,
    evidenceStorageDir,
    rateLimitMaxRequests,
    rateLimitWindowMs,
  };
}
