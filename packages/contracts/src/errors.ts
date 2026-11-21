/**
 * Stable machine-readable error codes returned in RFC 9457 problem+json bodies (`code` field).
 * The web app maps these to translated messages. Never rename a code once shipped.
 */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  CSRF_REJECTED: 'CSRF_REJECTED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // Phase 2 — media
  MEDIA_INVALID: 'MEDIA_INVALID',
  // Phase 2 — players
  PROFILE_REQUIRED: 'PROFILE_REQUIRED',
  PROFILE_EXISTS: 'PROFILE_EXISTS',
  GAME_ID_TAKEN: 'GAME_ID_TAKEN',
  // Phase 2 — clans
  CLAN_NAME_TAKEN: 'CLAN_NAME_TAKEN',
  CLAN_TAG_TAKEN: 'CLAN_TAG_TAKEN',
  ALREADY_IN_CLAN: 'ALREADY_IN_CLAN',
  NOT_IN_CLAN: 'NOT_IN_CLAN',
  APPLICATION_PENDING: 'APPLICATION_PENDING',
  APPLICATION_NOT_PENDING: 'APPLICATION_NOT_PENDING',
  CLAN_FULL: 'CLAN_FULL',
  INVITATION_EXISTS: 'INVITATION_EXISTS',
  INVITATION_NOT_PENDING: 'INVITATION_NOT_PENDING',
  JOIN_REQUEST_EXISTS: 'JOIN_REQUEST_EXISTS',
  JOIN_REQUEST_NOT_PENDING: 'JOIN_REQUEST_NOT_PENDING',
  LEADER_MUST_TRANSFER: 'LEADER_MUST_TRANSFER',
  CANNOT_TARGET_SELF: 'CANNOT_TARGET_SELF',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  detail?: string;
  /** Field-level validation issues, keyed by dotted path. */
  errors?: Record<string, string[]>;
}
