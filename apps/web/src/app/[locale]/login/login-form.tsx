'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Field } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function LoginForm() {
  const t = useTranslations('login');
  const tRegister = useTranslations('register');
  const errorText = useErrorText();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await apiPost('/auth/login', {
        identifier: String(form.get('identifier') ?? ''),
        password: String(form.get('password') ?? ''),
      });
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(errorText.message(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <Field
        id="identifier"
        name="identifier"
        label={t('identifier')}
        autoComplete="username"
        dir="ltr"
        required
        maxLength={254}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label={t('password')}
        autoComplete="current-password"
        dir="ltr"
        required
        maxLength={128}
      />
      <Button type="submit" loading={pending}>
        {t('submit')}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link
          href="/forgot-password"
          className="text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          {t('forgot')}
        </Link>
        <span className="text-ink-muted">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-accent underline underline-offset-4">
            {tRegister('title')}
          </Link>
        </span>
      </div>
    </form>
  );
}
