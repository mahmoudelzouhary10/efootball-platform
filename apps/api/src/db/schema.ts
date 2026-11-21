import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Database schema. Integrity rules live here (FKs, CHECKs, unique indexes) so that a bug in
 * application code cannot violate them. Each table is owned by one module (noted per table).
 */

/** Case-insensitive text. Requires `CREATE EXTENSION citext` (first migration). */
const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

// ── identity ────────────────────────────────────────────────────────────────

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: citext('email').notNull(),
    username: citext('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    status: text('status').$type<UserStatus>().notNull().default('active'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_users_email').on(t.email),
    uniqueIndex('uq_users_username').on(t.username),
    check('ck_users_status', sql`${t.status} IN ('active', 'disabled')`),
    check('ck_users_username_format', sql`${t.username} ~ '^[A-Za-z0-9_]{3,20}$'`),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 (hex) of the cookie token. The raw token is never stored. */
    tokenHash: text('token_hash').notNull(),
    createdAt: createdAt(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    /** Sliding idle expiry, pushed forward on use. */
    idleExpiresAt: timestamp('idle_expires_at', { withTimezone: true }).notNull(),
    /** Hard cap regardless of activity. */
    absoluteExpiresAt: timestamp('absolute_expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ip: text('ip'),
    userAgent: text('user_agent'),
  },
  (t) => [
    uniqueIndex('uq_sessions_token_hash').on(t.tokenHash),
    index('ix_sessions_user_active')
      .on(t.userId)
      .where(sql`${t.revokedAt} IS NULL`),
  ],
);

export const AUTH_TOKEN_PURPOSES = ['email_verification', 'password_reset'] as const;
export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSES)[number];

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose').$type<AuthTokenPurpose>().notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('uq_auth_tokens_hash').on(t.tokenHash),
    index('ix_auth_tokens_user_purpose').on(t.userId, t.purpose),
    check('ck_auth_tokens_purpose', sql`${t.purpose} IN ('email_verification', 'password_reset')`),
  ],
);

// ── access ──────────────────────────────────────────────────────────────────

export const PLATFORM_ROLES = ['admin', 'moderator'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').$type<PlatformRole>().notNull(),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.role] }),
    check('ck_user_roles_role', sql`${t.role} IN ('admin', 'moderator')`),
  ],
);

// ── platform ────────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Null for system actions (jobs) or when the actor account was deleted. */
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ip: text('ip'),
    createdAt: createdAt(),
  },
  (t) => [
    index('ix_audit_target').on(t.targetType, t.targetId),
    index('ix_audit_actor').on(t.actorUserId),
    index('ix_audit_created').on(t.createdAt.desc(), t.id.desc()),
  ],
);

// ── media ───────────────────────────────────────────────────────────────────

export const MEDIA_KINDS = ['clan_logo', 'avatar'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Uploaded images. Files are always re-encoded server-side; the original upload is never stored. */
export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    kind: text('kind').$type<MediaKind>().notNull(),
    storageKey: text('storage_key').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('uq_media_storage_key').on(t.storageKey),
    index('ix_media_owner').on(t.ownerUserId),
    check('ck_media_kind', sql`${t.kind} IN ('clan_logo', 'avatar')`),
    check('ck_media_size', sql`${t.byteSize} > 0 AND ${t.width} > 0 AND ${t.height} > 0`),
  ],
);

// ── players ─────────────────────────────────────────────────────────────────

export const playerProfiles = pgTable(
  'player_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** As typed by the player (for display). */
    gameId: text('game_id').notNull(),
    /** Uppercase, separators removed. Uniqueness is enforced on this. */
    gameIdNormalized: text('game_id_normalized').notNull(),
    displayName: text('display_name').notNull(),
    countryCode: text('country_code').notNull(),
    avatarMediaId: uuid('avatar_media_id').references(() => media.id, { onDelete: 'set null' }),
    bio: text('bio'),
    /**
     * Ownership verification of the in-game ID. Null = not verified (the default).
     * Kept separate from registration because Konami offers no verification API.
     */
    gameIdVerifiedAt: timestamp('game_id_verified_at', { withTimezone: true }),
    gameIdVerifiedBy: uuid('game_id_verified_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_player_user').on(t.userId),
    uniqueIndex('uq_player_game_id').on(t.gameIdNormalized),
    check('ck_player_country', sql`${t.countryCode} ~ '^[A-Z]{2}$'`),
    check('ck_player_display_name', sql`char_length(${t.displayName}) BETWEEN 2 AND 24`),
    check('ck_player_bio', sql`${t.bio} IS NULL OR char_length(${t.bio}) <= 280`),
    check('ck_player_game_id', sql`${t.gameIdNormalized} ~ '^[A-Z0-9]{4,24}$'`),
  ],
);

// ── clans ───────────────────────────────────────────────────────────────────

export const CLAN_STATUSES = ['active', 'disbanded'] as const;
export type ClanStatus = (typeof CLAN_STATUSES)[number];

