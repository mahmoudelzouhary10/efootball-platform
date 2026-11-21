import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { Clock } from '../../common/clock';
import type { RequestMeta } from '../../common/http/request-meta';
import { DB, Database, DbExecutor } from '../../db/db.module';
import { PlatformRole, sessions, userRoles, users } from '../../db/schema';
import { generateToken, hashToken } from './crypto';
import {
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from './identity.constants';

/** The authenticated principal attached to a request. */
export interface AuthContext {
  sessionId: string;
  userId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  roles: PlatformRole[];
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  /** Creates a new session. Always a fresh token: prevents session fixation. */
  async create(
    userId: string,
    meta: RequestMeta,
    executor: DbExecutor = this.db,
  ): Promise<{ token: string; absoluteExpiresAt: Date }> {
    const token = generateToken();
    const now = this.clock.now();
    const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS);
    await executor.insert(sessions).values({
      userId,
      tokenHash: hashToken(token),
      createdAt: now,
      lastSeenAt: now,
      idleExpiresAt: minDate(new Date(now.getTime() + SESSION_IDLE_TTL_MS), absoluteExpiresAt),
      absoluteExpiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { token, absoluteExpiresAt };
  }

  /**
   * Resolves a cookie token to an AuthContext, or null if the session is unknown, revoked,
   * expired, or belongs to a disabled account. Extends the idle expiry (throttled).
   */
  async resolve(token: string): Promise<AuthContext | null> {
    const now = this.clock.now();
    const [row] = await this.db
      .select({
        sessionId: sessions.id,
        revokedAt: sessions.revokedAt,
        lastSeenAt: sessions.lastSeenAt,
        idleExpiresAt: sessions.idleExpiresAt,
        absoluteExpiresAt: sessions.absoluteExpiresAt,
        userId: users.id,
        username: users.username,
        email: users.email,
        status: users.status,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.tokenHash, hashToken(token)))
      .limit(1);

    if (!row || row.revokedAt || row.status !== 'active') return null;
    if (row.idleExpiresAt <= now || row.absoluteExpiresAt <= now) return null;

    if (now.getTime() - row.lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
      await this.db
        .update(sessions)
        .set({
          lastSeenAt: now,
          idleExpiresAt: minDate(
            new Date(now.getTime() + SESSION_IDLE_TTL_MS),
            row.absoluteExpiresAt,
          ),
        })
        .where(eq(sessions.id, row.sessionId));
    }

    const roles = await this.db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, row.userId));

    return {
      sessionId: row.sessionId,
      userId: row.userId,
      username: row.username,
      email: row.email,
      emailVerified: row.emailVerifiedAt !== null,
      roles: roles.map((r) => r.role),
    };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: this.clock.now() })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  /** Revokes every live session of a user, optionally keeping one (the caller's). */
  async revokeAllForUser(
    userId: string,
    exceptSessionId?: string,
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor
      .update(sessions)
      .set({ revokedAt: this.clock.now() })
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          exceptSessionId ? ne(sessions.id, exceptSessionId) : undefined,
        ),
      );
  }
}

function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}
