#!/usr/bin/env node
// Local development database helper.
//
// The project runs its own PostgreSQL cluster in .pgdata (git-ignored) instead of
// using the installed Windows service, so no admin rights are needed. It listens on
// the port found in DATABASE_URL (5433 by default) and accepts local connections
// without a password, which is why DATABASE_URL has no password in this project.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('.pgdata');
const command = process.argv[2] ?? 'status';

function resolvePgCtl() {
  const candidates = [
    process.env.PG_BIN ? path.join(process.env.PG_BIN, 'pg_ctl.exe') : null,
    'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe',
  ].filter(Boolean);

  const installed = candidates.find((candidate) => existsSync(candidate));
  if (installed) return installed;
  if (process.platform !== 'win32') return 'pg_ctl';

  console.error('Could not find pg_ctl. Set PG_BIN to your PostgreSQL bin directory.');
  process.exit(1);
}

function resolvePort() {
  if (process.env.DB_PORT) return process.env.DB_PORT;
  try {
    const match = readFileSync('.env', 'utf8').match(/^DATABASE_URL=.*?:(\d{2,5})\//m);
    if (match) return match[1];
  } catch {
    // No .env yet; fall through to the default.
  }
  return '5433';
}

if (!existsSync(dataDir)) {
  console.error(`No cluster found at ${dataDir}. Create one with: initdb -D .pgdata -U postgres -A trust -E UTF8`);
  process.exit(1);
}

const port = resolvePort();
const args = ['-D', dataDir];

if (command === 'start') {
  args.push('-o', `-p ${port}`, '-l', path.join(dataDir, 'server.log'), '-w', 'start');
} else if (command === 'stop') {
  args.push('-m', 'fast', 'stop');
} else if (command === 'status') {
  args.push('status');
} else {
  console.error('Usage: node scripts/db.mjs <start|stop|status>');
  process.exit(1);
}

const result = spawnSync(resolvePgCtl(), args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
