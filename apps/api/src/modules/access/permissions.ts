import type { PlatformRole } from '../../db/schema';

/**
 * Platform-level permissions, granted through platform roles.
 * Capability checks (verified organizer) and resource-scoped checks (clan leader, competition
 * staff) are separate policies in their own modules; they are not roles.
 */
export const Permission = {
  AUDIT_LOG_READ: 'audit_log.read',
  ROLE_GRANT: 'role.grant',
  USER_DISABLE: 'user.disable',
  CLAN_APPLICATION_REVIEW: 'clan_application.review',
  ORGANIZER_APPLICATION_REVIEW: 'organizer_application.review',
  DISPUTE_ESCALATION_RESOLVE: 'dispute_escalation.resolve',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/** Versioned with the code on purpose: permission changes go through review, not a UI. */
export const ROLE_PERMISSIONS: Record<PlatformRole, readonly Permission[]> = {
  admin: Object.values(Permission),
  moderator: [
    Permission.CLAN_APPLICATION_REVIEW,
    Permission.ORGANIZER_APPLICATION_REVIEW,
    Permission.DISPUTE_ESCALATION_RESOLVE,
  ],
};

export function permissionsFor(roles: readonly PlatformRole[]): Set<Permission> {
  return new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []));
}
