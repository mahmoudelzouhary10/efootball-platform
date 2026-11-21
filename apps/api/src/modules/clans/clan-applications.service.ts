import { Inject, Injectable } from '@nestjs/common';
import {
  AdminClanApplicationResponse,
  ClanApplicationResponse,
  ClanApplicationStatus,
  CreateClanApplicationInput,
  ErrorCode,
  Page,
} from '@efp/contracts';
import { and, asc, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import { Clock } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import type { RequestMeta } from '../../common/http/request-meta';
import { RateLimiter } from '../../common/rate-limit/rate-limiter.service';
import { DB, Database, Tx, uniqueViolationConstraint } from '../../db/db.module';
import {
  clanApplications,
  clanInvitations,
  clanJoinRequests,
  clanMemberships,
  clans,
  playerProfiles,
  users,
} from '../../db/schema';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../identity/session.service';
import { MediaService } from '../media/media.service';
import { PlayersService } from '../players/players.service';
import { playerSummaryColumns, toApplicationResponse, toPlayerSummary } from './clan.queries';

@Injectable()
export class ClanApplicationsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly clock: Clock,
    private readonly players: PlayersService,
    private readonly media: MediaService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  /** A player asks to create a clan. It exists only after an admin approves. */
  async apply(
    auth: AuthContext,
    input: CreateClanApplicationInput,
  ): Promise<ClanApplicationResponse> {
    await this.rateLimiter.consume(
      { name: 'clan-apply:user', limit: 5, windowSeconds: 86_400 },
      auth.userId,
    );
    const player = await this.players.requireProfile(auth.userId);
    await this.media.assertOwned(input.logoMediaId, auth.userId, 'clan_logo');

    try {
      const app = await this.db.transaction(async (tx) => {
        if (await isInClan(tx, player.id)) {
          throw new AppError(
            409,
            ErrorCode.ALREADY_IN_CLAN,
            'Leave your current clan before applying',
          );
        }
        await assertNameAndTagFree(tx, input.name, input.tag);
        const [row] = await tx
          .insert(clanApplications)
          .values({
            applicantPlayerId: player.id,
            name: input.name,
            tag: input.tag,
            logoMediaId: input.logoMediaId,
            description: input.description,
            contactUrl: input.contactUrl,
          })
          .returning();
        await this.audit.record(
          {
            actorUserId: auth.userId,
            action: 'clan_application.submit',
            targetType: 'clan_application',
            targetId: row!.id,
          },
          tx,
        );
        return row!;
      });
      return toApplicationResponse(app, null);
    } catch (err) {
      throw translateApplicationConflict(err);
    }
  }

  async withdraw(auth: AuthContext, applicationId: string): Promise<void> {
    const player = await this.players.requireProfile(auth.userId);
    await this.db.transaction(async (tx) => {
      const [app] = await tx
        .select()
        .from(clanApplications)
        .where(
          and(
            eq(clanApplications.id, applicationId),
            eq(clanApplications.applicantPlayerId, player.id),
          ),
        )
        .for('update');
      if (!app) throw AppError.notFound();
      if (app.status !== 'pending') throw notPending();
      await tx
        .update(clanApplications)
        .set({ status: 'withdrawn', updatedAt: this.clock.now() })
        .where(eq(clanApplications.id, app.id));
      await this.audit.record(
        {
          actorUserId: auth.userId,
          action: 'clan_application.withdraw',
          targetType: 'clan_application',
          targetId: app.id,
        },
        tx,
      );
    });
  }

  // ── admin review ──────────────────────────────────────────────────────────

  /** Review queue. Pending applications oldest first (FIFO); decided ones newest first. */
  async list(
    status: ClanApplicationStatus,
    limit: number,
    cursor?: string,
  ): Promise<Page<AdminClanApplicationResponse>> {
    const fifo = status === 'pending';
    const after = decodeCursor(cursor);
    const ids = await this.db
      .select({
        id: clanApplications.id,
        createdAtText: sql<string>`${clanApplications.createdAt}::text`,
      })
      .from(clanApplications)
      .where(
        and(
          eq(clanApplications.status, status),
          after
            ? fifo
              ? sql`(${clanApplications.createdAt}, ${clanApplications.id}) > (${after.ts}::timestamptz, ${after.id}::uuid)`
              : sql`(${clanApplications.createdAt}, ${clanApplications.id}) < (${after.ts}::timestamptz, ${after.id}::uuid)`
            : undefined,
        ),
      )
      .orderBy(
        fifo ? asc(clanApplications.createdAt) : desc(clanApplications.createdAt),
        fifo ? asc(clanApplications.id) : desc(clanApplications.id),
      )
      .limit(limit + 1);

    const page = ids.slice(0, limit);
    const items = await Promise.all(page.map((r) => this.detail(r.id)));
    const last = page.at(-1);
    return {
      items: items.filter((i): i is AdminClanApplicationResponse => i !== null),
      nextCursor: ids.length > limit && last ? encodeCursor(last.createdAtText, last.id) : null,
    };
  }

  async detail(id: string): Promise<AdminClanApplicationResponse | null> {
    const [row] = await this.db
      .select({
        app: clanApplications,
        clanTag: clans.tag,
        applicant: playerSummaryColumns(playerProfiles, users),
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        accountCreatedAt: users.createdAt,
        reviewerUsername: sql<
          string | null
        >`(SELECT r.username::text FROM users r WHERE r.id = "clan_applications"."reviewed_by")`,
      })
      .from(clanApplications)
      .innerJoin(playerProfiles, eq(playerProfiles.id, clanApplications.applicantPlayerId))
      .innerJoin(users, eq(users.id, playerProfiles.userId))
      .leftJoin(clans, eq(clans.id, clanApplications.clanId))
      .where(eq(clanApplications.id, id));
    if (!row) return null;

    const { app } = row;
    const [nameTaken, tagTaken, inClan] = await Promise.all([
      this.db
        .select({ id: clans.id })
        .from(clans)
        .where(and(eq(clans.name, app.name), app.clanId ? ne(clans.id, app.clanId) : undefined)),
      this.db
        .select({ id: clans.id })
        .from(clans)
        .where(and(eq(clans.tag, app.tag), app.clanId ? ne(clans.id, app.clanId) : undefined)),
      this.db
        .select({ id: clanMemberships.id })
        .from(clanMemberships)
        .where(
          and(eq(clanMemberships.playerId, app.applicantPlayerId), isNull(clanMemberships.leftAt)),
        ),
    ]);

    return {
      ...toApplicationResponse(app, row.clanTag ?? null),
      applicant: {
        ...toPlayerSummary(row.applicant),
        email: row.email,
        emailVerified: row.emailVerifiedAt !== null,
        accountCreatedAt: row.accountCreatedAt.toISOString(),
      },
      reviewedBy: row.reviewerUsername,
      checks: {
        nameAvailable: nameTaken.length === 0,
        tagAvailable: tagTaken.length === 0,
        applicantInClan: app.status === 'pending' ? inClan.length > 0 : false,
      },
    };
  }

  /**
   * Creates the clan and makes the applicant its leader, atomically. The application row is
   * locked so two reviewers can't both approve it; the clan name/tag unique indexes and the
   * one-active-membership index settle any remaining race.
   */
  async approve(
    reviewerUserId: string,
    applicationId: string,
    meta: RequestMeta,
  ): Promise<AdminClanApplicationResponse> {
    try {
      await this.db.transaction(async (tx) => {
        const app = await lockPending(tx, applicationId);
        await lockPlayer(tx, app.applicantPlayerId);
        if (await isInClan(tx, app.applicantPlayerId)) {
          throw new AppError(
            409,
            ErrorCode.ALREADY_IN_CLAN,
            'The applicant has joined another clan since applying',
          );
        }
        const now = this.clock.now();
        const [clan] = await tx
          .insert(clans)
          .values({
            name: app.name,
            tag: app.tag,
            logoMediaId: app.logoMediaId,
            description: app.description,
            contactUrl: app.contactUrl,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: clans.id });
        await tx.insert(clanMemberships).values({
          clanId: clan!.id,
          playerId: app.applicantPlayerId,
          role: 'leader',
          joinedAt: now,
        });
        await tx
          .update(clanApplications)
          .set({
            status: 'approved',
            clanId: clan!.id,
            reviewedBy: reviewerUserId,
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(clanApplications.id, app.id));
        await cancelOpenInvitesAndRequests(tx, app.applicantPlayerId, now);
        await this.audit.record(
          {
            actorUserId: reviewerUserId,
            action: 'clan_application.approve',
            targetType: 'clan_application',
            targetId: app.id,
            metadata: { clanId: clan!.id, name: app.name, tag: app.tag },
            ip: meta.ip,
          },
          tx,
        );
      });
    } catch (err) {
      throw translateApplicationConflict(err);
    }
    return (await this.detail(applicationId))!;
  }

  async reject(
    reviewerUserId: string,
    applicationId: string,
    reason: string,
    meta: RequestMeta,
  ): Promise<AdminClanApplicationResponse> {
    await this.db.transaction(async (tx) => {
      const app = await lockPending(tx, applicationId);
      const now = this.clock.now();
      await tx
        .update(clanApplications)
        .set({
          status: 'rejected',
          rejectionReason: reason,
          reviewedBy: reviewerUserId,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(clanApplications.id, app.id));
      await this.audit.record(
        {
          actorUserId: reviewerUserId,
          action: 'clan_application.reject',
          targetType: 'clan_application',
          targetId: app.id,
          metadata: { reason },
          ip: meta.ip,
        },
        tx,
      );
    });
    return (await this.detail(applicationId))!;
  }

  async pendingCount(): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(clanApplications)
      .where(eq(clanApplications.status, 'pending'));
    return row?.n ?? 0;
  }
}

// ── helpers shared with the membership service ──────────────────────────────

export async function isInClan(tx: Tx, playerId: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: clanMemberships.id })
    .from(clanMemberships)
    .where(and(eq(clanMemberships.playerId, playerId), isNull(clanMemberships.leftAt)));
  return !!row;
}

