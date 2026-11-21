'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Field } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function ForgotPasswordForm() {
  const t = useTranslations('forgot');
  const errorText = useErrorText();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await apiPost('/auth/password-reset/request', { email: String(form.get('email') ?? '') });
      setSent(true);
    } catch (err) {
      setError(errorText.message(err));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">{t('sent')}</Alert>
        <Link href="/login" className="text-sm text-accent underline underline-offset-4">
          {t('back')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-ink-muted">{t('intro')}</p>
      {error && <Alert tone="error">{error}</Alert>}
      <Field
        id="email"
        name="email"
        type="email"
        label={t('email')}
        autoComplete="email"
        dir="ltr"
        required
      />
      <Button type="submit" loading={pending}>
        {t('submit')}
      </Button>
      <Link
        href="/login"
        className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        {t('back')}
      </Link>
    </form>
  );
}
