import { describe, expect, it } from 'vitest';
import { Permission, permissionsFor } from './permissions';

describe('permissionsFor', () => {
  it('gives no permissions to a user without roles', () => {
    expect(permissionsFor([]).size).toBe(0);
  });

  it('gives admins every permission', () => {
    expect(permissionsFor(['admin'])).toEqual(new Set(Object.values(Permission)));
  });

  it('does not let moderators grant roles or read the audit log', () => {
    const p = permissionsFor(['moderator']);
    expect(p.has(Permission.CLAN_APPLICATION_REVIEW)).toBe(true);
    expect(p.has(Permission.ROLE_GRANT)).toBe(false);
    expect(p.has(Permission.AUDIT_LOG_READ)).toBe(false);
  });
});
