import { z } from 'zod';
import { COUNTRY_CODE_SET } from './countries';

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;
export const BIO_MAX = 280;

/**
 * eFootball in-game user ID as the player types it. Konami's exact format isn't published
 * and there is no verification API, so we accept letters, digits, spaces and dashes and
 * compare on a normalized form (uppercase, separators removed).
 */
export const gameIdSchema = z
  .string()
  .trim()
  .min(6)
  .max(24)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]$/, 'game_id_format');

export function normalizeGameId(gameId: string): string {
  return gameId.replace(/[\s-]/g, '').toUpperCase();
}

/** Any script (Arabic names allowed); no control characters or leading/trailing spaces. */
export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN)
  .max(DISPLAY_NAME_MAX)
  .refine((v) => !/[\p{Cc}\p{Cf}]/u.test(v), 'display_name_chars');

export const countryCodeSchema = z
  .string()
  .length(2)
  .transform((v) => v.toUpperCase())
  .refine((v) => COUNTRY_CODE_SET.has(v), 'country_invalid');

const bioSchema = z
  .string()
  .trim()
  .max(BIO_MAX)
  .transform((v) => (v.length ? v : null));

export const createPlayerProfileSchema = z.strictObject({
  gameId: gameIdSchema,
  displayName: displayNameSchema,
  countryCode: countryCodeSchema,
  avatarMediaId: z.uuid().nullable().optional(),
  bio: bioSchema.nullable().optional(),
});
export type CreatePlayerProfileInput = z.infer<typeof createPlayerProfileSchema>;

export const updatePlayerProfileSchema = createPlayerProfileSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'empty_update');
export type UpdatePlayerProfileInput = z.infer<typeof updatePlayerProfileSchema>;

export interface ClanSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
}

export interface PlayerProfileResponse {
  id: string;
  username: string;
  displayName: string;
  gameId: string;
  /**
   * Ownership of the in-game ID has NOT been confirmed unless this is true.
   * Profiles are created unverified; verification is a separate, manual process.
   */
  gameIdVerified: boolean;
  countryCode: string;
  avatarUrl: string | null;
  bio: string | null;
  clan: (ClanSummary & { role: ClanRole }) | null;
  createdAt: string;
}

export type ClanRole = 'leader' | 'co_leader' | 'member';
