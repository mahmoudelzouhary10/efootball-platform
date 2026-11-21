import { Inject, Injectable } from '@nestjs/common';
import { CLAN_MAX_MEMBERS, ErrorCode, UpdateClanInput } from '@efp/contracts';
import { and, eq, isNull, lte, sql } from 'drizzle-orm';
import { Clock } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import type { RequestMeta } from '../../common/http/request-meta';
import { RateLimiter } from '../../common/rate-limit/rate-limiter.service';
import { DB, Database, DbExecutor, Tx, uniqueViolationConstraint } from '../../db/db.module';
import {
  clanInvitations,
  clanJoinRequests,
  clanMemberships,
  clans,
  ClanRole,
} from '../../db/schema';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../identity/session.service';
import { MediaService } from '../media/media.service';
import { PlayerProfileRow, PlayersService } from '../players/players.service';
import { cancelOpenInvitesAndRequests, isInClan, lockPlayer } from './clan-applications.service';
import { ClanPolicy } from './clan.policy';

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ClanRow = typeof clans.$inferSelect;
type MembershipRow = typeof clanMemberships.$inferSelect;

/**
 * Every write follows the same discipline:
 * 1. lock the clan row (FOR UPDATE) — serializes all roster changes of one clan,
 *    which makes the member-count check and role changes race-free;
 * 2. load the actor's membership inside the transaction and ask ClanPolicy;
 * 3. write; the partial unique indexes reject anything that slipped through
 *    (a player joining two clans at once, two leaders, duplicate pending invites).
 */
