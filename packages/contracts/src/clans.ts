import { z } from 'zod';
import type { ClanRole, ClanSummary } from './players';

export const CLAN_NAME_MIN = 3;
export const CLAN_NAME_MAX = 32;
export const CLAN_TAG_MIN = 2;
export const CLAN_TAG_MAX = 5;
export const CLAN_DESCRIPTION_MAX = 500;
export const CLAN_MAX_MEMBERS = 50;
export const JOIN_MESSAGE_MAX = 280;
export const REJECTION_REASON_MAX = 500;

/** Clan names may use any script; collapse inner whitespace; no control characters. */
export const clanNameSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ' '))
  .pipe(z.string().min(CLAN_NAME_MIN).max(CLAN_NAME_MAX))
  .refine((v) => !/[\p{Cc}\p{Cf}]/u.test(v), 'clan_name_chars');

/** Short uppercase tag shown in brackets, e.g. [EFSC]. Also used in clan URLs. */
export const clanTagSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(
    z
      .string()
      .min(CLAN_TAG_MIN)
      .max(CLAN_TAG_MAX)
      .regex(/^[A-Z0-9]+$/, 'clan_tag_format'),
  );

/** Contact link (Discord, WhatsApp group, Facebook page…). HTTPS only, no credentials in URL. */
export const contactUrlSchema = z
  .string()
  .trim()
  .max(300)
  .pipe(z.url({ protocol: /^https$/, hostname: z.regexes.domain }))
  .refine((v) => {
    const u = new URL(v);
    return !u.username && !u.password;
  }, 'contact_url_credentials');

const descriptionSchema = z.string().trim().min(10).max(CLAN_DESCRIPTION_MAX);

export const createClanApplicationSchema = z.strictObject({
  name: clanNameSchema,
  tag: clanTagSchema,
  logoMediaId: z.uuid(),
  description: descriptionSchema,
  contactUrl: contactUrlSchema,
});
export type CreateClanApplicationInput = z.infer<typeof createClanApplicationSchema>;

export const rejectClanApplicationSchema = z.strictObject({
  reason: z.string().trim().min(5).max(REJECTION_REASON_MAX),
});
export type RejectClanApplicationInput = z.infer<typeof rejectClanApplicationSchema>;

/** Name and tag are fixed once approved (they identify the clan in competitions). */
export const updateClanSchema = z
  .strictObject({
    logoMediaId: z.uuid().optional(),
    description: descriptionSchema.optional(),
    contactUrl: contactUrlSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'empty_update');
export type UpdateClanInput = z.infer<typeof updateClanSchema>;

export const inviteToClanSchema = z.strictObject({ username: z.string().trim().min(1).max(20) });
export const joinRequestSchema = z.strictObject({
  message: z
    .string()
    .trim()
    .max(JOIN_MESSAGE_MAX)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
});
export const changeMemberRoleSchema = z.strictObject({ role: z.enum(['co_leader', 'member']) });
export const transferLeadershipSchema = z.strictObject({
  username: z.string().trim().min(1).max(20),
});

export const clanListQuerySchema = z.strictObject({
  q: z.string().trim().max(32).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export const CLAN_APPLICATION_STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'] as const;
export type ClanApplicationStatus = (typeof CLAN_APPLICATION_STATUSES)[number];

export const adminApplicationsQuerySchema = z.strictObject({
  status: z.enum(CLAN_APPLICATION_STATUSES).default('pending'),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── responses ───────────────────────────────────────────────────────────────

export interface PlayerSummary {
  id: string;
  username: string;
  displayName: string;
  countryCode: string;
  avatarUrl: string | null;
  gameIdVerified: boolean;
}

export interface ClanMemberResponse extends PlayerSummary {
  role: ClanRole;
  joinedAt: string;
}

export interface ClanCardResponse extends ClanSummary {
  description: string;
  memberCount: number;
  createdAt: string;
}

export interface ClanDetailResponse extends ClanCardResponse {
  contactUrl: string;
  members: ClanMemberResponse[];
  maxMembers: number;
}

export interface ClanApplicationResponse {
  id: string;
  status: ClanApplicationStatus;
  name: string;
  tag: string;
  logoUrl: string | null;
  description: string;
  contactUrl: string;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  clanTag: string | null;
}

export interface AdminClanApplicationResponse extends ClanApplicationResponse {
  applicant: PlayerSummary & { email: string; emailVerified: boolean; accountCreatedAt: string };
  reviewedBy: string | null;
  /** Live checks to help the reviewer; the server re-checks on approval. */
  checks: { nameAvailable: boolean; tagAvailable: boolean; applicantInClan: boolean };
}

export interface ClanInvitationResponse {
  id: string;
  clan: ClanSummary;
  player: PlayerSummary;
  invitedBy: PlayerSummary;
  createdAt: string;
  expiresAt: string;
}

export interface ClanJoinRequestResponse {
  id: string;
  clan: ClanSummary;
  player: PlayerSummary;
  message: string | null;
  createdAt: string;
}

export interface MyClanResponse {
  membership: { clan: ClanSummary; role: ClanRole; joinedAt: string } | null;
  invitations: ClanInvitationResponse[];
  joinRequests: ClanJoinRequestResponse[];
  application: ClanApplicationResponse | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AdminOverviewResponse {
  pendingClanApplications: number;
  users: number;
  players: number;
  activeClans: number;
}

export interface MediaResponse {
  id: string;
  url: string;
  width: number;
  height: number;
}
