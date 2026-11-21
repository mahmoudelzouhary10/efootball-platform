'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

type State = { kind: 'pending' } | { kind: 'done' } | { kind: 'error'; message: string };

/**
 * Redeems the token with a POST from the browser. Doing it on page load (not in a GET handler)
 * means link scanners that pre-fetch URLs in emails can't consume the token.
 */
export function VerifyEmail({ token }: { token: string | null }) {
  const t = useTranslations('verify');
  const errorText = useErrorText();
  const [state, setState] = useState<State>({ kind: 'pending' });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // StrictMode runs effects twice in dev; a token works only once.
    apiPost('/auth/verify-email', { token })
      .then(() => setState({ kind: 'done' }))
      .catch((err) => setState({ kind: 'error', message: errorText.message(err) }));
  }, [token, errorText]);

  if (!token) return <Alert tone="error">{t('missingToken')}</Alert>;
  if (state.kind === 'pending') return <p className="text-ink-muted">{t('verifying')}</p>;
  if (state.kind === 'error') return <Alert tone="error">{state.message}</Alert>;
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="success">{t('success')}</Alert>
      <Link
        href="/account"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-accent-ink"
      >
        {t('continue')}
      </Link>
    </div>
  );
}
