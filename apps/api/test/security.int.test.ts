import { desc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLogs, users } from '../src/db/schema';
import { RoleService } from '../src/modules/access/role.service';
import { createHarness, Harness, sessionCookie, validUser } from './harness';

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

async function signUp(username: string): Promise<string> {
  const res = await h.http
    .post(`${API}/auth/register`)
    .send({ email: `${username}@example.com`, username, password: validUser.password });
  expect(res.status).toBe(201);
  return sessionCookie(res)!;
}

describe('CSRF origin check', () => {
  it('rejects a state-changing request from a foreign origin', async () => {
    const res = await h.http
      .post(`${API}/auth/login`)
      .set('Origin', 'https://evil.example')
      .send({ identifier: 'x', password: 'y' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_REJECTED');
  });

  it('falls back to Referer when Origin is missing', async () => {
    const res = await h.http
      .post(`${API}/auth/login`)
      .set('Referer', 'https://evil.example/page')
      .send({ identifier: 'x', password: 'y' });
    expect(res.status).toBe(403);
  });

  it('rejects the opaque "null" origin (sandboxed iframes, data: URLs)', async () => {
    const res = await h.http
      .post(`${API}/auth/login`)
      .set('Origin', 'null')
      .send({ identifier: 'x', password: 'y' });
    expect(res.status).toBe(403);
  });

  it('accepts the configured web origin', async () => {
    const res = await h.http
      .post(`${API}/auth/register`)
      .set('Origin', 'http://localhost:3000')
      .send(validUser);
    expect(res.status).toBe(201);
  });

  it('does not block safe methods', async () => {
    const res = await h.http.get(`${API}/health`).set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
  });
});

describe('authorization', () => {
  it('denies the audit log to anonymous users (401) and to regular users (403)', async () => {
    expect((await h.http.get(`${API}/admin/audit-logs`)).status).toBe(401);
    const cookie = await signUp('regular_user');
    const res = await h.http.get(`${API}/admin/audit-logs`).set('Cookie', cookie);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('denies moderators the audit log (admin-only permission)', async () => {
    const cookie = await signUp('mod_user');
    await h.app.get(RoleService).grant('mod_user', 'moderator', null);
    expect((await h.http.get(`${API}/admin/audit-logs`).set('Cookie', cookie)).status).toBe(403);
  });

  it('lets admins page through the audit log, newest first', async () => {
    const cookie = await signUp('admin_user');
    await h.app.get(RoleService).grant('admin_user', 'admin', null);
    for (let i = 0; i < 3; i++) await signUp(`filler_${i}`);

    const first = await h.http.get(`${API}/admin/audit-logs?limit=2`).set('Cookie', cookie);
    expect(first.status).toBe(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const seen = new Set<string>(first.body.items.map((i: { id: string }) => i.id));
    let cursor: string | null = first.body.nextCursor;
    while (cursor) {
      const page = await h.http
        .get(`${API}/admin/audit-logs?limit=2&cursor=${encodeURIComponent(cursor)}`)
        .set('Cookie', cookie);
      for (const item of page.body.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      cursor = page.body.nextCursor;
    }
    const total = await h.db.select().from(auditLogs);
    expect(seen.size).toBe(total.length);
  });

  it('rejects an out-of-range page size', async () => {
    const cookie = await signUp('admin_two');
    await h.app.get(RoleService).grant('admin_two', 'admin', null);
    const res = await h.http.get(`${API}/admin/audit-logs?limit=500`).set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  it('records role grants in the audit log, once', async () => {
    await signUp('to_promote');
    const roles = h.app.get(RoleService);
    await roles.grant('to_promote', 'moderator', null);
    await roles.grant('to_promote', 'moderator', null);
    const [user] = await h.db.select().from(users).where(eq(users.username, 'to_promote'));
    const grants = await h.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'role.grant'))
      .orderBy(desc(auditLogs.createdAt));
    expect(grants).toHaveLength(1);
    expect(grants[0]!.targetId).toBe(user!.id);
  });
});

describe('database constraints (defence in depth)', () => {
  it('rejects a username that bypasses API validation', async () => {
    await expect(
      h.db
        .insert(users)
        .values({ email: 'x@example.com', username: 'bad name!', passwordHash: 'x' }),
    ).rejects.toThrow();
  });

  it('rejects an unknown account status', async () => {
    await expect(
      h.db.insert(users).values({
        email: 'y@example.com',
        username: 'okname',
        passwordHash: 'x',
        status: 'banned' as 'active',
      }),
    ).rejects.toThrow();
  });
});

describe('HTTP hygiene', () => {
  it('returns problem+json for unknown routes', async () => {
    const res = await h.http.get(`${API}/does-not-exist`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('rejects oversized bodies', async () => {
    const res = await h.http
      .post(`${API}/auth/login`)
      .send({ identifier: 'x'.repeat(200_000), password: 'y' });
    expect(res.status).toBe(413);
  });

  it('sets security headers and hides the framework', async () => {
    const res = await h.http.get(`${API}/health`);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });
});
