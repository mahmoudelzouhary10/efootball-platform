import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import argon2 from 'argon2';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { AppError } from '../../common/errors/app-error';
import { COMMON_PASSWORDS } from './common-passwords';

/**
 * OWASP Password Storage Cheat Sheet baseline: Argon2id, m=19 MiB, t=2, p=1.
 * Raising these later is safe: needsRehash() upgrades hashes transparently on next login.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService implements OnModuleInit {
  private readonly logger = new Logger(PasswordService.name);
  /** Verified against when the account doesn't exist, so response time doesn't reveal it. */
  private dummyHash = '';

  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash('dummy-password-for-timing', ARGON2_OPTIONS);
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /** Burns the same time as a real verification. */
  async verifyDummy(password: string): Promise<void> {
    await this.verify(this.dummyHash, password);
  }

  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  }

  /**
   * Rejects passwords that are known-breached or trivially derived from the account.
   * Length limits are already enforced by the request schema.
   */
  async assertAcceptable(
    password: string,
    ctx: { username?: string; email?: string },
  ): Promise<void> {
    const lower = password.toLowerCase();
    const reasons: string[] = [];
    if (COMMON_PASSWORDS.has(lower)) reasons.push('password_common');
    if (ctx.username && lower.includes(ctx.username.toLowerCase()))
      reasons.push('password_contains_username');
    const local = ctx.email?.split('@')[0]?.toLowerCase();
    if (local && local.length >= 4 && lower.includes(local))
      reasons.push('password_contains_email');
    if (reasons.length === 0 && this.cfg.HIBP_ENABLED && (await this.isPwned(password))) {
      reasons.push('password_breached');
    }
    if (reasons.length) throw AppError.validation({ password: reasons });
  }

  /** Have I Been Pwned range API (k-anonymity: only 5 hex chars of the SHA-1 leave the server). Fails open. */
  private async isPwned(password: string): Promise<boolean> {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    try {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        signal: AbortSignal.timeout(2_000),
      });
      if (!res.ok) return false;
      const body = await res.text();
      return body.split('\n').some((line) => {
        const [hashSuffix, count] = line.trim().split(':');
        return hashSuffix === suffix && Number(count) > 0;
      });
    } catch (err) {
      this.logger.warn(`HIBP check skipped: ${(err as Error).message}`);
      return false;
    }
  }
}
