import type { ClanRole } from '../../db/schema';

/**
 * Who may do what inside a clan. Pure functions: the service loads the actor's membership
 * (under a row lock) and asks these. Keeping the rules in one place makes them reviewable
 * and unit-testable.
 *
 * | action                         | leader | co_leader | member |
 * | ------------------------------ | ------ | --------- | ------ |
 * | invite / revoke invitations    | ✓      | ✓         |        |
 * | approve / reject join requests | ✓      | ✓         |        |
 * | kick a member                  | ✓      | ✓         |        |
 * | kick a co-leader               | ✓      |           |        |
 * | promote / demote               | ✓      |           |        |
 * | transfer leadership            | ✓      |           |        |
 * | edit logo/description/contact  | ✓      |           |        |
 * | leave                          |        | ✓         | ✓      |
 */
export const ClanPolicy = {
  canManageRoster(role: ClanRole | null): boolean {
    return role === 'leader' || role === 'co_leader';
  },

  canKick(actor: ClanRole | null, target: ClanRole): boolean {
    if (target === 'leader') return false;
    if (actor === 'leader') return true;
    return actor === 'co_leader' && target === 'member';
  },

  canChangeRoles(actor: ClanRole | null): boolean {
    return actor === 'leader';
  },

  canTransferLeadership(actor: ClanRole | null): boolean {
    return actor === 'leader';
  },

  canEditProfile(actor: ClanRole | null): boolean {
    return actor === 'leader';
  },

  /** The leader must hand over leadership first, so a clan is never left without one. */
  canLeave(actor: ClanRole | null): boolean {
    return actor === 'co_leader' || actor === 'member';
  },
} as const;
