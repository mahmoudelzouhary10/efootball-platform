import { Inject, Injectable } from '@nestjs/common';
import {
  CreatePlayerProfileInput,
  ErrorCode,
  normalizeGameId,
  PlayerProfileResponse,
  UpdatePlayerProfileInput,
} from '@efp/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import { Clock } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import { DB, Database, DbExecutor, uniqueViolationConstraint } from '../../db/db.module';
import { clanMemberships, clans, playerProfiles, users } from '../../db/schema';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../identity/session.service';
import { mediaUrl, MediaService } from '../media/media.service';

export type PlayerProfileRow = typeof playerProfiles.$inferSelect;

@Injectable()
export class PlayersService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly clock: Clock,
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  async findByUserId(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<PlayerProfileRow | null> {
    const [row] = await executor
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId));
    return row ?? null;
  }

  /** Every competitive action needs a player profile; this is the single gate. */
  async requireProfile(userId: string, executor: DbExecutor = this.db): Promise<PlayerProfileRow> {
    const profile = await this.findByUserId(userId, executor);
    if (!profile) {
      throw new AppError(403, ErrorCode.PROFILE_REQUIRED, 'Create your player profile first');
    }
    return profile;
  }

  /** Resolves a username to its player profile (for invitations, transfers, public pages). */
  async findByUsername(
    username: string,
    executor: DbExecutor = this.db,
  ): Promise<PlayerProfileRow | null> {
    const [row] = await executor
      .select({ profile: playerProfiles })
      .from(playerProfiles)
      .innerJoin(users, eq(users.id, playerProfiles.userId))
      .where(and(eq(users.username, username), eq(users.status, 'active')));
    return row?.profile ?? null;
  }

  async create(auth: AuthContext, input: CreatePlayerProfileInput): Promise<PlayerProfileResponse> {
    if (!auth.emailVerified) {
      throw new AppError(
        403,
        ErrorCode.EMAIL_NOT_VERIFIED,
        'Confirm your email before creating a profile',
      );
    }
    if (input.avatarMediaId)
      await this.media.assertOwned(input.avatarMediaId, auth.userId, 'avatar');

    try {
      await this.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(playerProfiles)
          .values({
            userId: auth.userId,
            gameId: input.gameId,
            gameIdNormalized: normalizeGameId(input.gameId),
            displayName: input.displayName,
            countryCode: input.countryCode,
            avatarMediaId: input.avatarMediaId ?? null,
            bio: input.bio ?? null,
          })
          .returning({ id: playerProfiles.id });
        await this.audit.record(
          {
            actorUserId: auth.userId,
            action: 'player.create',
            targetType: 'player',
            targetId: row!.id,
          },
          tx,
        );
      });
    } catch (err) {
      throw translateUnique(err);
    }
    return (await this.publicProfile(auth.username))!;
  }

  async update(auth: AuthContext, input: UpdatePlayerProfileInput): Promise<PlayerProfileResponse> {
    if (input.avatarMediaId)
      await this.media.assertOwned(input.avatarMediaId, auth.userId, 'avatar');

    try {
      await this.db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(playerProfiles)
          .where(eq(playerProfiles.userId, auth.userId))
          .for('update');
        if (!current)
          throw new AppError(403, ErrorCode.PROFILE_REQUIRED, 'Create your player profile first');

        const patch: Partial<typeof playerProfiles.$inferInsert> = { updatedAt: this.clock.now() };
        if (input.displayName !== undefined) patch.displayName = input.displayName;
        if (input.countryCode !== undefined) patch.countryCode = input.countryCode;
        if (input.avatarMediaId !== undefined) patch.avatarMediaId = input.avatarMediaId;
        if (input.bio !== undefined) patch.bio = input.bio;

        const gameIdChanged =
          input.gameId !== undefined && normalizeGameId(input.gameId) !== current.gameIdNormalized;
        if (input.gameId !== undefined) patch.gameId = input.gameId;
        if (gameIdChanged) {
          patch.gameIdNormalized = normalizeGameId(input.gameId!);
          // A new ID has not been verified, whatever the old one's status was.
          patch.gameIdVerifiedAt = null;
          patch.gameIdVerifiedBy = null;
        }

        await tx.update(playerProfiles).set(patch).where(eq(playerProfiles.id, current.id));
        if (gameIdChanged) {
          await this.audit.record(
            {
              actorUserId: auth.userId,
              action: 'player.game_id_changed',
              targetType: 'player',
              targetId: current.id,
              metadata: { from: current.gameId, to: input.gameId },
            },
            tx,
          );
        }
      });
    } catch (err) {
      throw translateUnique(err);
    }
    return (await this.publicProfile(auth.username))!;
  }

  /** Public profile by username, including the current clan if any. */
  async publicProfile(username: string): Promise<PlayerProfileResponse | null> {
    const [row] = await this.db
      .select({
        profile: playerProfiles,
        username: users.username,
        clanId: clans.id,
        clanName: clans.name,
        clanTag: clans.tag,
        clanLogo: clans.logoMediaId,
        clanRole: clanMemberships.role,
      })
      .from(playerProfiles)
      .innerJoin(users, eq(users.id, playerProfiles.userId))
      .leftJoin(
        clanMemberships,
        and(eq(clanMemberships.playerId, playerProfiles.id), isNull(clanMemberships.leftAt)),
      )
      .leftJoin(clans, eq(clans.id, clanMemberships.clanId))
      .where(and(eq(users.username, username), eq(users.status, 'active')));
    if (!row) return null;
    const p = row.profile;
    return {
      id: p.id,
      username: row.username,
      displayName: p.displayName,
      gameId: p.gameId,
      gameIdVerified: p.gameIdVerifiedAt !== null,
      countryCode: p.countryCode,
      avatarUrl: mediaUrl(p.avatarMediaId),
      bio: p.bio,
      clan:
        row.clanId && row.clanRole
          ? {
              id: row.clanId,
              name: row.clanName!,
              tag: row.clanTag!,
              logoUrl: mediaUrl(row.clanLogo),
              role: row.clanRole,
            }
          : null,
      createdAt: p.createdAt.toISOString(),
    };
  }
}

function translateUnique(err: unknown): unknown {
  const constraint = uniqueViolationConstraint(err);
  if (constraint === 'uq_player_user') {
    return new AppError(409, ErrorCode.PROFILE_EXISTS, 'You already have a player profile');
  }
  if (constraint === 'uq_player_game_id') {
    return new AppError(
      409,
      ErrorCode.GAME_ID_TAKEN,
      'This game ID is already linked to another profile',
    );
  }
  return err;
}
