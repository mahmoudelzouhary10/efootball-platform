import { z } from 'zod';

/**
 * Request shapes shared by the API (authoritative validation) and the web app (form hints).
 * Business rules (uniqueness, verification state, permissions) live only in the API.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/** Usernames that could impersonate staff or collide with routes. Compared case-insensitively. */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'staff',
  'moderator',
  'mod',
  'system',
  'api',
  'auth',
  'me',
  'null',
  'undefined',
  'efp',
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN)
  .max(USERNAME_MAX)
  .regex(/^[a-zA-Z0-9_]+$/, 'username_charset')
  .refine((v) => !RESERVED_USERNAMES.has(v.toLowerCase()), 'username_reserved');

export const emailSchema = z.string().trim().max(254).pipe(z.email());

export const passwordSchema = z.string().min(PASSWORD_MIN).max(PASSWORD_MAX);

export const registerSchema = z.strictObject({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** `identifier` is either an email address or a username. */
export const loginSchema = z.strictObject({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(PASSWORD_MAX),
});
export type LoginInput = z.infer<typeof loginSchema>;

const tokenSchema = z.string().min(20).max(200);

export const verifyEmailSchema = z.strictObject({ token: tokenSchema });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.strictObject({ email: emailSchema });

export const requestPasswordResetSchema = z.strictObject({ email: emailSchema });
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.strictObject({
  token: tokenSchema,
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface MeResponse {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
}
