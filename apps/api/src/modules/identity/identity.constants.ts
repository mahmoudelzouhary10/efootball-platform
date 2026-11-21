import type { RateLimitRule } from '../../common/rate-limit/rate-limiter.service';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SESSION_IDLE_TTL_MS = 7 * DAY;
export const SESSION_ABSOLUTE_TTL_MS = 30 * DAY;
/** Avoid a DB write on every request: only extend the idle expiry this often. */
export const SESSION_TOUCH_INTERVAL_MS = 5 * MINUTE;

export const EMAIL_VERIFICATION_TTL_MS = 24 * HOUR;
export const PASSWORD_RESET_TTL_MS = 30 * MINUTE;

export const SESSION_COOKIE = 'efp_session';
/** With Secure cookies we use the __Host- prefix: no Domain, Path=/, HTTPS only. */
export const SESSION_COOKIE_SECURE = '__Host-efp_session';

export const RateLimits = {
  loginByIp: { name: 'login:ip', limit: 30, windowSeconds: 15 * 60 },
  loginByAccount: { name: 'login:account', limit: 10, windowSeconds: 15 * 60 },
  registerByIp: { name: 'register:ip', limit: 10, windowSeconds: 60 * 60 },
  resetRequestByIp: { name: 'reset-request:ip', limit: 10, windowSeconds: 60 * 60 },
  resetRequestByEmail: { name: 'reset-request:email', limit: 3, windowSeconds: 60 * 60 },
  resendVerificationByUser: { name: 'resend-verification:user', limit: 3, windowSeconds: 60 * 60 },
  tokenRedeemByIp: { name: 'token-redeem:ip', limit: 30, windowSeconds: 15 * 60 },
  passwordChangeByUser: { name: 'password-change:user', limit: 10, windowSeconds: 15 * 60 },
} satisfies Record<string, RateLimitRule>;
