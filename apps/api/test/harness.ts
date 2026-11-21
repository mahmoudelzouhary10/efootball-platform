import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Clock } from '../src/common/clock';
import { REDIS } from '../src/common/redis/redis.module';
import { DB, Database } from '../src/db/db.module';
import { Mailer, MemoryMailer } from '../src/modules/mail/mailer';
import { applyTestEnv } from './env';

export class FakeClock extends Clock {
  private current = new Date();

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }

  reset(): void {
    this.current = new Date();
  }
}

export interface Harness {
  app: INestApplication;
  http: ReturnType<typeof request>;
  db: Database;
  redis: Redis;
  mailer: MemoryMailer;
  clock: FakeClock;
  reset(): Promise<void>;
  close(): Promise<void>;
}

/** Boots the real application (real Postgres and Redis) with a fake clock and an in-memory mailer. */
export async function createHarness(): Promise<Harness> {
  applyTestEnv();
  const mailer = new MemoryMailer();
  const clock = new FakeClock();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Mailer)
    .useValue(mailer)
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();

  const app = moduleRef.createNestApplication({ bodyParser: false, logger: ['error'] });
  configureApp(app);
  await app.init();

  const db = app.get<Database>(DB);
  const redis = app.get<Redis>(REDIS);

  return {
    app,
    http: request(app.getHttpServer()),
    db,
    redis,
    mailer,
    clock,
    async reset() {
      await db.execute(
        sql`TRUNCATE users, sessions, auth_tokens, user_roles, audit_logs, media, player_profiles, clans, clan_applications, clan_memberships, clan_invitations, clan_join_requests RESTART IDENTITY CASCADE`,
      );
      await redis.flushdb();
      mailer.clear();
      clock.reset();
    },
    async close() {
      await app.close();
    },
  };
}

/** Extracts the `token` query parameter from the last email sent to an address. */
export function tokenFromMail(mailer: MemoryMailer, to: string): string {
  const msg = mailer.lastTo(to);
  if (!msg) throw new Error(`No email sent to ${to}`);
  const match = /token=([A-Za-z0-9_-]+)/.exec(msg.text);
  if (!match?.[1]) throw new Error('No token in email');
  return match[1];
}

/** Returns the session cookie pair ("name=value") from a response, or undefined. */
export function sessionCookie(res: request.Response): string | undefined {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith('efp_session='))?.split(';')[0];
}

export const validUser = {
  email: 'player.one@example.com',
  username: 'PlayerOne',
  password: 'correct horse battery',
};
