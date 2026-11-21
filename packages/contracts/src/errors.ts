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
