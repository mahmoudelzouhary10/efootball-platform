import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { Clock } from '../../common/clock';
import { DB, Database, DbExecutor } from '../../db/db.module';
import { AuthTokenPurpose, authTokens } from '../../db/schema';
import { generateToken, hashToken } from './crypto';

/** Single-use, expiring tokens for email verification and password reset. */
@Injectable()
export class AuthTokenService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  /** Issues a token and invalidates any earlier unused token for the same purpose. */
  async issue(
    userId: string,
    purpose: AuthTokenPurpose,
    ttlMs: number,
    executor: DbExecutor = this.db,
  ): Promise<string> {
    const now = this.clock.now();
    await executor
      .update(authTokens)
      .set({ consumedAt: now })
      .where(
        and(
          eq(authTokens.userId, userId),
          eq(authTokens.purpose, purpose),
          isNull(authTokens.consumedAt),
        ),
      );
    const token = generateToken();
    await executor.insert(authTokens).values({
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + ttlMs),
      createdAt: now,
    });
    return token;
  }

  /**
   * Atomically marks a valid token as consumed and returns its user id.
   * A single conditional UPDATE means two concurrent redemptions can't both succeed.
   */
  async consume(
    token: string,
    purpose: AuthTokenPurpose,
    executor: DbExecutor,
  ): Promise<string | null> {
    const now = this.clock.now();
    const [row] = await executor
      .update(authTokens)
      .set({ consumedAt: now })
      .where(
        and(
          eq(authTokens.tokenHash, hashToken(token)),
          eq(authTokens.purpose, purpose),
          isNull(authTokens.consumedAt),
          gt(authTokens.expiresAt, now),
        ),
      )
      .returning({ userId: authTokens.userId });
    return row?.userId ?? null;
  }
}
