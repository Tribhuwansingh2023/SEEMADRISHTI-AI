/**
 * SEEMADRISHTI AI — Database Backup & Integrity Check Script
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import fs from 'fs';
import path from 'path';
import { getDatabase, closeDatabase } from '../server/db/database';

export function backupDatabase(targetBackupDir?: string): { success: boolean; backupPath: string; sizeBytes: number } {
  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'database.sqlite');
  const backupDir = targetBackupDir || path.resolve(process.cwd(), 'data/backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Ensure DB connection is initialized
  const db = getDatabase();
  const integrity = db.prepare('PRAGMA integrity_check').all() as Array<{ integrity_check: string }>;
  const isHealthy = integrity.length > 0 && integrity[0].integrity_check === 'ok';

  if (!isHealthy) {
    throw new Error('Database integrity check failed before backup');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `seemadrishti-backup-${timestamp}.sqlite`;
  const backupPath = path.join(backupDir, backupFilename);

  // Use SQLite VACUUM INTO for safe, atomic transactional backup
  const normalizedPath = backupPath.replace(/\\/g, '/');
  db.exec(`VACUUM INTO '${normalizedPath}'`);

  const stats = fs.statSync(backupPath);
  console.log(`[Backup] SQLite database safely backed up to ${backupPath} (${stats.size} bytes)`);

  return {
    success: true,
    backupPath,
    sizeBytes: stats.size,
  };
}

if (process.argv[1] && process.argv[1].endsWith('backup_db.ts')) {
  try {
    backupDatabase();
    closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[Backup] Failed:', err);
    process.exit(1);
  }
}
