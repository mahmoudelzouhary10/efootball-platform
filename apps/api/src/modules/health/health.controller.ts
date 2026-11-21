import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { AppError } from '../../common/errors/app-error';
import { REDIS } from '../../common/redis/redis.module';
import { DB, Database } from '../../db/db.module';
import { Public } from '../identity/auth.decorators';
import { ErrorCode } from '@efp/contracts';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /** Readiness probe: database and Redis must both answer. */
  @Public()
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await Promise.all([this.db.execute(sql`select 1`), this.redis.ping()]);
    } catch {
      throw new AppError(503, ErrorCode.INTERNAL_ERROR, 'A dependency is unavailable');
    }
    return { status: 'ok' };
  }
}