/**
 * Serializes every "player joins a clan" transaction for one player. Without it, two joins for
 * the same player (accepting two invitations at once) each cancel invitations the other has
 * locked and deadlock. Lock order everywhere: clan row → player row → invitation/request row.
 */
export async function lockPlayer(tx: Tx, playerId: string): Promise<void> {
  await tx
    .select({ id: playerProfiles.id })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, playerId))
    .for('update');
}

/** Once a player joins a clan, their other open invitations and requests are moot. */
export async function cancelOpenInvitesAndRequests(
  tx: Tx,
  playerId: string,
  now: Date,
): Promise<void> {
  await tx
    .update(clanInvitations)
    .set({ status: 'cancelled', respondedAt: now })
    .where(and(eq(clanInvitations.playerId, playerId), eq(clanInvitations.status, 'pending')));
  await tx
    .update(clanJoinRequests)
    .set({ status: 'cancelled', decidedAt: now })
    .where(and(eq(clanJoinRequests.playerId, playerId), eq(clanJoinRequests.status, 'pending')));
}

async function assertNameAndTagFree(tx: Tx, name: string, tag: string): Promise<void> {
  const [byName] = await tx.select({ id: clans.id }).from(clans).where(eq(clans.name, name));
  if (byName) throw nameTaken();
  const [byTag] = await tx.select({ id: clans.id }).from(clans).where(eq(clans.tag, tag));
  if (byTag) throw tagTaken();
}