export const clans = pgTable(
  'clans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: citext('name').notNull(),
    tag: citext('tag').notNull(),
    logoMediaId: uuid('logo_media_id').references(() => media.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    contactUrl: text('contact_url').notNull(),
    status: text('status').$type<ClanStatus>().notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_clans_name').on(t.name),
    uniqueIndex('uq_clans_tag').on(t.tag),
    check('ck_clans_status', sql`${t.status} IN ('active', 'disbanded')`),
    check('ck_clans_tag', sql`${t.tag} ~ '^[A-Z0-9]{2,5}$'`),
    check('ck_clans_name', sql`char_length(${t.name}) BETWEEN 3 AND 32`),
    check('ck_clans_contact_url', sql`${t.contactUrl} LIKE 'https://%'`),
    index('ix_clans_name_trgm').using('gin', sql`${t.name} gin_trgm_ops`),
  ],
);

export const CLAN_APPLICATION_STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'] as const;
export type ClanApplicationStatus = (typeof CLAN_APPLICATION_STATUSES)[number];

export const clanApplications = pgTable(
  'clan_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicantPlayerId: uuid('applicant_player_id')
      .notNull()
      .references(() => playerProfiles.id, { onDelete: 'cascade' }),
    name: citext('name').notNull(),
    tag: citext('tag').notNull(),
    logoMediaId: uuid('logo_media_id').references(() => media.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    contactUrl: text('contact_url').notNull(),
    status: text('status').$type<ClanApplicationStatus>().notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    clanId: uuid('clan_id').references(() => clans.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One open application per player, and no two open applications for the same name/tag.
    uniqueIndex('uq_clan_app_pending_applicant')
      .on(t.applicantPlayerId)
      .where(sql`${t.status} = 'pending'`),
    uniqueIndex('uq_clan_app_pending_name')
      .on(t.name)
      .where(sql`${t.status} = 'pending'`),
    uniqueIndex('uq_clan_app_pending_tag')
      .on(t.tag)
      .where(sql`${t.status} = 'pending'`),
    uniqueIndex('uq_clan_app_clan').on(t.clanId),
    index('ix_clan_app_status_created').on(t.status, t.createdAt, t.id),
    check(
      'ck_clan_app_status',
      sql`${t.status} IN ('pending', 'approved', 'rejected', 'withdrawn')`,
    ),
    check('ck_clan_app_tag', sql`${t.tag} ~ '^[A-Z0-9]{2,5}$'`),
    check(
      'ck_clan_app_rejection',
      sql`(${t.status} = 'rejected') = (${t.rejectionReason} IS NOT NULL)`,
    ),
    check('ck_clan_app_approved_clan', sql`(${t.status} = 'approved') = (${t.clanId} IS NOT NULL)`),
  ],
);

export const CLAN_ROLES = ['leader', 'co_leader', 'member'] as const;
export type ClanRole = (typeof CLAN_ROLES)[number];

export const clanMemberships = pgTable(
  'clan_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => playerProfiles.id, { onDelete: 'cascade' }),
    role: text('role').$type<ClanRole>().notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    leaveReason: text('leave_reason').$type<'left' | 'kicked'>(),
  },
  (t) => [
    // Approved rule: a player is in at most one clan at a time.
    uniqueIndex('uq_one_active_membership')
      .on(t.playerId)
      .where(sql`${t.leftAt} IS NULL`),
    // Exactly one active leader per clan (at most one here; services keep it at least one).
    uniqueIndex('uq_one_leader')
      .on(t.clanId)
      .where(sql`${t.role} = 'leader' AND ${t.leftAt} IS NULL`),
    index('ix_memberships_clan_active')
      .on(t.clanId)
      .where(sql`${t.leftAt} IS NULL`),
    check('ck_membership_role', sql`${t.role} IN ('leader', 'co_leader', 'member')`),
    check('ck_membership_leave', sql`(${t.leftAt} IS NULL) = (${t.leaveReason} IS NULL)`),
    check(
      'ck_membership_leave_reason',
      sql`${t.leaveReason} IS NULL OR ${t.leaveReason} IN ('left', 'kicked')`,
    ),
  ],
);

export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'declined',
  'revoked',
  'cancelled',
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const clanInvitations = pgTable(
  'clan_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => playerProfiles.id, { onDelete: 'cascade' }),
    invitedByPlayerId: uuid('invited_by_player_id').references(() => playerProfiles.id, {
      onDelete: 'set null',
    }),
    status: text('status').$type<InvitationStatus>().notNull().default('pending'),
    createdAt: createdAt(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_invitation_pending')
      .on(t.clanId, t.playerId)
      .where(sql`${t.status} = 'pending'`),
    index('ix_invitation_player_pending')
      .on(t.playerId)
      .where(sql`${t.status} = 'pending'`),
    check(
      'ck_invitation_status',
      sql`${t.status} IN ('pending', 'accepted', 'declined', 'revoked', 'cancelled')`,
    ),
  ],
);

export const JOIN_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUSES)[number];

export const clanJoinRequests = pgTable(
  'clan_join_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => playerProfiles.id, { onDelete: 'cascade' }),
    message: text('message'),
    status: text('status').$type<JoinRequestStatus>().notNull().default('pending'),
    decidedByPlayerId: uuid('decided_by_player_id').references(() => playerProfiles.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_join_request_pending')
      .on(t.clanId, t.playerId)
      .where(sql`${t.status} = 'pending'`),
    index('ix_join_request_player_pending')
      .on(t.playerId)
      .where(sql`${t.status} = 'pending'`),
    check(
      'ck_join_request_status',
      sql`${t.status} IN ('pending', 'approved', 'rejected', 'cancelled')`,
    ),
    check('ck_join_request_message', sql`${t.message} IS NULL OR char_length(${t.message}) <= 280`),
  ],
);
