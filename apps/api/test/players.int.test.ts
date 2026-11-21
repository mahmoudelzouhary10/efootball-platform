import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { playerProfiles } from '../src/db/schema';
import { createHarness, Harness, sessionCookie } from './harness';
import { API, PASSWORD, player, pngBuffer, upload, verifiedUser } from './fixtures';

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});
afterAll(async () => {
  await h.close();
});
beforeEach(async () => {
  await h.reset();
});

const profile = { gameId: 'ABCD-1234-EFGH', displayName: 'محمود الزهيري', countryCode: 'EG' };

describe('player profile creation', () => {
  it('requires a verified email', async () => {
    const res = await h.http
      .post(`${API}/auth/register`)
      .send({ email: 'unverified@example.com', username: 'unverified', password: PASSWORD });
    const cookie = sessionCookie(res)!;
    const create = await h.http
      .post(`${API}/me/player-profile`)
      .set('Cookie', cookie)
      .send(profile);
    expect(create.status).toBe(403);
    expect(create.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('creates an unverified-game-ID profile with an Arabic display name', async () => {
    const actor = await verifiedUser(h, 'mahmoud');
    const res = await h.http
      .post(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send(profile);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      username: 'mahmoud',
      displayName: 'محمود الزهيري',
      gameId: 'ABCD-1234-EFGH',
      countryCode: 'EG',
      gameIdVerified: false,
      clan: null,
    });
  });

  it('allows only one profile per account', async () => {
    const actor = await player(h, 'one_only');
    const again = await h.http
      .post(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send({ ...profile, gameId: 'ZZZZ-9999' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('PROFILE_EXISTS');
  });

  it('treats game IDs that differ only in case and separators as the same ID', async () => {
    await player(h, 'first_owner', { gameId: 'ABCD-1234-EFGH' });
    const second = await verifiedUser(h, 'second_try');
    const res = await h.http
      .post(`${API}/me/player-profile`)
      .set('Cookie', second.cookie)
      .send({ ...profile, gameId: 'abcd 1234 efgh' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('GAME_ID_TAKEN');
  });

  it('lets exactly one of two concurrent claims on the same game ID win', async () => {
    const a = await verifiedUser(h, 'racer_a');
    const b = await verifiedUser(h, 'racer_b');
    const results = await Promise.all(
      [a, b].map((x) =>
        h.http.post(`${API}/me/player-profile`).set('Cookie', x.cookie).send(profile),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('rejects an unknown country and unknown fields', async () => {
    const actor = await verifiedUser(h, 'bad_input');
    const country = await h.http
      .post(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send({ ...profile, countryCode: 'ZZ' });
    expect(country.body.errors.countryCode).toContain('country_invalid');
    const extra = await h.http
      .post(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send({ ...profile, gameIdVerified: true });
    expect(extra.status).toBe(400);
  });
});

describe('player profile updates', () => {
  it('resets game ID verification when the ID changes, and keeps it otherwise', async () => {
    const actor = await player(h, 'changer');
    await h.db.update(playerProfiles).set({ gameIdVerifiedAt: new Date() });

    const rename = await h.http
      .patch(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send({ displayName: 'New Name' });
    expect(rename.body.gameIdVerified).toBe(true);

    const sameIdDifferentFormat = await h.http
      .patch(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send({ gameId: rename.body.gameId.toLowerCase() });
    expect(sameIdDifferentFormat.body.gameIdVerified).toBe(true);

    const newId = await h.http
      .patch(`${API}/me/player-profile`)
      .set('Cookie', actor.cookie)
      .send({ gameId: 'NEW-ID-000123' });
    expect(newId.status).toBe(200);
    expect(newId.body.gameIdVerified).toBe(false);
  });

  it('cannot take an ID that belongs to someone else', async () => {
    await player(h, 'owner_x', { gameId: 'OWNED-ID-1' });
    const other = await player(h, 'thief_x');
    const res = await h.http
      .patch(`${API}/me/player-profile`)
      .set('Cookie', other.cookie)
      .send({ gameId: 'owned id 1' });
    expect(res.body.code).toBe('GAME_ID_TAKEN');
  });

  it('accepts only the uploader’s own avatar', async () => {
    const alice = await player(h, 'alice');
    const bob = await player(h, 'bob_b');
    const bobsAvatar = await upload(h, bob, 'avatar');
    const steal = await h.http
      .patch(`${API}/me/player-profile`)
      .set('Cookie', alice.cookie)
      .send({ avatarMediaId: bobsAvatar });
    expect(steal.status).toBe(400);
    expect(steal.body.code).toBe('MEDIA_INVALID');

    const own = await upload(h, alice, 'avatar');
    const ok = await h.http
      .patch(`${API}/me/player-profile`)
      .set('Cookie', alice.cookie)
      .send({ avatarMediaId: own });
    expect(ok.body.avatarUrl).toBe(`/api/v1/media/${own}`);
  });
});

describe('public player page', () => {
  it('is public and hides private fields', async () => {
    await player(h, 'public_one');
    const res = await h.http.get(`${API}/players/public_one`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('userId');
  });

  it('404s for unknown and malformed usernames', async () => {
    expect((await h.http.get(`${API}/players/nobody_here`)).status).toBe(404);
    expect((await h.http.get(`${API}/players/bad%20name`)).status).toBe(404);
  });
});

describe('image uploads', () => {
  it('re-encodes to a 512×512 WebP and serves it publicly with immutable caching', async () => {
    const actor = await player(h, 'uploader');
    const res = await h.http
      .post(`${API}/media/images?kind=avatar`)
      .set('Cookie', actor.cookie)
      .attach('file', await pngBuffer(900, 600), { filename: 'me.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ width: 512, height: 512 });

    const file = await h.http.get(res.body.url);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toBe('image/webp');
    expect(file.headers['cache-control']).toContain('immutable');
    expect(file.body.subarray(8, 12).toString()).toBe('WEBP');
  });

  it('rejects files that are not images even with an image content type', async () => {
    const actor = await player(h, 'sneaky');
    const res = await h.http
      .post(`${API}/media/images?kind=avatar`)
      .set('Cookie', actor.cookie)
      .attach('file', Buffer.from('<svg onload="alert(1)"></svg>'), {
        filename: 'x.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MEDIA_INVALID');
  });

  it('rejects SVG and tiny images', async () => {
    const actor = await player(h, 'svg_user');
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200"/></svg>',
    );
    const res = await h.http
      .post(`${API}/media/images?kind=avatar`)
      .set('Cookie', actor.cookie)
      .attach('file', svg, { filename: 'x.svg', contentType: 'image/svg+xml' });
    expect(res.body.code).toBe('MEDIA_INVALID');

    const tiny = await h.http
      .post(`${API}/media/images?kind=avatar`)
      .set('Cookie', actor.cookie)
      .attach('file', await pngBuffer(20, 20), { filename: 't.png', contentType: 'image/png' });
    expect(tiny.body.code).toBe('MEDIA_INVALID');
  });

  it('rejects files over 2 MB', async () => {
    const actor = await player(h, 'big_file');
    const res = await h.http
      .post(`${API}/media/images?kind=avatar`)
      .set('Cookie', actor.cookie)
      .attach('file', Buffer.alloc(2 * 1024 * 1024 + 10, 1), {
        filename: 'big.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(413);
  });

  it('requires sign-in and a verified email to upload', async () => {
    const anon = await h.http
      .post(`${API}/media/images?kind=avatar`)
      .attach('file', await pngBuffer(), { filename: 'a.png', contentType: 'image/png' });
    expect(anon.status).toBe(401);
  });
});