@Injectable()
export class ClanMembershipService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly clock: Clock,
    private readonly players: PlayersService,
    private readonly media: MediaService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  // ── invitations ───────────────────────────────────────────────────────────

  async invite(auth: AuthContext, tag: string, username: string, meta: RequestMeta): Promise<void> {
    await this.rateLimiter.consume(
      { name: 'clan-invite:user', limit: 60, windowSeconds: 3600 },
      auth.userId,
    );
    const actor = await this.players.requireProfile(auth.userId);
    const target = await this.players.findByUsername(username);
    if (!target) throw AppError.notFound('No player with that username');
    if (target.id === actor.id) throw cannotTargetSelf();

    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      const role = await roleIn(tx, clan.id, actor.id);
      if (!ClanPolicy.canManageRoster(role)) throw AppError.forbidden();
      if (await isInClan(tx, target.id)) {
        throw new AppError(409, ErrorCode.ALREADY_IN_CLAN, 'This player is already in a clan');
      }
      await assertCapacity(tx, clan.id);

      const now = this.clock.now();
      // An expired invitation still occupies the "pending" slot; retire it first.
      await tx
        .update(clanInvitations)
        .set({ status: 'cancelled', respondedAt: now })
        .where(
          and(
            eq(clanInvitations.clanId, clan.id),
            eq(clanInvitations.playerId, target.id),
            eq(clanInvitations.status, 'pending'),
            lte(clanInvitations.expiresAt, now),
          ),
        );
      const [inv] = await tx
        .insert(clanInvitations)
        .values({
          clanId: clan.id,
          playerId: target.id,
          invitedByPlayerId: actor.id,
          createdAt: now,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        })
        .returning({ id: clanInvitations.id });
      await this.log(tx, auth, 'clan.invite', clan.id, meta, {
        invitationId: inv!.id,
        playerId: target.id,
      });
    });
  }

  async revokeInvitation(
    auth: AuthContext,
    invitationId: string,
    meta: RequestMeta,
  ): Promise<void> {
    const actor = await this.players.requireProfile(auth.userId);
    const clanId = await this.clanIdOf(clanInvitations, invitationId);
    await this.run(async (tx) => {
      const clan = await lockClanById(tx, clanId);
      if (!ClanPolicy.canManageRoster(await roleIn(tx, clan.id, actor.id)))
        throw AppError.forbidden();
      const inv = await lockRow(tx, clanInvitations, invitationId);
      if (inv.status !== 'pending') throw invitationNotPending();
      await tx
        .update(clanInvitations)
        .set({ status: 'revoked', respondedAt: this.clock.now() })
        .where(eq(clanInvitations.id, inv.id));
      await this.log(tx, auth, 'clan.invitation_revoke', clan.id, meta, { invitationId });
    });
  }

  async acceptInvitation(
    auth: AuthContext,
    invitationId: string,
    meta: RequestMeta,
  ): Promise<void> {
    const me = await this.players.requireProfile(auth.userId);
    const clanId = await this.clanIdOf(clanInvitations, invitationId);
    await this.run(async (tx) => {
      const clan = await lockClanById(tx, clanId);
      await lockPlayer(tx, me.id);
      const inv = await lockRow(tx, clanInvitations, invitationId);
      if (inv.playerId !== me.id) throw AppError.notFound();
      const now = this.clock.now();
      if (inv.status !== 'pending' || inv.expiresAt <= now) throw invitationNotPending();
      await assertCapacity(tx, clan.id);
      await tx
        .insert(clanMemberships)
        .values({ clanId: clan.id, playerId: me.id, role: 'member', joinedAt: now });
      await tx
        .update(clanInvitations)
        .set({ status: 'accepted', respondedAt: now })
        .where(eq(clanInvitations.id, inv.id));
      await cancelOpenInvitesAndRequests(tx, me.id, now);
      await this.log(tx, auth, 'clan.join_by_invitation', clan.id, meta, { invitationId });
    });
  }

  async declineInvitation(auth: AuthContext, invitationId: string): Promise<void> {
    const me = await this.players.requireProfile(auth.userId);
    await this.db.transaction(async (tx) => {
      const inv = await lockRow(tx, clanInvitations, invitationId);
      if (inv.playerId !== me.id) throw AppError.notFound();
      if (inv.status !== 'pending') throw invitationNotPending();
      await tx
        .update(clanInvitations)
        .set({ status: 'declined', respondedAt: this.clock.now() })
        .where(eq(clanInvitations.id, inv.id));
    });
  }

  // ── join requests ─────────────────────────────────────────────────────────

  async requestToJoin(
    auth: AuthContext,
    tag: string,
    message: string | null,
    meta: RequestMeta,
  ): Promise<void> {
    await this.rateLimiter.consume(
      { name: 'clan-join:user', limit: 20, windowSeconds: 3600 },
      auth.userId,
    );
    const me = await this.players.requireProfile(auth.userId);
    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      if (await isInClan(tx, me.id)) {
        throw new AppError(409, ErrorCode.ALREADY_IN_CLAN, 'Leave your current clan first');
      }
      await assertCapacity(tx, clan.id);
      const [req] = await tx
        .insert(clanJoinRequests)
        .values({ clanId: clan.id, playerId: me.id, message, createdAt: this.clock.now() })
        .returning({ id: clanJoinRequests.id });
      await this.log(tx, auth, 'clan.join_request', clan.id, meta, { requestId: req!.id });
    });
  }

  async cancelJoinRequest(auth: AuthContext, requestId: string): Promise<void> {
    const me = await this.players.requireProfile(auth.userId);
    await this.db.transaction(async (tx) => {
      const req = await lockRow(tx, clanJoinRequests, requestId);
      if (req.playerId !== me.id) throw AppError.notFound();
      if (req.status !== 'pending') throw joinRequestNotPending();
      await tx
        .update(clanJoinRequests)
        .set({ status: 'cancelled', decidedAt: this.clock.now() })
        .where(eq(clanJoinRequests.id, req.id));
    });
  }

  async decideJoinRequest(
    auth: AuthContext,
    requestId: string,
    decision: 'approve' | 'reject',
    meta: RequestMeta,
  ): Promise<void> {
    const actor = await this.players.requireProfile(auth.userId);
    const [ref] = await this.db
      .select({ clanId: clanJoinRequests.clanId, playerId: clanJoinRequests.playerId })
      .from(clanJoinRequests)
      .where(eq(clanJoinRequests.id, requestId));
    if (!ref) throw AppError.notFound();
    await this.run(async (tx) => {
      const clan = await lockClanById(tx, ref.clanId);
      if (!ClanPolicy.canManageRoster(await roleIn(tx, clan.id, actor.id)))
        throw AppError.forbidden();
      if (decision === 'approve') await lockPlayer(tx, ref.playerId);
      const req = await lockRow(tx, clanJoinRequests, requestId);
      if (req.status !== 'pending') throw joinRequestNotPending();
      const now = this.clock.now();

      if (decision === 'approve') {
        await assertCapacity(tx, clan.id);
        await tx
          .insert(clanMemberships)
          .values({ clanId: clan.id, playerId: req.playerId, role: 'member', joinedAt: now });
      }
      await tx
        .update(clanJoinRequests)
        .set({
          status: decision === 'approve' ? 'approved' : 'rejected',
          decidedByPlayerId: actor.id,
          decidedAt: now,
        })
        .where(eq(clanJoinRequests.id, req.id));
      if (decision === 'approve') await cancelOpenInvitesAndRequests(tx, req.playerId, now);
      await this.log(tx, auth, `clan.join_request_${decision}`, clan.id, meta, {
        requestId,
        playerId: req.playerId,
      });
    });
  }

  // ── roster ────────────────────────────────────────────────────────────────

  async changeRole(
    auth: AuthContext,
    tag: string,
    username: string,
    role: Exclude<ClanRole, 'leader'>,
    meta: RequestMeta,
  ): Promise<void> {
    const actor = await this.players.requireProfile(auth.userId);
    const target = await this.requireTarget(username, actor);
    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      if (!ClanPolicy.canChangeRoles(await roleIn(tx, clan.id, actor.id)))
        throw AppError.forbidden();
      const membership = await activeMembership(tx, clan.id, target.id);
      if (!membership) throw notInClan();
      if (membership.role === 'leader') throw AppError.forbidden('Use leadership transfer instead');
      if (membership.role === role) return;
      await tx.update(clanMemberships).set({ role }).where(eq(clanMemberships.id, membership.id));
      await this.log(tx, auth, 'clan.role_change', clan.id, meta, {
        playerId: target.id,
        from: membership.role,
        to: role,
      });
    });
  }

  async kick(auth: AuthContext, tag: string, username: string, meta: RequestMeta): Promise<void> {
    const actor = await this.players.requireProfile(auth.userId);
    const target = await this.requireTarget(username, actor);
    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      const actorRole = await roleIn(tx, clan.id, actor.id);
      const membership = await activeMembership(tx, clan.id, target.id);
      if (!membership) throw notInClan();
      if (!ClanPolicy.canKick(actorRole, membership.role)) throw AppError.forbidden();
      await tx
        .update(clanMemberships)
        .set({ leftAt: this.clock.now(), leaveReason: 'kicked' })
        .where(eq(clanMemberships.id, membership.id));
      await this.log(tx, auth, 'clan.kick', clan.id, meta, {
        playerId: target.id,
        role: membership.role,
      });
    });
  }

  /** The current leader becomes a co-leader and the target becomes leader, in one transaction. */
  async transferLeadership(
    auth: AuthContext,
    tag: string,
    username: string,
    meta: RequestMeta,
  ): Promise<void> {
    const actor = await this.players.requireProfile(auth.userId);
    const target = await this.requireTarget(username, actor);
    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      const mine = await activeMembership(tx, clan.id, actor.id);
      if (!ClanPolicy.canTransferLeadership(mine?.role ?? null)) throw AppError.forbidden();
      const theirs = await activeMembership(tx, clan.id, target.id);
      if (!theirs) throw notInClan();
      // Order matters: the one-leader unique index must never see two leaders.
      await tx
        .update(clanMemberships)
        .set({ role: 'co_leader' })
        .where(eq(clanMemberships.id, mine!.id));
      await tx
        .update(clanMemberships)
        .set({ role: 'leader' })
        .where(eq(clanMemberships.id, theirs.id));
      await this.log(tx, auth, 'clan.leadership_transfer', clan.id, meta, {
        from: actor.id,
        to: target.id,
      });
    });
  }

  async leave(auth: AuthContext, tag: string, meta: RequestMeta): Promise<void> {
    const me = await this.players.requireProfile(auth.userId);
    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      const membership = await activeMembership(tx, clan.id, me.id);
      if (!membership) throw notInClan();
      if (!ClanPolicy.canLeave(membership.role)) {
        throw new AppError(
          409,
          ErrorCode.LEADER_MUST_TRANSFER,
          'Transfer leadership before leaving',
        );
      }
      await tx
        .update(clanMemberships)
        .set({ leftAt: this.clock.now(), leaveReason: 'left' })
        .where(eq(clanMemberships.id, membership.id));
      await this.log(tx, auth, 'clan.leave', clan.id, meta, {});
    });
  }

  /** Name and tag are fixed after approval; the leader edits logo, description and contact link. */
  async updateProfile(
    auth: AuthContext,
    tag: string,
    input: UpdateClanInput,
    meta: RequestMeta,
  ): Promise<void> {
    const actor = await this.players.requireProfile(auth.userId);
    if (input.logoMediaId)
      await this.media.assertOwned(input.logoMediaId, auth.userId, 'clan_logo');
    await this.run(async (tx) => {
      const clan = await lockClan(tx, tag);
      if (!ClanPolicy.canEditProfile(await roleIn(tx, clan.id, actor.id)))
        throw AppError.forbidden();
      await tx
        .update(clans)
        .set({ ...input, updatedAt: this.clock.now() })
        .where(eq(clans.id, clan.id));
      await this.log(tx, auth, 'clan.update', clan.id, meta, { fields: Object.keys(input) });
    });
  }

  /** The caller's role in a clan, for read endpoints that show manager-only data. */
  async roleOf(auth: AuthContext, clanId: string): Promise<ClanRole | null> {
    const me = await this.players.findByUserId(auth.userId);
    if (!me) return null;
    return roleIn(this.db, clanId, me.id);
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private async run(work: (tx: Tx) => Promise<void>): Promise<void> {
    try {
      await this.db.transaction(work);
    } catch (err) {
      throw translateMembershipConflict(err);
    }
  }

  private async requireTarget(
    username: string,
    actor: PlayerProfileRow,
  ): Promise<PlayerProfileRow> {
    const target = await this.players.findByUsername(username);
    if (!target) throw AppError.notFound('No player with that username');
    if (target.id === actor.id) throw cannotTargetSelf();
    return target;
  }

  private async clanIdOf(
    table: typeof clanInvitations | typeof clanJoinRequests,
    id: string,
  ): Promise<string> {
    const [row] = await this.db
      .select({ clanId: table.clanId })
      .from(table)
      .where(eq(table.id, id));
    if (!row) throw AppError.notFound();
    return row.clanId;
  }

  private log(
    tx: Tx,
    auth: AuthContext,
    action: string,
    clanId: string,
    meta: RequestMeta,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    return this.audit.record(
      {
        actorUserId: auth.userId,
        action,
        targetType: 'clan',
        targetId: clanId,
        metadata,
        ip: meta.ip,
      },
      tx,
    );
  }
}

