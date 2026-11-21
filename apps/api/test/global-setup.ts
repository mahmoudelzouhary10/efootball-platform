import { Client } from 'pg';
import { runMigrations } from '../src/db/migrate';
import { TEST_ENV } from './env';

/** Recreates the test database schema from migrations once per test run. */
export default async function setup(): Promise<void> {
  const url = TEST_ENV.DATABASE_URL;
  if (!/_test\b/.test(new URL(url).pathname)) {
    throw new Error(`Refusing to reset a database whose name doesn't end in _test: ${url}`);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    await client.query('CREATE SCHEMA public');
  } finally {
    await client.end();
  }
  await runMigrations(url);
}
