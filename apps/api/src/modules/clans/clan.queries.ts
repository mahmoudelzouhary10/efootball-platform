import { Inject, Injectable } from '@nestjs/common';
import {
  CLAN_MAX_MEMBERS,
  ClanApplicationResponse,
  ClanCardResponse,
  ClanDetailResponse,
  ClanInvitationResponse,
  ClanJoinRequestResponse,
  MyClanResponse,
  Page,
  PlayerSummary,
} from '@efp/contracts';
import { and, asc, desc, eq, gt, ilike, isNull, or, sql } from 'drizzle-orm';
import { alias, type PgColumn } from 'drizzle-orm/pg-core';
import { Clock } from '../../common/clock';
import { DB, Database } from '../../db/db.module';
import {
  clanApplications,
  clanInvitations,
  clanJoinRequests,
  clanMemberships,
  clans,
  playerProfiles,
  users,
} from '../../db/schema';
import { mediaUrl } from '../media/media.service';

/** Columns that make up a PlayerSummary, for a given player_profiles/users alias pair. */
type SummaryTable = {
  id: PgColumn;
  displayName: PgColumn;
  countryCode: PgColumn;
  avatarMediaId: PgColumn;
  gameIdVerifiedAt: PgColumn;
};

/** Generic so it works with table aliases (inviter/invitee) as well as the base tables. */
export function playerSummaryColumns<P extends SummaryTable, U extends { username: PgColumn }>(
  p: P,
  u: U,
) {
  return {
    id: p.id,
    username: u.username,
    displayName: p.displayName,
    countryCode: p.countryCode,
    avatarMediaId: p.avatarMediaId,
    gameIdVerifiedAt: p.gameIdVerifiedAt,
  };
}

type PlayerSummaryRow = {
  id: string;
  username: string;
  displayName: string;
  countryCode: string;
  avatarMediaId: string | null;
  gameIdVerifiedAt: Date | null;
};

/**
 * Accepts rows selected through playerSummaryColumns(). Drizzle can't carry column types through
 * the generic helper when tables are aliased, so the row shape is asserted here, in one place.
 */
export function toPlayerSummary(row: Record<keyof PlayerSummaryRow, unknown>): PlayerSummary {
  const r = row as PlayerSummaryRow;
  return {
    id: r.id,
    username: r.username,
    displayName: r.displayName,
    countryCode: r.countryCode,
    avatarUrl: mediaUrl(r.avatarMediaId),
    gameIdVerified: r.gameIdVerifiedAt !== null,
  };
}

// Written out explicitly: Drizzle renders columns unqualified in single-table selects,
// which would make `id` inside the subquery resolve to clan_memberships.id.
const activeMemberCount = sql<number>`(
  SELECT count(*)::int FROM clan_memberships cm
  WHERE cm.clan_id = "clans"."id" AND cm.left_at IS NULL
)`;

export function toApplicationResponse(
  a: typeof clanApplications.$inferSelect,
  clanTag: string | null,
): ClanApplicationResponse {
  return {
    id: a.id,
    status: a.status,
    name: a.name,
    tag: a.tag,
    logoUrl: mediaUrl(a.logoMediaId),
    description: a.description,
    contactUrl: a.contactUrl,
    rejectionReason: a.rejectionReason,
    createdAt: a.createdAt.toISOString(),
    reviewedAt: a.reviewedAt?.toISOString() ?? null,
    clanTag,
  };
}

