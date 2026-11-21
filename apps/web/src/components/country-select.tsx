'use client';

import { useTranslations } from 'next-intl';
import { Select } from './ui';

export interface CountryOption {
  code: string;
  label: string;
}

export interface CountryOptions {
  arab: CountryOption[];
  others: CountryOption[];
}

/**
 * Native select (best on phones), Arab countries first. The localized, sorted list is built on
 * the server (see countryOptions) and passed in, so server and browser render identical text.
 */
export function CountrySelect({
  options,
  defaultValue,
  error,
}: {
  options: CountryOptions;
  defaultValue?: string;
  error?: string;
}) {
  const t = useTranslations('profileForm');
  const option = (c: CountryOption) => (
    <option key={c.code} value={c.code}>
      {c.label}
    </option>
  );
  return (
    <Select
      id="countryCode"
      name="countryCode"
      label={t('country')}
      defaultValue={defaultValue ?? ''}
      required
      error={error}
    >
      <option value="" disabled>
        {t('countryPlaceholder')}
      </option>
      <optgroup label={t('arabWorld')}>{options.arab.map(option)}</optgroup>
      <optgroup label={t('otherCountries')}>{options.others.map(option)}</optgroup>
    </Select>
  );
}
