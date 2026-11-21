import sharp from 'sharp';
import { expect } from 'vitest';
import { RoleService } from '../src/modules/access/role.service';
import { Harness, sessionCookie, tokenFromMail } from './harness';

export const API = '/api/v1';
export const PASSWORD = 'correct horse battery';

export interface Actor {
  username: string;
  cookie: string;
}

/** Registers and verifies an account; returns its session cookie. */
export async function verifiedUser(h: Harness, username: string): Promise<Actor> {
  const email = `${username}@example.com`;
  const res = await h.http
    .post(`${API}/auth/register`)
    .send({ email, username, password: PASSWORD });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  const cookie = sessionCookie(res)!;
  const verify = await h.http
    .post(`${API}/auth/verify-email`)
    .send({ token: tokenFromMail(h.mailer, email) });
  expect(verify.status).toBe(204);
  return { username, cookie };
}

let gameIdSeq = 0;

/** Verified account + player profile. */
export async function player(
  h: Harness,
  username: string,
  overrides: Record<string, unknown> = {},
): Promise<Actor> {
  const actor = await verifiedUser(h, username);
  gameIdSeq += 1;
  const res = await h.http
    .post(`${API}/me/player-profile`)
    .set('Cookie', actor.cookie)
    .send({
      gameId: `GID-${String(gameIdSeq).padStart(6, '0')}`,
      displayName: `Player ${username}`.slice(0, 24),
      countryCode: 'EG',
      ...overrides,
    });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return actor;
}

export async function admin(h: Harness, username = 'site_admin'): Promise<Actor> {
  const actor = await verifiedUser(h, username);
  await h.app.get(RoleService).grant(username, 'admin', null);
  return actor;
}

export async function moderator(h: Harness, username = 'site_mod'): Promise<Actor> {
  const actor = await verifiedUser(h, username);
  await h.app.get(RoleService).grant(username, 'moderator', null);
  return actor;
}

/** A real PNG generated in memory (so uploads go through the actual decoder). */
export async function pngBuffer(width = 300, height = 300): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 200, b: 90 } },
  })
    .png()
    .toBuffer();
}

export async function upload(
  h: Harness,
  actor: Actor,
  kind: 'clan_logo' | 'avatar',
): Promise<string> {
  const res = await h.http
    .post(`${API}/media/images?kind=${kind}`)
    .set('Cookie', actor.cookie)
    .attach('file', await pngBuffer(), { filename: 'logo.png', contentType: 'image/png' });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.id as string;
}

let tagSeq = 0;

/** Submits a clan application and returns its id plus the tag used. */
export async function applyForClan(
  h: Harness,
  actor: Actor,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; tag: string }> {
  tagSeq += 1;
  const tag = `C${tagSeq}`.padEnd(3, 'X').slice(0, 5);
  const logoMediaId = await upload(h, actor, 'clan_logo');
  const res = await h.http
    .post(`${API}/clan-applications`)
    .set('Cookie', actor.cookie)
    .send({
      name: `Clan ${tag}`,
      tag,
      logoMediaId,
      description: 'A competitive eFootball clan for serious players.',
      contactUrl: 'https://discord.gg/example',
      ...overrides,
    });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return {
    id: res.body.id as string,
    tag: (overrides.tag as string | undefined)?.toUpperCase() ?? tag,
  };
}

/** Full path to an active clan led by `leader`. */
export async function approvedClan(
  h: Harness,
  leader: Actor,
  reviewer: Actor,
  overrides = {},
): Promise<string> {
  const app = await applyForClan(h, leader, overrides);
  const res = await h.http
    .post(`${API}/admin/clan-applications/${app.id}/approve`)
    .set('Cookie', reviewer.cookie);
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return app.tag;
}

/** Leader invites, player accepts. */
export async function addMember(
  h: Harness,
  tag: string,
  leader: Actor,
  member: Actor,
): Promise<void> {
  const inv = await h.http
    .post(`${API}/clans/${tag}/invitations`)
    .set('Cookie', leader.cookie)
    .send({ username: member.username });
  expect(inv.status, JSON.stringify(inv.body)).toBe(204);
  const mine = await h.http.get(`${API}/me/clan`).set('Cookie', member.cookie);
  const invitation = mine.body.invitations.find(
    (i: { clan: { tag: string } }) => i.clan.tag === tag,
  );
  const acc = await h.http
    .post(`${API}/clan-invitations/${invitation.id}/accept`)
    .set('Cookie', member.cookie);
  expect(acc.status, JSON.stringify(acc.body)).toBe(204);
}
