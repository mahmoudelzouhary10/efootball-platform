import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
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
