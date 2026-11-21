import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sessions, users } from '../src/db/schema';
import {
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
} from '../src/modules/identity/identity.constants';
import { createHarness, Harness, sessionCookie, tokenFromMail, validUser } from './harness';

let h: Harness;
const API = '/api/v1';

beforeAll(async () => {
  h = await createHarness();
});
afterAll(async () => {
  await h.close();
});
beforeEach(async () => {
  await h.reset();
});

async function register(body: Partial<typeof validUser> = {}) {
  return h.http.post(`${API}/auth/register`).send({ ...validUser, ...body });
}

async function registerAndGetCookie(body: Partial<typeof validUser> = {}): Promise<string> {
  const res = await register(body);
  expect(res.status).toBe(201);
  return sessionCookie(res)!;
}

describe('registration', () => {
  it('creates the account, signs in with a hardened cookie, and emails a verification link', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: validUser.email,
      username: validUser.username,
      emailVerified: false,
      roles: [],
    });
    expect(res.body).not.toHaveProperty('passwordHash');

    const raw = (res.headers['set-cookie'] as unknown as string[])[0]!;
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);
    expect(raw).toMatch(/Path=\//);

    expect(h.mailer.lastTo(validUser.email)?.text).toContain('/verify-email?token=');

    const [row] = await h.db.select().from(users);
    expect(row!.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('rejects a duplicate email regardless of case', async () => {
    await register();
    const res = await register({ email: 'PLAYER.ONE@Example.com', username: 'other_name' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('rejects a duplicate username regardless of case', async () => {
    await register();
    const res = await register({ email: 'two@example.com', username: 'playerone' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USERNAME_TAKEN');
  });

  it('lets exactly one of two concurrent sign-ups with the same username succeed', async () => {
    const results = await Promise.all([
      register({ email: 'a@example.com', username: 'race_name' }),
      register({ email: 'b@example.com', username: 'RACE_NAME' }),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
    expect(await h.db.select().from(users)).toHaveLength(1);
  });

  it('rejects unknown fields so clients cannot assign roles or status', async () => {
    const res = await h.http.post(`${API}/auth/register`).send({ ...validUser, roles: ['admin'] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it.each([
    ['common password', { password: 'password123' }, 'password_common'],
    [
      'password containing the username',
      { password: 'playerone-rocks!' },
      'password_contains_username',
    ],
  ])('rejects a %s', async (_label, body, reason) => {
    const res = await register(body);
    expect(res.status).toBe(400);
    expect(res.body.errors.password).toContain(reason);
  });

  it('rejects malformed JSON with a problem response, not a stack trace', async () => {
    const res = await h.http
      .post(`${API}/auth/register`)
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

describe('login', () => {
  beforeEach(async () => {
    await register();
  });

  it.each([
    ['email', validUser.email],
    ['username', validUser.username],
    ['username in another case', 'PLAYERONE'],
  ])('accepts the %s as identifier', async (_label, identifier) => {
    const res = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(validUser.username);
    expect(sessionCookie(res)).toBeDefined();
  });

  it('returns the same error for a wrong password and an unknown account', async () => {
    const wrong = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: validUser.username, password: 'not the password' });
    const unknown = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: 'nobody_here', password: 'not the password' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rate-limits repeated attempts on one account with 429 and Retry-After', async () => {
    for (let i = 0; i < 10; i++) {
      await h.http
        .post(`${API}/auth/login`)
        .send({ identifier: validUser.username, password: 'wrong-pass' });
    }
    const res = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: validUser.username, password: validUser.password });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('rate-limits by client IP across different accounts', async () => {
    for (let i = 0; i < 30; i++) {
      await h.http
        .post(`${API}/auth/login`)
        .set('X-Forwarded-For', '203.0.113.7')
        .send({ identifier: `user_${i}`, password: 'wrong-pass' });
    }
    const res = await h.http
      .post(`${API}/auth/login`)
      .set('X-Forwarded-For', '203.0.113.7')
      .send({ identifier: validUser.username, password: validUser.password });
    expect(res.status).toBe(429);

    const otherIp = await h.http
      .post(`${API}/auth/login`)
      .set('X-Forwarded-For', '198.51.100.9')
      .send({ identifier: validUser.username, password: validUser.password });
    expect(otherIp.status).toBe(200);
  });

  it('refuses a disabled account only after the correct password', async () => {
    await h.db.update(users).set({ status: 'disabled' });
    const wrong = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: validUser.username, password: 'not the password' });
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
    const right = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: validUser.username, password: validUser.password });
    expect(right.status).toBe(403);
    expect(right.body.code).toBe('ACCOUNT_DISABLED');
  });
});

describe('sessions', () => {
  it('requires a session for /auth/me', async () => {
    const res = await h.http.get(`${API}/auth/me`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('ignores a forged cookie', async () => {
    const res = await h.http.get(`${API}/auth/me`).set('Cookie', 'efp_session=forged-token-value');
    expect(res.status).toBe(401);
  });

  it('logout revokes the session server-side', async () => {
    const cookie = await registerAndGetCookie();
    expect((await h.http.post(`${API}/auth/logout`).set('Cookie', cookie)).status).toBe(204);
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', cookie)).status).toBe(401);
  });

  it('logout-all revokes every device', async () => {
    const first = await registerAndGetCookie();
    const second = sessionCookie(
      await h.http
        .post(`${API}/auth/login`)
        .send({ identifier: validUser.email, password: validUser.password }),
    )!;
    await h.http.post(`${API}/auth/logout-all`).set('Cookie', second);
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', first)).status).toBe(401);
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', second)).status).toBe(401);
  });

  it('expires after the idle timeout without activity', async () => {
    const cookie = await registerAndGetCookie();
    h.clock.advance(SESSION_IDLE_TTL_MS + 1_000);
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', cookie)).status).toBe(401);
  });

  it('activity extends the idle timeout but never past the absolute limit', async () => {
    const cookie = await registerAndGetCookie();
    const step = SESSION_IDLE_TTL_MS - 60_000;
    let elapsed = 0;
    while (elapsed + step < SESSION_ABSOLUTE_TTL_MS) {
      h.clock.advance(step);
      elapsed += step;
      expect((await h.http.get(`${API}/auth/me`).set('Cookie', cookie)).status).toBe(200);
    }
    h.clock.advance(SESSION_ABSOLUTE_TTL_MS - elapsed + 1_000);
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', cookie)).status).toBe(401);
  });

  it('stores only a hash of the session token', async () => {
    const cookie = await registerAndGetCookie();
    const token = cookie.split('=')[1]!;
    const rows = await h.db.select().from(sessions);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).not.toContain(token);
    expect(rows[0]!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('a disabled account loses access on its existing sessions', async () => {
    const cookie = await registerAndGetCookie();
    await h.db.update(users).set({ status: 'disabled' });
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', cookie)).status).toBe(401);
  });
});

describe('email verification', () => {
  it('verifies with the emailed token, once', async () => {
    const cookie = await registerAndGetCookie();
    const token = tokenFromMail(h.mailer, validUser.email);

    expect((await h.http.post(`${API}/auth/verify-email`).send({ token })).status).toBe(204);
    const me = await h.http.get(`${API}/auth/me`).set('Cookie', cookie);
    expect(me.body.emailVerified).toBe(true);

    const again = await h.http.post(`${API}/auth/verify-email`).send({ token });
    expect(again.status).toBe(400);
    expect(again.body.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired token', async () => {
    await register();
    const token = tokenFromMail(h.mailer, validUser.email);
    h.clock.advance(EMAIL_VERIFICATION_TTL_MS + 1_000);
    const res = await h.http.post(`${API}/auth/verify-email`).send({ token });
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('resending invalidates the previous link', async () => {
    const cookie = await registerAndGetCookie();
    const first = tokenFromMail(h.mailer, validUser.email);
    expect(
      (await h.http.post(`${API}/auth/verify-email/resend`).set('Cookie', cookie)).status,
    ).toBe(202);
    const second = tokenFromMail(h.mailer, validUser.email);
    expect(second).not.toBe(first);
    expect((await h.http.post(`${API}/auth/verify-email`).send({ token: first })).status).toBe(400);
    expect((await h.http.post(`${API}/auth/verify-email`).send({ token: second })).status).toBe(
      204,
    );
  });
});

describe('password reset', () => {
  it('answers 202 for unknown emails without sending anything', async () => {
    const res = await h.http
      .post(`${API}/auth/password-reset/request`)
      .send({ email: 'ghost@example.com' });
    expect(res.status).toBe(202);
    expect(h.mailer.sent).toHaveLength(0);
  });

  it('resets the password, signs out all devices, and the token works once', async () => {
    const cookie = await registerAndGetCookie();
    h.mailer.clear();
    await h.http.post(`${API}/auth/password-reset/request`).send({ email: validUser.email });
    const token = tokenFromMail(h.mailer, validUser.email);
    const newPassword = 'a brand new passphrase';

    const res = await h.http
      .post(`${API}/auth/password-reset/confirm`)
      .send({ token, password: newPassword });
    expect(res.status).toBe(204);

    expect((await h.http.get(`${API}/auth/me`).set('Cookie', cookie)).status).toBe(401);
    const oldLogin = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: validUser.username, password: validUser.password });
    expect(oldLogin.status).toBe(401);
    const newLogin = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: validUser.username, password: newPassword });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.emailVerified).toBe(true);

    const reuse = await h.http
      .post(`${API}/auth/password-reset/confirm`)
      .send({ token, password: 'another passphrase here' });
    expect(reuse.body.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired reset token', async () => {
    await register();
    h.mailer.clear();
    await h.http.post(`${API}/auth/password-reset/request`).send({ email: validUser.email });
    const token = tokenFromMail(h.mailer, validUser.email);
    h.clock.advance(PASSWORD_RESET_TTL_MS + 1_000);
    const res = await h.http
      .post(`${API}/auth/password-reset/confirm`)
      .send({ token, password: 'a brand new passphrase' });
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('a rejected new password does not burn the token', async () => {
    await register();
    h.mailer.clear();
    await h.http.post(`${API}/auth/password-reset/request`).send({ email: validUser.email });
    const token = tokenFromMail(h.mailer, validUser.email);
    const weak = await h.http
      .post(`${API}/auth/password-reset/confirm`)
      .send({ token, password: 'password123' });
    expect(weak.status).toBe(400);
    const ok = await h.http
      .post(`${API}/auth/password-reset/confirm`)
      .send({ token, password: 'a brand new passphrase' });
    expect(ok.status).toBe(204);
  });
});

describe('change password', () => {
  it('requires the current password and keeps only the current session', async () => {
    const current = await registerAndGetCookie();
    const other = sessionCookie(
      await h.http
        .post(`${API}/auth/login`)
        .send({ identifier: validUser.email, password: validUser.password }),
    )!;

    const wrong = await h.http
      .post(`${API}/auth/password`)
      .set('Cookie', current)
      .send({ currentPassword: 'nope nope nope', newPassword: 'another long passphrase' });
    expect(wrong.status).toBe(401);

    const ok = await h.http
      .post(`${API}/auth/password`)
      .set('Cookie', current)
      .send({ currentPassword: validUser.password, newPassword: 'another long passphrase' });
    expect(ok.status).toBe(204);

    expect((await h.http.get(`${API}/auth/me`).set('Cookie', current)).status).toBe(200);
    expect((await h.http.get(`${API}/auth/me`).set('Cookie', other)).status).toBe(401);

    const [user] = await h.db.select().from(users).where(eq(users.username, validUser.username));
    expect(user!.passwordChangedAt).not.toBeNull();
  });
});
