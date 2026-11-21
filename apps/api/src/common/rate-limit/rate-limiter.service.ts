import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from '@efp/contracts';
import type Redis from 'ioredis';
import { AppError } from '../errors/app-error';
import { REDIS } from '../redis/redis.module';

export interface RateLimitRule {
  /** Namespace, e.g. "login:ip". */
  name: string;
  limit: number;
  windowSeconds: number;
}

/** Atomic fixed-window counter: INCR, and set the TTL only when the key is new. */
const INCR_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
`;

/**
 * Redis-backed rate limiter shared by all API instances.
 * Keys are hashed so raw emails/usernames are never stored in Redis.
 */
@Injectable()
export class RateLimiter {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /** Counts one hit and throws 429 RATE_LIMITED when the rule is exceeded. */
  async consume(rule: RateLimitRule, key: string): Promise<void> {
    const redisKey = `rl:${rule.name}:${hashKey(key)}`;
    const [count, ttl] = (await this.redis.eval(
      INCR_SCRIPT,
      1,
      redisKey,
      String(rule.windowSeconds),
    )) as [number, number];
    if (count > rule.limit) {
      const retryAfter = Math.max(1, ttl);
      throw new AppError(
        429,
        ErrorCode.RATE_LIMITED,
        'Too many requests, try again later',
        undefined,
        { 'Retry-After': String(retryAfter) },
      );
    }
  }

  /** Clears a counter, e.g. the per-account login counter after a successful login. */
  async reset(rule: RateLimitRule, key: string): Promise<void> {
    await this.redis.del(`rl:${rule.name}:${hashKey(key)}`);
  }
}

function hashKey(key: string): string {
  return createHash('sha256').update(key.toLowerCase()).digest('base64url').slice(0, 32);
}
