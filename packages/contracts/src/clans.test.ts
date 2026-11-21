import { describe, expect, it } from 'vitest';
import {
  clanNameSchema,
  clanTagSchema,
  contactUrlSchema,
  createClanApplicationSchema,
} from './clans';
import { createPlayerProfileSchema, normalizeGameId } from './players';

describe('clan schemas', () => {
  it('uppercases tags and rejects symbols', () => {
    expect(clanTagSchema.parse(' efsc ')).toBe('EFSC');
    expect(clanTagSchema.safeParse('EF-S').success).toBe(false);
    expect(clanTagSchema.safeParse('A').success).toBe(false);
    expect(clanTagSchema.safeParse('ABCDEF').success).toBe(false);
  });

  it('accepts Arabic clan names and collapses whitespace', () => {
    expect(clanNameSchema.parse('  نسور   القاهرة ')).toBe('نسور القاهرة');
    expect(clanNameSchema.safeParse('ab').success).toBe(false);
    expect(clanNameSchema.safeParse('bad‎name').success).toBe(false);
  });

  it.each([
    'http://discord.gg/abc',
    'javascript:alert(1)',
    'https://user:pw@example.com',
    'ftp://x.com',
  ])('rejects unsafe contact link %s', (url) => {
    expect(contactUrlSchema.safeParse(url).success).toBe(false);
  });

  it('accepts an https contact link', () => {
    expect(contactUrlSchema.safeParse('https://discord.gg/abc123').success).toBe(true);
  });

  it('requires every application field', () => {
    expect(
      createClanApplicationSchema.safeParse({ name: 'Cairo Eagles', tag: 'CEG' }).success,
    ).toBe(false);
  });
});

describe('player schemas', () => {
  it('normalizes game IDs for uniqueness', () => {
    expect(normalizeGameId('abcd-1234 efgh')).toBe('ABCD1234EFGH');
  });

  it('validates a profile', () => {
    const ok = createPlayerProfileSchema.safeParse({
      gameId: 'AB12-CD34',
      displayName: 'محمود',
      countryCode: 'eg',
    });
    expect(ok.success && ok.data.countryCode).toBe('EG');
    expect(
      createPlayerProfileSchema.safeParse({ gameId: '!!', displayName: 'x', countryCode: 'ZZ' })
        .success,
    ).toBe(false);
  });
});
