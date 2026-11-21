'use client';

import { PASSWORD_MAX, PASSWORD_MIN } from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Field } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('reset');
  const tRegister = useTranslations('register');
  const errorText = useErrorText();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    setFieldError(undefined);
    try {
      await apiPost('/auth/password-reset/confirm', {
        token,
        password: String(form.get('password') ?? ''),
      });
      setDone(true);
      router.refresh(); // the API cleared the session cookie
    } catch (err) {
      const fields = errorText.fields(err);
      if (fields.password) setFieldError(fields.password);
      else setError(errorText.message(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">{t('success')}</Alert>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-accent-ink"
        >
          {t('toLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <Field
        id="password"
        name="password"
        type="password"
        label={t('password')}
        hint={tRegister('passwordHint')}
        autoComplete="new-password"
        dir="ltr"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        error={fieldError}
      />
      <Button type="submit" loading={pending}>
        {t('submit')}
      </Button>
    </form>
  );
}
