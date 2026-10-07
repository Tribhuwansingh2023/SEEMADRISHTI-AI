/**
 * SEEMADRISHTI AI — Database Backup Verification Suite
 * Team: IQ100 | SIH Problem Statement: SIH26187
 */

import fs from 'fs';
import path from 'path';
import { backupDatabase } from '../scripts/backup_db';
import { initializeSchema } from '../server/db/schema';
import { seedDemoData } from '../server/db/seed';
import { closeDatabase } from '../server/db/database';

function pass(name: string, detail?: string) {
  console.log(`  [PASS] ${name}${detail ? ` -> ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  process.exit(1);
}

async function runBackupTests() {
  console.log('\n===============================================================');
  console.log(' SEEMADRISHTI AI — Database Backup & Snapshot Test Suite');
  console.log('===============================================================\n');

  initializeSchema();
  seedDemoData();

  const tempBackupDir = path.resolve(process.cwd(), 'data/test_backups');
  if (fs.existsSync(tempBackupDir)) {
    fs.rmSync(tempBackupDir, { recursive: true, force: true });
  }

  try {
    const res = backupDatabase(tempBackupDir);
    if (res.success && fs.existsSync(res.backupPath) && res.sizeBytes > 0) {
      pass('SQLite database backup generated successfully', `Size: ${res.sizeBytes} bytes`);
    } else {
      fail('Database backup file not created or empty');
    }

    // Verify file header is valid SQLite database
    const fd = fs.openSync(res.backupPath, 'r');
    const headerBuffer = Buffer.alloc(16);
    fs.readSync(fd, headerBuffer, 0, 16, 0);
    fs.closeSync(fd);

    const headerStr = headerBuffer.toString('utf-8');
    if (headerStr.startsWith('SQLite format 3')) {
      pass('Backup header verified: valid SQLite format 3 magic bytes');
    } else {
      fail('Invalid SQLite header in backup artifact');
    }

    console.log('\n===============================================================');
    console.log(' RESULTS: 2/2 DATABASE BACKUP TESTS PASSED');
    console.log('===============================================================\n');
  } finally {
    closeDatabase();
    if (fs.existsSync(tempBackupDir)) {
      try {
        fs.rmSync(tempBackupDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

runBackupTests().catch((err) => {
  console.error('[Backup-Test] Error:', err);
  process.exit(1);
});