/** Read models for clan pages. Writes live in the clan services. */
@Injectable()
export class ClanQueries {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  /** Clan discovery: active clans, optional name/tag search, keyset pagination by name. */
  async list(
    q: string | undefined,
    limit: number,
    cursor?: string,
  ): Promise<Page<ClanCardResponse>> {
    const after = decodeNameCursor(cursor);
    const term = q?.trim() ? `%${q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const rows = await this.db
      .select({
        id: clans.id,
        name: clans.name,
        tag: clans.tag,
        logoMediaId: clans.logoMediaId,
        description: clans.description,
        createdAt: clans.createdAt,
        memberCount: activeMemberCount,
      })
      .from(clans)
      .where(
        and(
          eq(clans.status, 'active'),
          term ? or(ilike(clans.name, term), ilike(clans.tag, term)) : undefined,
          after
            ? sql`(lower(${clans.name}::text), ${clans.id}) > (lower(${after.name}), ${after.id}::uuid)`
            : undefined,
        ),
      )
      .orderBy(sql`lower(${clans.name}::text)`, asc(clans.id))
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((r) => ({
        id: r.id,
        name: r.name,
        tag: r.tag,
        logoUrl: mediaUrl(r.logoMediaId),
        description: r.description,
        memberCount: r.memberCount,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor: rows.length > limit && last ? encodeNameCursor(last.name, last.id) : null,
    };
  }

  async detailByTag(tag: string): Promise<ClanDetailResponse | null> {
    const [clan] = await this.db
      .select({
        id: clans.id,
        name: clans.name,
        tag: clans.tag,
        logoMediaId: clans.logoMediaId,
        description: clans.description,
        contactUrl: clans.contactUrl,
        createdAt: clans.createdAt,
      })
      .from(clans)
      .where(and(eq(clans.tag, tag), eq(clans.status, 'active')));
    if (!clan) return null;

    const members = await this.db
      .select({
        ...playerSummaryColumns(playerProfiles, users),
        role: clanMemberships.role,
        joinedAt: clanMemberships.joinedAt,
      })
      .from(clanMemberships)
      .innerJoin(playerProfiles, eq(playerProfiles.id, clanMemberships.playerId))
      .innerJoin(users, eq(users.id, playerProfiles.userId))
      .where(and(eq(clanMemberships.clanId, clan.id), isNull(clanMemberships.leftAt)))
      .orderBy(
        sql`CASE ${clanMemberships.role} WHEN 'leader' THEN 0 WHEN 'co_leader' THEN 1 ELSE 2 END`,
        asc(clanMemberships.joinedAt),
      );

    return {
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      logoUrl: mediaUrl(clan.logoMediaId),
      description: clan.description,
      contactUrl: clan.contactUrl,
      createdAt: clan.createdAt.toISOString(),
      memberCount: members.length,
      maxMembers: CLAN_MAX_MEMBERS,
      members: members.map((m) => ({
        ...toPlayerSummary(m),
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }

  /** Pending, unexpired invitations — either for one clan or for one player. */
  async invitations(
    filter: { clanId: string } | { playerId: string },
  ): Promise<ClanInvitationResponse[]> {
    const invitee = alias(playerProfiles, 'invitee');
    const inviteeUser = alias(users, 'invitee_user');
    const inviter = alias(playerProfiles, 'inviter');
    const inviterUser = alias(users, 'inviter_user');
    const rows = await this.db
      .select({
        id: clanInvitations.id,
        createdAt: clanInvitations.createdAt,
        expiresAt: clanInvitations.expiresAt,
        clanId: clans.id,
        clanName: clans.name,
        clanTag: clans.tag,
        clanLogo: clans.logoMediaId,
        player: playerSummaryColumns(invitee, inviteeUser),
        inviter: playerSummaryColumns(inviter, inviterUser),
      })
      .from(clanInvitations)
      .innerJoin(clans, eq(clans.id, clanInvitations.clanId))
      .innerJoin(invitee, eq(invitee.id, clanInvitations.playerId))
      .innerJoin(inviteeUser, eq(inviteeUser.id, invitee.userId))
      .innerJoin(inviter, eq(inviter.id, clanInvitations.invitedByPlayerId))
      .innerJoin(inviterUser, eq(inviterUser.id, inviter.userId))
      .where(
        and(
          eq(clanInvitations.status, 'pending'),
          gt(clanInvitations.expiresAt, this.clock.now()),
          eq(clans.status, 'active'),
          'clanId' in filter
            ? eq(clanInvitations.clanId, filter.clanId)
            : eq(clanInvitations.playerId, filter.playerId),
        ),
      )
      .orderBy(desc(clanInvitations.createdAt));

    return rows.map((r) => ({
      id: r.id,
      clan: { id: r.clanId, name: r.clanName, tag: r.clanTag, logoUrl: mediaUrl(r.clanLogo) },
      player: toPlayerSummary(r.player),
      invitedBy: toPlayerSummary(r.inviter),
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));
  }

  async joinRequests(
    filter: { clanId: string } | { playerId: string },
  ): Promise<ClanJoinRequestResponse[]> {
    const rows = await this.db
      .select({
        id: clanJoinRequests.id,
        message: clanJoinRequests.message,
        createdAt: clanJoinRequests.createdAt,
        clanId: clans.id,
        clanName: clans.name,
        clanTag: clans.tag,
        clanLogo: clans.logoMediaId,
        player: playerSummaryColumns(playerProfiles, users),
      })
      .from(clanJoinRequests)
      .innerJoin(clans, eq(clans.id, clanJoinRequests.clanId))
      .innerJoin(playerProfiles, eq(playerProfiles.id, clanJoinRequests.playerId))
      .innerJoin(users, eq(users.id, playerProfiles.userId))
      .where(
        and(
          eq(clanJoinRequests.status, 'pending'),
          eq(clans.status, 'active'),
          'clanId' in filter
            ? eq(clanJoinRequests.clanId, filter.clanId)
            : eq(clanJoinRequests.playerId, filter.playerId),
        ),
      )
      .orderBy(asc(clanJoinRequests.createdAt), asc(clanJoinRequests.id));

    return rows.map((r) => ({
      id: r.id,
      clan: { id: r.clanId, name: r.clanName, tag: r.clanTag, logoUrl: mediaUrl(r.clanLogo) },
      player: toPlayerSummary(r.player),
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Everything the dashboard needs about the player's clan situation. */
  async myClan(playerId: string): Promise<MyClanResponse> {
    const [membership] = await this.db
      .select({
        role: clanMemberships.role,
        joinedAt: clanMemberships.joinedAt,
        id: clans.id,
        name: clans.name,
        tag: clans.tag,
        logo: clans.logoMediaId,
      })
      .from(clanMemberships)
      .innerJoin(clans, eq(clans.id, clanMemberships.clanId))
      .where(and(eq(clanMemberships.playerId, playerId), isNull(clanMemberships.leftAt)));

    const [application] = await this.db
      .select({ app: clanApplications, clanTag: clans.tag })
      .from(clanApplications)
      .leftJoin(clans, eq(clans.id, clanApplications.clanId))
      .where(eq(clanApplications.applicantPlayerId, playerId))
      .orderBy(desc(clanApplications.createdAt))
      .limit(1);

    const [invitations, joinRequests] = membership
      ? [[], []]
      : await Promise.all([this.invitations({ playerId }), this.joinRequests({ playerId })]);

    return {
      membership: membership
        ? {
            clan: {
              id: membership.id,
              name: membership.name,
              tag: membership.tag,
              logoUrl: mediaUrl(membership.logo),
            },
            role: membership.role,
            joinedAt: membership.joinedAt.toISOString(),
          }
        : null,
      invitations,
      joinRequests,
      application: application
        ? toApplicationResponse(application.app, application.clanTag ?? null)
        : null,
    };
  }
}

function encodeNameCursor(name: string, id: string): string {
  return Buffer.from(JSON.stringify([name.toLowerCase(), id])).toString('base64url');
}

function decodeNameCursor(cursor: string | undefined): { name: string; id: string } | null {
  if (!cursor) return null;
  try {
    const [name, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as [
      unknown,
      unknown,
    ];
    if (typeof name !== 'string' || typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))
      return null;
    return { name, id };
  } catch {
    return null;
  }
}
