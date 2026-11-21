import { describe, expect, it } from 'vitest';
import { ClanPolicy } from './clan.policy';

describe('ClanPolicy', () => {
  it('lets leaders and co-leaders manage the roster, not members or outsiders', () => {
    expect(ClanPolicy.canManageRoster('leader')).toBe(true);
    expect(ClanPolicy.canManageRoster('co_leader')).toBe(true);
    expect(ClanPolicy.canManageRoster('member')).toBe(false);
    expect(ClanPolicy.canManageRoster(null)).toBe(false);
  });

  it.each([
    ['leader', 'co_leader', true],
    ['leader', 'member', true],
    ['co_leader', 'member', true],
    ['co_leader', 'co_leader', false],
    ['member', 'member', false],
    ['leader', 'leader', false],
    [null, 'member', false],
  ] as const)('%s kicking %s → %s', (actor, target, expected) => {
    expect(ClanPolicy.canKick(actor, target)).toBe(expected);
  });

  it('reserves role changes, transfers and profile edits for the leader', () => {
    for (const fn of [
      ClanPolicy.canChangeRoles,
      ClanPolicy.canTransferLeadership,
      ClanPolicy.canEditProfile,
    ]) {
      expect(fn('leader')).toBe(true);
      expect(fn('co_leader')).toBe(false);
      expect(fn('member')).toBe(false);
    }
  });

  it('does not let the leader leave without transferring', () => {
    expect(ClanPolicy.canLeave('leader')).toBe(false);
    expect(ClanPolicy.canLeave('co_leader')).toBe(true);
    expect(ClanPolicy.canLeave('member')).toBe(true);
  });
});
