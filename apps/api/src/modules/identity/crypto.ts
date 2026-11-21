import { createHash, randomBytes } from 'node:crypto';

/** 256-bit random token, URL-safe. Used for session cookies and emailed links. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Tokens are high-entropy, so a fast hash is sufficient (no salt/KDF needed) and lets us
 * look them up by hash. Only the hash is stored: a database leak doesn't expose live tokens.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
