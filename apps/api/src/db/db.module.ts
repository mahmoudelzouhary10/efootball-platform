import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { APP_CONFIG, AppConfig } from '../config/env';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
/** A transaction handle; same query API as Database. */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Anything that can run queries: the database itself or an open transaction. */
export type DbExecutor = Database | Tx;

export const DB = Symbol('DB');
export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) =>
        new Pool({ connectionString: cfg.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 }),
    },
    {
      provide: DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool): Database => drizzle(pool, { schema }),
    },
  ],
  exports: [DB, PG_POOL],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

/** Postgres error helpers. */
export const PG_UNIQUE_VIOLATION = '23505';

export function uniqueViolationConstraint(err: unknown): string | null {
  // node-postgres errors may be wrapped by drizzle in `cause`.
  const candidates = [err, (err as { cause?: unknown } | null)?.cause];
  for (const e of candidates) {
    if (e && typeof e === 'object' && (e as { code?: string }).code === PG_UNIQUE_VIOLATION) {
      return (e as { constraint?: string }).constraint ?? '';
    }
  }
  return null;
}
