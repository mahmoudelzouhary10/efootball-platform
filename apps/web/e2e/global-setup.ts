import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { E2E } from './env';

/** Fresh database schema, empty Redis DB and empty mailbox before every run. */
export default async function globalSetup(): Promise<void> {
  if (!/_e2e$/.test(new URL(E2E.databaseUrl).pathname)) {
    throw new Error(
      `Refusing to reset a database whose name doesn't end in _e2e: ${E2E.databaseUrl}`,
    );
  }
  rmSync(E2E.mailFile, { force: true });
  const script = path.resolve(__dirname, 'reset-backends.cjs');
  execFileSync(process.execPath, [script], {
    cwd: path.resolve(__dirname, '../../api'),
    env: { ...process.env, DATABASE_URL: E2E.databaseUrl, REDIS_URL: E2E.redisUrl },
    stdio: 'inherit',
  });
}