async function lockClan(tx: Tx, tag: string): Promise<ClanRow> {
  const [clan] = await tx
    .select()
    .from(clans)
    .where(and(eq(clans.tag, tag), eq(clans.status, 'active')))
    .for('update');
  if (!clan) throw AppError.notFound('Clan not found');
  return clan;
}

async function lockClanById(tx: Tx, id: string): Promise<ClanRow> {
  const [clan] = await tx
    .select()
    .from(clans)
    .where(and(eq(clans.id, id), eq(clans.status, 'active')))
    .for('update');
  if (!clan) throw AppError.notFound('Clan not found');
  return clan;
}

async function lockRow<T extends typeof clanInvitations | typeof clanJoinRequests>(
  tx: Tx,
  table: T,
  id: string,
): Promise<T['$inferSelect']> {
  const [row] = await tx
    .select()
    .from(table as typeof clanInvitations)
    .where(eq(table.id, id))
    .for('update');
  if (!row) throw AppError.notFound();
  return row as T['$inferSelect'];
}

async function activeMembership(
  tx: DbExecutor,
  clanId: string,
  playerId: string,
): Promise<MembershipRow | null> {
  const [row] = await tx
    .select()
    .from(clanMemberships)
    .where(
      and(
        eq(clanMemberships.clanId, clanId),
        eq(clanMemberships.playerId, playerId),
        isNull(clanMemberships.leftAt),
      ),
    );
  return row ?? null;
}

