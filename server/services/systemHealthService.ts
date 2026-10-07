/**
 * SEEMADRISHTI AI — System Telemetry & Health Monitoring Service
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import os from 'os';
import { getDatabase } from '../db/database';

export interface SystemHealthMetrics {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  uptimeSeconds: number;
  processUptimeSeconds: number;
  os: {
    platform: string;
    architecture: string;
    cpus: number;
    totalMemoryBytes: number;
    freeMemoryBytes: number;
    loadAverage: number[];
  };
  processMemory: {
    rssBytes: number;
    heapTotalBytes: number;
    heapUsedBytes: number;
    externalBytes: number;
  };
  subsystems: {
    database: { status: 'OK' | 'ERROR'; dialect: string };
    cvEngine: { status: 'ONLINE' | 'STANDBY' | 'OFFLINE'; targetPort: number };
    webSocketHub: { status: 'ACTIVE'; protocol: string };
  };
}

export function getSystemHealthMetrics(): SystemHealthMetrics {
  const mem = process.memoryUsage();
  let dbStatus: 'OK' | 'ERROR' = 'OK';

  try {
    const db = getDatabase();
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'ERROR';
  }

  const cvPort = parseInt(process.env.CV_PORT || '8088', 10);

  return {
    status: dbStatus === 'OK' ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(os.uptime()),
    processUptimeSeconds: Math.floor(process.uptime()),
    os: {
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
      loadAverage: os.loadavg(),
    },
    processMemory: {
      rssBytes: mem.rss,
      heapTotalBytes: mem.heapTotal,
      heapUsedBytes: mem.heapUsed,
      externalBytes: mem.external,
    },
    subsystems: {
      database: {
        status: dbStatus,
        dialect: 'sqlite3',
      },
      cvEngine: {
        status: 'STANDBY',
        targetPort: cvPort,
      },
      webSocketHub: {
        status: 'ACTIVE',
        protocol: 'RFC-6455',
      },
    },
  };
}