async function lockPending(tx: Tx, applicationId: string) {
  const [app] = await tx
    .select()
    .from(clanApplications)
    .where(eq(clanApplications.id, applicationId))
    .for('update');
  if (!app) throw AppError.notFound();
  if (app.status !== 'pending') throw notPending();
  return app;
}

function translateApplicationConflict(err: unknown): unknown {
  switch (uniqueViolationConstraint(err)) {
    case 'uq_clans_name':
    case 'uq_clan_app_pending_name':
      return nameTaken();
    case 'uq_clans_tag':
    case 'uq_clan_app_pending_tag':
      return tagTaken();
    case 'uq_clan_app_pending_applicant':
      return new AppError(
        409,
        ErrorCode.APPLICATION_PENDING,
        'You already have an application under review',
      );
    case 'uq_one_active_membership':
      return new AppError(409, ErrorCode.ALREADY_IN_CLAN, 'The applicant is already in a clan');
    default:
      return err;
  }
}

const nameTaken = () => new AppError(409, ErrorCode.CLAN_NAME_TAKEN, 'This clan name is taken');
const tagTaken = () => new AppError(409, ErrorCode.CLAN_TAG_TAKEN, 'This clan tag is taken');
const notPending = () =>
  new AppError(409, ErrorCode.APPLICATION_NOT_PENDING, 'This application has already been decided');

function encodeCursor(ts: string, id: string): string {
  return Buffer.from(`${ts}|${id}`).toString('base64url');
}

function decodeCursor(cursor?: string): { ts: string; id: string } | null {
  if (!cursor) return null;
  const [ts, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  if (!ts || Number.isNaN(Date.parse(ts)) || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { ts, id };
}
