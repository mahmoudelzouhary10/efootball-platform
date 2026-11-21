import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, usernameSchema } from './auth';

describe('usernameSchema', () => {
  it.each(['abc', 'Player_10', 'a'.repeat(20)])('accepts %s', (v) => {
    expect(usernameSchema.safeParse(v).success).toBe(true);
  });

  it.each(['ab', 'a'.repeat(21), 'has space', 'محمود', 'dash-name', 'Admin', 'ROOT'])(
    'rejects %s',
    (v) => {
      expect(usernameSchema.safeParse(v).success).toBe(false);
    },
  );
});

describe('registerSchema', () => {
  const valid = { email: 'p@example.com', username: 'player1', password: 'long-enough-pw' };

  it('accepts a valid payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown fields (mass-assignment guard)', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false);
  });

  it('rejects short passwords', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });

  it('rejects malformed emails', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('trims the identifier', () => {
    const r = loginSchema.parse({ identifier: '  player1 ', password: 'x' });
    expect(r.identifier).toBe('player1');
  });
});
