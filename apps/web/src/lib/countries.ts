import 'server-only';
import { ARAB_COUNTRY_CODES, COUNTRY_CODES } from '@efp/contracts';
import type { CountryOptions } from '@/components/country-select';
import { countryName, flagEmoji } from '@/components/identity';

/** Localized, sorted country list for the picker. Built once per request on the server. */
export function countryOptions(locale: string): CountryOptions {
  const collator = new Intl.Collator(locale);
  const build = (codes: readonly string[]) =>
    codes
      .map((code) => ({ code, name: countryName(code, locale) }))
      .sort((a, b) => collator.compare(a.name, b.name))
      .map(({ code, name }) => ({ code, label: `${flagEmoji(code)} ${name}` }));
  const arabSet = new Set<string>(ARAB_COUNTRY_CODES);
  return {
    arab: build(ARAB_COUNTRY_CODES),
    others: build(COUNTRY_CODES.filter((c) => !arabSet.has(c))),
  };
}
