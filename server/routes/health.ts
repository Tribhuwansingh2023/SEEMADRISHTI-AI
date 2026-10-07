/**
 * SEEMADRISHTI AI — System Health & Subsystem Diagnostics Router
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import { Router, Request, Response } from 'express';
import { getSystemHealthMetrics } from '../services/systemHealthService';

export const healthRouter = Router();

// GET /api/health - Detailed system telemetry and health status
healthRouter.get('/', (_req: Request, res: Response) => {
  const metrics = getSystemHealthMetrics();
  res.status(200).json({
    status: 'ok',
    service: 'seemadrishti-backend',
    ...metrics,
  });
});

// GET /api/health/diagnostics - Detailed subsystem diagnostics
healthRouter.get('/diagnostics', (_req: Request, res: Response) => {
  const metrics = getSystemHealthMetrics();
  res.status(200).json({
    status: 'ok',
    diagnostics: metrics,
  });
});

// GET /api/health/ready - Lightweight readiness probe for container orchestrators
healthRouter.get('/ready', (_req: Request, res: Response) => {
  res.json({
    status: 'READY',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/live - Liveness probe
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'ALIVE',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