async function roleIn(tx: DbExecutor, clanId: string, playerId: string): Promise<ClanRole | null> {
  return (await activeMembership(tx, clanId, playerId))?.role ?? null;
}

/** Called with the clan row locked, so the count can't change underneath us. */
async function assertCapacity(tx: Tx, clanId: string): Promise<void> {
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(clanMemberships)
    .where(and(eq(clanMemberships.clanId, clanId), isNull(clanMemberships.leftAt)));
  if ((row?.n ?? 0) >= CLAN_MAX_MEMBERS) {
    throw new AppError(
      409,
      ErrorCode.CLAN_FULL,
      `Clans are limited to ${CLAN_MAX_MEMBERS} members`,
    );
  }
}

function translateMembershipConflict(err: unknown): unknown {
  switch (uniqueViolationConstraint(err)) {
    case 'uq_one_active_membership':
      return new AppError(409, ErrorCode.ALREADY_IN_CLAN, 'This player is already in a clan');
    case 'uq_invitation_pending':
      return new AppError(
        409,
        ErrorCode.INVITATION_EXISTS,
        'This player already has a pending invitation',
      );
    case 'uq_join_request_pending':
      return new AppError(
        409,
        ErrorCode.JOIN_REQUEST_EXISTS,
        'You already asked to join this clan',
      );
    default:
      return err;
  }
}

const cannotTargetSelf = () =>
  new AppError(400, ErrorCode.CANNOT_TARGET_SELF, 'You cannot do this to yourself');
const notInClan = () => new AppError(404, ErrorCode.NOT_IN_CLAN, 'This player is not in the clan');
const invitationNotPending = () =>
  new AppError(409, ErrorCode.INVITATION_NOT_PENDING, 'This invitation is no longer open');
const joinRequestNotPending = () =>
  new AppError(409, ErrorCode.JOIN_REQUEST_NOT_PENDING, 'This request has already been handled');
