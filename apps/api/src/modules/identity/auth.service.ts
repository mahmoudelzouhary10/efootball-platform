import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ChangePasswordInput,
  ErrorCode,
  LoginInput,
  MeResponse,
  RegisterInput,
  ResetPasswordInput,
} from '@efp/contracts';
import { eq } from 'drizzle-orm';
import { Clock } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import type { RequestMeta } from '../../common/http/request-meta';
import { RateLimiter } from '../../common/rate-limit/rate-limiter.service';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { DB, Database, uniqueViolationConstraint } from '../../db/db.module';
import { users } from '../../db/schema';
import { AuditService } from '../audit/audit.service';
import { Mailer, MailMessage } from '../mail/mailer';
import { passwordResetEmail, verificationEmail } from '../mail/templates';
import { AuthTokenService } from './auth-token.service';
import { EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS, RateLimits } from './identity.constants';
import { PasswordService } from './password.service';
import { AuthContext, SessionService } from './session.service';

export interface IssuedSession {
  token: string;
  absoluteExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly clock: Clock,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly tokens: AuthTokenService,
    private readonly rateLimiter: RateLimiter,
    private readonly mailer: Mailer,
    private readonly audit: AuditService,
  ) {}

  /** Creates the account, signs the user in, and emails a verification link. */
  async register(input: RegisterInput, meta: RequestMeta): Promise<IssuedSession> {
    await this.rateLimiter.consume(RateLimits.registerByIp, meta.ip ?? 'unknown');
    await this.passwords.assertAcceptable(input.password, input);
    const passwordHash = await this.passwords.hash(input.password);

    let result: { session: IssuedSession; verifyToken: string; userId: string };
    try {
      result = await this.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email: input.email, username: input.username, passwordHash })
          .returning({ id: users.id });
        const userId = user!.id;
        const verifyToken = await this.tokens.issue(
          userId,
          'email_verification',
          EMAIL_VERIFICATION_TTL_MS,
          tx,
        );
        const session = await this.sessions.create(userId, meta, tx);
        await this.audit.record(
          {
            actorUserId: userId,
            action: 'auth.register',
            targetType: 'user',
            targetId: userId,
            ip: meta.ip,
          },
          tx,
        );
        return { session, verifyToken, userId };
      });
    } catch (err) {
      // The unique indexes are the source of truth; this also covers concurrent sign-ups.
      const constraint = uniqueViolationConstraint(err);
      if (constraint === 'uq_users_email') {
        throw new AppError(409, ErrorCode.EMAIL_TAKEN, 'This email is already registered');
      }
      if (constraint === 'uq_users_username') {
        throw new AppError(409, ErrorCode.USERNAME_TAKEN, 'This username is taken');
      }
      throw err;
    }

    await this.sendSafely(
      verificationEmail(
        input.email,
        input.username,
        this.link('/verify-email', result.verifyToken),
      ),
    );
    return result.session;
  }

  /** Accepts an email or a username. Every failure path returns the same error and costs the same time. */
  async login(input: LoginInput, meta: RequestMeta): Promise<IssuedSession> {
    const identifier = input.identifier.toLowerCase();
    await this.rateLimiter.consume(RateLimits.loginByIp, meta.ip ?? 'unknown');
    await this.rateLimiter.consume(RateLimits.loginByAccount, identifier);

    const column = identifier.includes('@') ? users.email : users.username;
    const [user] = await this.db.select().from(users).where(eq(column, identifier)).limit(1);

    if (!user) {
      await this.passwords.verifyDummy(input.password);
      throw invalidCredentials();
    }
    if (!(await this.passwords.verify(user.passwordHash, input.password))) {
      throw invalidCredentials();
    }
    // Revealed only after a correct password, so it can't be used to probe accounts.
    if (user.status !== 'active') {
      throw new AppError(403, ErrorCode.ACCOUNT_DISABLED, 'This account is disabled');
    }

    if (this.passwords.needsRehash(user.passwordHash)) {
      const passwordHash = await this.passwords.hash(input.password);
      await this.db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    }

    await this.rateLimiter.reset(RateLimits.loginByAccount, identifier);
    return this.sessions.create(user.id, meta);
  }

  async logout(auth: AuthContext): Promise<void> {
    await this.sessions.revoke(auth.sessionId);
  }

  async logoutEverywhere(auth: AuthContext): Promise<void> {
    await this.sessions.revokeAllForUser(auth.userId);
  }

  async verifyEmail(token: string, meta: RequestMeta): Promise<void> {
    await this.rateLimiter.consume(RateLimits.tokenRedeemByIp, meta.ip ?? 'unknown');
    await this.db.transaction(async (tx) => {
      const userId = await this.tokens.consume(token, 'email_verification', tx);
      if (!userId) throw tokenInvalid();
      await tx
        .update(users)
        .set({ emailVerifiedAt: this.clock.now(), updatedAt: this.clock.now() })
        .where(eq(users.id, userId));
      await this.audit.record(
        {
          actorUserId: userId,
          action: 'auth.email_verified',
          targetType: 'user',
          targetId: userId,
          ip: meta.ip,
        },
        tx,
      );
    });
  }

  async resendVerification(auth: AuthContext): Promise<void> {
    if (auth.emailVerified) return;
    await this.rateLimiter.consume(RateLimits.resendVerificationByUser, auth.userId);
    const token = await this.tokens.issue(
      auth.userId,
      'email_verification',
      EMAIL_VERIFICATION_TTL_MS,
    );
    await this.sendSafely(
      verificationEmail(auth.email, auth.username, this.link('/verify-email', token)),
    );
  }

  /** Always succeeds from the caller's view, so it can't be used to discover registered emails. */
  async requestPasswordReset(email: string, meta: RequestMeta): Promise<void> {
    await this.rateLimiter.consume(RateLimits.resetRequestByIp, meta.ip ?? 'unknown');
    await this.rateLimiter.consume(RateLimits.resetRequestByEmail, email);

    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || user.status !== 'active') return;

    const token = await this.tokens.issue(user.id, 'password_reset', PASSWORD_RESET_TTL_MS);
    await this.sendSafely(
      passwordResetEmail(user.email, user.username, this.link('/reset-password', token)),
    );
  }

  /** Sets a new password and signs out every device. Proves email ownership, so it also verifies the email. */
  async resetPassword(input: ResetPasswordInput, meta: RequestMeta): Promise<void> {
    await this.rateLimiter.consume(RateLimits.tokenRedeemByIp, meta.ip ?? 'unknown');

    // Hash before opening the transaction so the row lock is held briefly.
    const passwordHash = await this.passwords.hash(input.password);

    await this.db.transaction(async (tx) => {
      const userId = await this.tokens.consume(input.token, 'password_reset', tx);
      if (!userId) throw tokenInvalid();
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
      if (!user || user.status !== 'active') throw tokenInvalid();

      await this.passwords.assertAcceptable(input.password, user);
      const now = this.clock.now();
      await tx
        .update(users)
        .set({
          passwordHash,
          passwordChangedAt: now,
          emailVerifiedAt: user.emailVerifiedAt ?? now,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
      await this.sessions.revokeAllForUser(userId, undefined, tx);
      await this.audit.record(
        {
          actorUserId: userId,
          action: 'auth.password_reset',
          targetType: 'user',
          targetId: userId,
          ip: meta.ip,
        },
        tx,
      );
    });
  }

  /** Requires the current password; keeps the current session and signs out all others. */
  async changePassword(
    auth: AuthContext,
    input: ChangePasswordInput,
    meta: RequestMeta,
  ): Promise<void> {
    await this.rateLimiter.consume(RateLimits.passwordChangeByUser, auth.userId);
    const [user] = await this.db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user || !(await this.passwords.verify(user.passwordHash, input.currentPassword))) {
      throw invalidCredentials();
    }
    await this.passwords.assertAcceptable(input.newPassword, user);
    const passwordHash = await this.passwords.hash(input.newPassword);

    await this.db.transaction(async (tx) => {
      const now = this.clock.now();
      await tx
        .update(users)
        .set({ passwordHash, passwordChangedAt: now, updatedAt: now })
        .where(eq(users.id, auth.userId));
      await this.sessions.revokeAllForUser(auth.userId, auth.sessionId, tx);
      await this.audit.record(
        {
          actorUserId: auth.userId,
          action: 'auth.password_changed',
          targetType: 'user',
          targetId: auth.userId,
          ip: meta.ip,
        },
        tx,
      );
    });
  }

  async me(auth: AuthContext): Promise<MeResponse> {
    const [user] = await this.db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) throw AppError.unauthenticated();
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerifiedAt !== null,
      roles: auth.roles,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** Profile for a session issued in this same request (register/login responses). */
  async meByToken(token: string): Promise<MeResponse> {
    const auth = await this.sessions.resolve(token);
    if (!auth) throw AppError.unauthenticated();
    return this.me(auth);
  }

  private link(path: string, token: string): string {
    const url = new URL(path, this.cfg.APP_PUBLIC_URL);
    url.searchParams.set('token', token);
    return url.toString();
  }

  /**
   * Email failure must not fail the request: the account change is already committed and the
   * user can ask for a new email. Moves to a retrying background job when the worker lands (P4).
   */
  private async sendSafely(message: MailMessage): Promise<void> {
    try {
      await this.mailer.send(message);
    } catch (err) {
      this.logger.error(`Failed to send "${message.subject}": ${(err as Error).message}`);
    }
  }
}

function invalidCredentials(): AppError {
  return new AppError(401, ErrorCode.INVALID_CREDENTIALS, 'Invalid username/email or password');
}

function tokenInvalid(): AppError {
  return new AppError(400, ErrorCode.TOKEN_INVALID, 'This link is invalid or has expired');
}
