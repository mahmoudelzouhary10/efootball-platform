// Runs with cwd = apps/api and resolves the API's own pg/ioredis and built migrator from there.
const path = require('node:path');
const apiRequire = require('node:module').createRequire(path.join(process.cwd(), 'package.json'));
const { Client } = apiRequire('pg');
const Redis = apiRequire('ioredis');
const { runMigrations } = apiRequire('./dist/db/migrate.js');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();
  await runMigrations(process.env.DATABASE_URL);

  const redis = new Redis(process.env.REDIS_URL);
  await redis.flushdb();
  await redis.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
