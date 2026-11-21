import { and, eq, isNull, sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CLAN_MAX_MEMBERS } from '@efp/contracts';
import {
  auditLogs,
  clanInvitations,
  clanMemberships,
  clans,
  playerProfiles,
} from '../src/db/schema';
import { createHarness, Harness } from './harness';
import {
  Actor,
  API,
  addMember,
  admin,
  applyForClan,
  approvedClan,
  moderator,
  player,
  upload,
  verifiedUser,
} from './fixtures';

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

const post = (path: string, actor: Actor, body?: object) => {
  const req = h.http.post(`${API}${path}`).set('Cookie', actor.cookie);
  return body ? req.send(body) : req;
};
const get = (path: string, actor?: Actor) => {
  const req = h.http.get(`${API}${path}`);
  return actor ? req.set('Cookie', actor.cookie) : req;
};

async function roleOf(tag: string, username: string): Promise<string | null> {
  const res = await get(`/clans/${tag}`);
  return res.body.members.find((m: { username: string }) => m.username === username)?.role ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('clan applications', () => {
  it('requires a player profile', async () => {
    const noProfile = await verifiedUser(h, 'no_profile');
    const logo = await upload(h, noProfile, 'clan_logo');
    const res = await post('/clan-applications', noProfile, {
      name: 'Nile Kings',
      tag: 'NILE',
      logoMediaId: logo,
      description: 'Ten characters at least.',
      contactUrl: 'https://discord.gg/x',
    });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PROFILE_REQUIRED');
  });

  it('creates nothing until an admin approves', async () => {
    const p = await player(h, 'founder');
    await applyForClan(h, p, { tag: 'WAIT' });
    expect((await get('/clans/WAIT')).status).toBe(404);
    expect((await get('/clans')).body.items).toHaveLength(0);
    const mine = await get('/me/clan', p);
    expect(mine.body.application.status).toBe('pending');
    expect(mine.body.membership).toBeNull();
  });

  it('allows only one pending application per player', async () => {
    const p = await player(h, 'eager');
    await applyForClan(h, p);
    const logo = await upload(h, p, 'clan_logo');
    const second = await post('/clan-applications', p, {
      name: 'Second Try',
      tag: 'SEC',
      logoMediaId: logo,
      description: 'Another description here.',
      contactUrl: 'https://discord.gg/x',
    });
    expect(second.body.code).toBe('APPLICATION_PENDING');
  });

  it('blocks a name or tag already pending or taken, case-insensitively', async () => {
    const a = await player(h, 'player_a');
    const b = await player(h, 'player_b');
    await applyForClan(h, a, { name: 'Cairo Eagles', tag: 'CEG' });
    const logo = await upload(h, b, 'clan_logo');
    const base = {
      logoMediaId: logo,
      description: 'Description long enough.',
      contactUrl: 'https://x.com/a',
    };
    const sameName = await post('/clan-applications', b, {
      ...base,
      name: 'cairo eagles',
      tag: 'OTH',
    });
    expect(sameName.body.code).toBe('CLAN_NAME_TAKEN');
    const sameTag = await post('/clan-applications', b, {
      ...base,
      name: 'Other Name',
      tag: 'ceg',
    });
    expect(sameTag.body.code).toBe('CLAN_TAG_TAKEN');
  });

  it('refuses another user’s logo', async () => {
    const a = await player(h, 'logo_owner');
    const b = await player(h, 'logo_thief');
    const logo = await upload(h, a, 'clan_logo');
    const res = await post('/clan-applications', b, {
      name: 'Borrowed Logo',
      tag: 'BRW',
      logoMediaId: logo,
      description: 'Description long enough.',
      contactUrl: 'https://x.com/a',
    });
    expect(res.body.code).toBe('MEDIA_INVALID');
  });

  it('can be withdrawn while pending, and then a new one submitted', async () => {
    const p = await player(h, 'withdrawer');
    const app = await applyForClan(h, p);
    expect((await post(`/clan-applications/${app.id}/withdraw`, p)).status).toBe(204);
    expect((await post(`/clan-applications/${app.id}/withdraw`, p)).body.code).toBe(
      'APPLICATION_NOT_PENDING',
    );
    await applyForClan(h, p);
  });
});

describe('admin review', () => {
  it('is closed to anonymous users and regular players', async () => {
    const p = await player(h, 'regular');
    const app = await applyForClan(h, p);
    expect((await get('/admin/clan-applications')).status).toBe(401);
    expect((await get('/admin/clan-applications', p)).status).toBe(403);
    expect((await post(`/admin/clan-applications/${app.id}/approve`, p)).status).toBe(403);
    expect((await get('/admin/overview', p)).status).toBe(403);
  });

  it('lets moderators review (but not read the audit log)', async () => {
    const p = await player(h, 'mod_case');
    const mod = await moderator(h);
    await applyForClan(h, p, { tag: 'MODX' });
    const queue = await get('/admin/clan-applications', mod);
    expect(queue.status).toBe(200);
    expect(queue.body.items[0]).toMatchObject({
      tag: 'MODX',
      checks: { nameAvailable: true, tagAvailable: true },
    });
    expect(queue.body.items[0].applicant.email).toBe('mod_case@example.com');
    expect((await get('/admin/audit-logs', mod)).status).toBe(403);
  });

  it('shows the review criteria: name, tag, logo, description, contact link', async () => {
    const p = await player(h, 'criteria');
    const reviewer = await admin(h);
    const app = await applyForClan(h, p, { name: 'Pharaohs FC', tag: 'PHR' });
    const res = await get(`/admin/clan-applications/${app.id}`, reviewer);
    expect(res.body).toMatchObject({
      name: 'Pharaohs FC',
      tag: 'PHR',
      description: expect.any(String),
      contactUrl: 'https://discord.gg/example',
      logoUrl: expect.stringMatching(/^\/api\/v1\/media\//),
      status: 'pending',
    });
  });

  it('approval creates the clan with the applicant as leader, atomically', async () => {
    const founder = await player(h, 'leader_one');
    const reviewer = await admin(h);
    const tag = await approvedClan(h, founder, reviewer, { tag: 'LEAD' });
    const clan = await get(`/clans/${tag}`);
    expect(clan.body.members).toEqual([
      expect.objectContaining({ username: 'leader_one', role: 'leader' }),
    ]);
    const mine = await get('/me/clan', founder);
    expect(mine.body.membership).toMatchObject({ role: 'leader', clan: { tag: 'LEAD' } });
    expect(mine.body.application).toMatchObject({ status: 'approved', clanTag: 'LEAD' });

    const logged = await h.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'clan_application.approve'));
    expect(logged).toHaveLength(1);
  });

  it('rejection needs a reason and shows it to the applicant', async () => {
    const p = await player(h, 'rejected_one');
    const reviewer = await admin(h);
    const app = await applyForClan(h, p);
    expect(
      (await post(`/admin/clan-applications/${app.id}/reject`, reviewer, { reason: '' })).status,
    ).toBe(400);
    const res = await post(`/admin/clan-applications/${app.id}/reject`, reviewer, {
      reason: 'The logo contains an offensive image.',
    });
    expect(res.status).toBe(200);
    const mine = await get('/me/clan', p);
    expect(mine.body.application).toMatchObject({
      status: 'rejected',
      rejectionReason: 'The logo contains an offensive image.',
    });
  });

  it('a decided application cannot be decided again', async () => {
    const p = await player(h, 'decided');
    const reviewer = await admin(h);
    const app = await applyForClan(h, p);
    await post(`/admin/clan-applications/${app.id}/approve`, reviewer);
    const again = await post(`/admin/clan-applications/${app.id}/reject`, reviewer, {
      reason: 'Too late now.',
    });
    expect(again.body.code).toBe('APPLICATION_NOT_PENDING');
  });

  it('two reviewers approving at the same time create exactly one clan', async () => {
    const p = await player(h, 'double_approve');
    const r1 = await admin(h, 'admin_one');
    const r2 = await admin(h, 'admin_two');
    const app = await applyForClan(h, p);
    const results = await Promise.all([
      post(`/admin/clan-applications/${app.id}/approve`, r1),
      post(`/admin/clan-applications/${app.id}/approve`, r2),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await h.db.select().from(clans)).toHaveLength(1);
  });

  it('refuses approval if the applicant joined another clan meanwhile', async () => {
    const reviewer = await admin(h);
    const leader = await player(h, 'other_leader');
    const tag = await approvedClan(h, leader, reviewer);
    const applicant = await player(h, 'switcher');
    const app = await applyForClan(h, applicant);
    await addMember(h, tag, leader, applicant);
    const res = await post(`/admin/clan-applications/${app.id}/approve`, reviewer);
    expect(res.body.code).toBe('ALREADY_IN_CLAN');
  });

  it('pages through the queue oldest-first without duplicates', async () => {
    const reviewer = await admin(h);
    for (let i = 0; i < 5; i++) await applyForClan(h, await player(h, `queued_${i}`));
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await get(
        `/admin/clan-applications?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        reviewer,
      );
      seen.push(
        ...res.body.items.map((i: { applicant: { username: string } }) => i.applicant.username),
      );
      cursor = res.body.nextCursor;
    } while (cursor);
    expect(seen).toEqual(['queued_0', 'queued_1', 'queued_2', 'queued_3', 'queued_4']);
  });

  it('overview counts pending applications', async () => {
    const reviewer = await admin(h);
    await applyForClan(h, await player(h, 'count_me'));
    const res = await get('/admin/overview', reviewer);
    expect(res.body).toMatchObject({ pendingClanApplications: 1, activeClans: 0, players: 1 });
  });
});

describe('invitations', () => {
  let reviewer: Actor;
  let leader: Actor;
  let tag: string;

  beforeEach(async () => {
    reviewer = await admin(h);
    leader = await player(h, 'inv_leader');
    tag = await approvedClan(h, leader, reviewer, { tag: 'INV' });
  });

  it('invite → accept makes the player a member and cancels their other open offers', async () => {
    const target = await player(h, 'invitee');
    const otherLeader = await player(h, 'other_lead');
    const otherTag = await approvedClan(h, otherLeader, reviewer, { tag: 'OTH' });
    await post(`/clans/${otherTag}/invitations`, otherLeader, { username: 'invitee' });
    await post(`/clans/${otherTag}/join-requests`, target, {});

    await addMember(h, tag, leader, target);
    expect(await roleOf(tag, 'invitee')).toBe('member');

    const leftover = await h.db
      .select()
      .from(clanInvitations)
      .where(eq(clanInvitations.status, 'pending'));
    expect(leftover).toHaveLength(0);
    const pendingForOther = await get(`/clans/${otherTag}/pending`, otherLeader);
    expect(pendingForOther.body.joinRequests).toHaveLength(0);
  });

  it('members cannot invite; co-leaders can', async () => {
    const m = await player(h, 'plain_member');
    await addMember(h, tag, leader, m);
    await player(h, 'prospect');
    expect((await post(`/clans/${tag}/invitations`, m, { username: 'prospect' })).status).toBe(403);
    await post(`/clans/${tag}/members/plain_member/role`, leader, { role: 'co_leader' });
    expect((await post(`/clans/${tag}/invitations`, m, { username: 'prospect' })).status).toBe(204);
  });

  it('refuses duplicates, self-invites and players already in a clan', async () => {
    await player(h, 'dup_target');
    await post(`/clans/${tag}/invitations`, leader, { username: 'dup_target' });
    expect(
      (await post(`/clans/${tag}/invitations`, leader, { username: 'dup_target' })).body.code,
    ).toBe('INVITATION_EXISTS');
    expect(
      (await post(`/clans/${tag}/invitations`, leader, { username: 'inv_leader' })).body.code,
    ).toBe('CANNOT_TARGET_SELF');
    const otherLeader = await player(h, 'busy_leader');
    await approvedClan(h, otherLeader, reviewer);
    expect(
      (await post(`/clans/${tag}/invitations`, leader, { username: 'busy_leader' })).body.code,
    ).toBe('ALREADY_IN_CLAN');
  });

  it('expired invitations cannot be accepted and can be re-sent', async () => {
    const target = await player(h, 'late_one');
    await post(`/clans/${tag}/invitations`, leader, { username: 'late_one' });
    const mine = await get('/me/clan', target);
    const id = mine.body.invitations[0].id;
    // Expire it in the database (advancing the clock 7+ days would also expire the session).
    await h.db
      .update(clanInvitations)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(clanInvitations.id, id));
    expect((await get('/me/clan', target)).body.invitations).toHaveLength(0);
    expect((await post(`/clan-invitations/${id}/accept`, target)).body.code).toBe(
      'INVITATION_NOT_PENDING',
    );
    expect((await post(`/clans/${tag}/invitations`, leader, { username: 'late_one' })).status).toBe(
      204,
    );
  });

  it('only the invitee can accept or decline; revoked invitations are dead', async () => {
    const target = await player(h, 'real_invitee');
    const stranger = await player(h, 'stranger');
    await post(`/clans/${tag}/invitations`, leader, { username: 'real_invitee' });
    const id = (await get('/me/clan', target)).body.invitations[0].id;
    expect((await post(`/clan-invitations/${id}/accept`, stranger)).status).toBe(404);
    expect((await post(`/clan-invitations/${id}/revoke`, stranger)).status).toBe(403);
    expect((await post(`/clan-invitations/${id}/revoke`, leader)).status).toBe(204);
    expect((await post(`/clan-invitations/${id}/accept`, target)).body.code).toBe(
      'INVITATION_NOT_PENDING',
    );
  });

  it('a player accepting two clans’ invitations at once ends up in exactly one', async () => {
    const otherLeader = await player(h, 'rival_lead');
    const otherTag = await approvedClan(h, otherLeader, reviewer, { tag: 'RIV' });
    const target = await player(h, 'popular');
    await post(`/clans/${tag}/invitations`, leader, { username: 'popular' });
    await post(`/clans/${otherTag}/invitations`, otherLeader, { username: 'popular' });
    const ids = (await get('/me/clan', target)).body.invitations.map((i: { id: string }) => i.id);
    const results = await Promise.all(
      ids.map((id: string) => post(`/clan-invitations/${id}/accept`, target)),
    );
    expect(results.map((r) => r.status).sort()).toEqual([204, 409]);
    const memberships = await h.db
      .select()
      .from(clanMemberships)
      .innerJoin(playerProfiles, eq(playerProfiles.id, clanMemberships.playerId))
      .where(and(eq(playerProfiles.displayName, 'Player popular'), isNull(clanMemberships.leftAt)));
    expect(memberships).toHaveLength(1);
  });
});

describe('join requests', () => {
  let reviewer: Actor;
  let leader: Actor;
  let tag: string;

  beforeEach(async () => {
    reviewer = await admin(h);
    leader = await player(h, 'req_leader');
    tag = await approvedClan(h, leader, reviewer, { tag: 'REQ' });
  });

  it('request → approve adds the member; the decision is the manager’s', async () => {
    const applicant = await player(h, 'wants_in', {});
    expect(
      (await post(`/clans/${tag}/join-requests`, applicant, { message: 'I play daily.' })).status,
    ).toBe(204);
    expect((await post(`/clans/${tag}/join-requests`, applicant, {})).body.code).toBe(
      'JOIN_REQUEST_EXISTS',
    );

    const pending = await get(`/clans/${tag}/pending`, leader);
    expect(pending.body.joinRequests[0]).toMatchObject({
      message: 'I play daily.',
      player: { username: 'wants_in' },
    });
    expect((await get(`/clans/${tag}/pending`, applicant)).status).toBe(403);

    const id = pending.body.joinRequests[0].id;
    expect((await post(`/clan-join-requests/${id}/approve`, applicant)).status).toBe(403);
    expect((await post(`/clan-join-requests/${id}/approve`, leader)).status).toBe(204);
    expect(await roleOf(tag, 'wants_in')).toBe('member');
    expect((await post(`/clan-join-requests/${id}/reject`, leader)).body.code).toBe(
      'JOIN_REQUEST_NOT_PENDING',
    );
  });

  it('rejected and cancelled requests do not add anyone', async () => {
    const a = await player(h, 'rejected_req');
    const b = await player(h, 'cancel_req');
    await post(`/clans/${tag}/join-requests`, a, {});
    await post(`/clans/${tag}/join-requests`, b, {});
    const reqs = (await get(`/clans/${tag}/pending`, leader)).body.joinRequests;
    const idOf = (u: string) =>
      reqs.find((r: { player: { username: string } }) => r.player.username === u).id;
    await post(`/clan-join-requests/${idOf('rejected_req')}/reject`, leader);
    expect((await post(`/clan-join-requests/${idOf('cancel_req')}/cancel`, a)).status).toBe(404);
    expect((await post(`/clan-join-requests/${idOf('cancel_req')}/cancel`, b)).status).toBe(204);
    expect((await get(`/clans/${tag}`)).body.memberCount).toBe(1);
  });

  it('members of another clan cannot ask to join', async () => {
    const otherLeader = await player(h, 'taken_lead');
    await approvedClan(h, otherLeader, reviewer);
    expect((await post(`/clans/${tag}/join-requests`, otherLeader, {})).body.code).toBe(
      'ALREADY_IN_CLAN',
    );
  });
});

describe('roles, kicks, leadership and leaving', () => {
  let reviewer: Actor;
  let leader: Actor;
  let co: Actor;
  let member: Actor;
  let tag: string;

  beforeEach(async () => {
    reviewer = await admin(h);
    leader = await player(h, 'boss');
    co = await player(h, 'deputy');
    member = await player(h, 'rookie');
    tag = await approvedClan(h, leader, reviewer, { tag: 'ROLE' });
    await addMember(h, tag, leader, co);
    await addMember(h, tag, leader, member);
    await post(`/clans/${tag}/members/deputy/role`, leader, { role: 'co_leader' });
  });

  it('only the leader changes roles, and nobody can be promoted to leader directly', async () => {
    expect(
      (await post(`/clans/${tag}/members/rookie/role`, co, { role: 'co_leader' })).status,
    ).toBe(403);
    expect(
      (await post(`/clans/${tag}/members/rookie/role`, leader, { role: 'leader' })).status,
    ).toBe(400);
    expect(
      (await post(`/clans/${tag}/members/boss/role`, leader, { role: 'member' })).body.code,
    ).toBe('CANNOT_TARGET_SELF');
  });

  it('co-leaders can kick members but not co-leaders; nobody can kick the leader', async () => {
    const extraCo = await player(h, 'deputy_two');
    await addMember(h, tag, leader, extraCo);
    await post(`/clans/${tag}/members/deputy_two/role`, leader, { role: 'co_leader' });

    expect((await post(`/clans/${tag}/members/deputy_two/kick`, co)).status).toBe(403);
    expect((await post(`/clans/${tag}/members/boss/kick`, co)).status).toBe(403);
    expect((await post(`/clans/${tag}/members/boss/kick`, member)).status).toBe(403);
    expect((await post(`/clans/${tag}/members/rookie/kick`, co)).status).toBe(204);
    expect(await roleOf(tag, 'rookie')).toBeNull();
    expect((await get('/me/clan', member)).body.membership).toBeNull();
  });

  it('transfers leadership: old leader becomes co-leader, there is always exactly one leader', async () => {
    expect(
      (await post(`/clans/${tag}/transfer-leadership`, co, { username: 'rookie' })).status,
    ).toBe(403);
    expect(
      (await post(`/clans/${tag}/transfer-leadership`, leader, { username: 'rookie' })).status,
    ).toBe(204);
    expect(await roleOf(tag, 'rookie')).toBe('leader');
    expect(await roleOf(tag, 'boss')).toBe('co_leader');
    const [{ n }] = (
      await h.db.execute(
        sql`SELECT count(*)::int AS n FROM clan_memberships WHERE role = 'leader' AND left_at IS NULL`,
      )
    ).rows as [{ n: number }];
    expect(n).toBe(1);
  });

  it('the leader must transfer before leaving; others can leave', async () => {
    expect((await post(`/clans/${tag}/leave`, leader)).body.code).toBe('LEADER_MUST_TRANSFER');
    expect((await post(`/clans/${tag}/leave`, member)).status).toBe(204);
    expect((await post(`/clans/${tag}/leave`, member)).body.code).toBe('NOT_IN_CLAN');
  });

  it('a player who left can join a different clan', async () => {
    await post(`/clans/${tag}/leave`, member);
    const otherLeader = await player(h, 'new_home');
    const otherTag = await approvedClan(h, otherLeader, reviewer);
    await addMember(h, otherTag, otherLeader, member);
    expect((await get('/me/clan', member)).body.membership.clan.tag).toBe(otherTag);
  });

  it('only the leader edits the clan profile; name and tag cannot be changed', async () => {
    expect(
      (
        await h.http
          .patch(`${API}/clans/${tag}`)
          .set('Cookie', co.cookie)
          .send({ description: 'Hijacked description' })
      ).status,
    ).toBe(403);
    const ok = await h.http
      .patch(`${API}/clans/${tag}`)
      .set('Cookie', leader.cookie)
      .send({ description: 'Updated description for the clan.' });
    expect(ok.status).toBe(204);
    const rename = await h.http
      .patch(`${API}/clans/${tag}`)
      .set('Cookie', leader.cookie)
      .send({ name: 'New Name' });
    expect(rename.status).toBe(400);
    expect((await get(`/clans/${tag}`)).body.description).toBe('Updated description for the clan.');
  });
});

describe('capacity', () => {
  it(`stops at ${CLAN_MAX_MEMBERS} members even under concurrent joins`, async () => {
    const reviewer = await admin(h);
    const leader = await player(h, 'cap_leader');
    const tag = await approvedClan(h, leader, reviewer, { tag: 'CAP' });
    const [clan] = await h.db.select().from(clans).where(eq(clans.tag, 'CAP'));

    // Fill to one below the limit directly, then race two joins for the last slot.
    const fillers = CLAN_MAX_MEMBERS - 2;
    const rows = await h.db.execute(sql`
      WITH u AS (
        INSERT INTO users (email, username, password_hash, email_verified_at)
        SELECT 'f' || g || '@example.com', 'filler_' || g, 'x', now() FROM generate_series(1, ${fillers}) g
        RETURNING id, username
      ), p AS (
        INSERT INTO player_profiles (user_id, game_id, game_id_normalized, display_name, country_code)
        SELECT id, 'FILL' || username, upper(replace('FILL' || username, '_', '')), 'Filler', 'EG' FROM u
        RETURNING id
      )
      INSERT INTO clan_memberships (clan_id, player_id, role) SELECT ${clan!.id}, id, 'member' FROM p RETURNING id`);
    expect(rows.rows).toHaveLength(fillers);

    const a = await player(h, 'last_a');
    const b = await player(h, 'last_b');
    await post(`/clans/${tag}/join-requests`, a, {});
    await post(`/clans/${tag}/join-requests`, b, {});
    const reqs = (await get(`/clans/${tag}/pending`, leader)).body.joinRequests;
    const results = await Promise.all(
      reqs.map((r: { id: string }) => post(`/clan-join-requests/${r.id}/approve`, leader)),
    );
    expect(results.map((r) => r.status).sort()).toEqual([204, 409]);
    expect(results.find((r) => r.status === 409)!.body.code).toBe('CLAN_FULL');
    expect((await get(`/clans/${tag}`)).body.memberCount).toBe(CLAN_MAX_MEMBERS);
  });
});

describe('discovery', () => {
  it('lists active clans with member counts, searches name and tag, and pages without duplicates', async () => {
    const reviewer = await admin(h);
    const names = [
      'Alexandria Sharks',
      'Aswan Falcons',
      'Cairo Eagles',
      'Delta Wolves',
      'Giza Lions',
    ];
    for (const [i, name] of names.entries()) {
      await approvedClan(h, await player(h, `disc_${i}`), reviewer, { name, tag: `D${i}X` });
    }
    const search = await get('/clans?q=cairo');
    expect(search.body.items.map((c: { name: string }) => c.name)).toEqual(['Cairo Eagles']);
    expect(search.body.items[0].memberCount).toBe(1);
    expect((await get('/clans?q=d3x')).body.items[0].name).toBe('Delta Wolves');
    expect((await get('/clans?q=%25')).body.items).toHaveLength(0);

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await get(
        `/clans?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      );
      seen.push(...res.body.items.map((c: { name: string }) => c.name));
      cursor = res.body.nextCursor;
    } while (cursor);
    expect(seen).toEqual(names);
  });

  it('public clan page and player page show the membership', async () => {
    const reviewer = await admin(h);
    const leader = await player(h, 'shown_leader');
    const tag = await approvedClan(h, leader, reviewer, { tag: 'SHOW' });
    expect((await get(`/clans/${tag.toLowerCase()}`)).status).toBe(200);
    expect((await get('/players/shown_leader')).body.clan).toMatchObject({
      tag: 'SHOW',
      role: 'leader',
    });
    expect((await get('/clans/BAD-TAG')).status).toBe(404);
  });
});

describe('database constraints (defence in depth)', () => {
  it('rejects a second active membership and a second leader even if the service were bypassed', async () => {
    const reviewer = await admin(h);
    const l1 = await player(h, 'c_lead_1');
    const l2 = await player(h, 'c_lead_2');
    await approvedClan(h, l1, reviewer, { tag: 'K1' });
    await approvedClan(h, l2, reviewer, { tag: 'K2' });
    const [k1] = await h.db.select().from(clans).where(eq(clans.tag, 'K1'));
    const [p2] = await h.db
      .select()
      .from(clanMemberships)
      .innerJoin(clans, eq(clans.id, clanMemberships.clanId))
      .where(eq(clans.tag, 'K2'));
    await expect(
      h.db
        .insert(clanMemberships)
        .values({ clanId: k1!.id, playerId: p2!.clan_memberships.playerId, role: 'member' }),
    ).rejects.toThrow();

    const extra = await player(h, 'c_extra');
    await addMember(h, 'K1', l1, extra);
    await expect(
      h.db
        .update(clanMemberships)
        .set({ role: 'leader' })
        .where(and(eq(clanMemberships.clanId, k1!.id), eq(clanMemberships.role, 'member'))),
    ).rejects.toThrow();
  });
});
