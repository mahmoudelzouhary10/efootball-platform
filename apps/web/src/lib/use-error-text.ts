'use client';

import { useTranslations } from 'next-intl';
import { ApiError } from './api';

/** Translates API errors: one form-level message plus per-field messages. */
export function useErrorText() {
  const t = useTranslations('errors');

  const message = (err: unknown): string => {
    const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR';
    return t.has(code) ? t(code) : t('INTERNAL_ERROR');
  };

  const fields = (err: unknown): Record<string, string> => {
    if (!(err instanceof ApiError)) return {};
    const out: Record<string, string> = {};
    for (const [field, reasons] of Object.entries(err.fieldErrors)) {
      const reason = reasons[0] ?? 'invalid';
      out[field] = t.has(`field.${reason}`) ? t(`field.${reason}`) : t('field.invalid');
    }
    return out;
  };

  return { message, fields };
}
