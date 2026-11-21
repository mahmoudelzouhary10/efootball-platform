'use client';

import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Field } from '@/components/ui';
import { Link, useRouter } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function RegisterForm() {
  const t = useTranslations('register');
  const tLogin = useTranslations('login');
  const errorText = useErrorText();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      await apiPost('/auth/register', {
        email: String(form.get('email') ?? ''),
        username: String(form.get('username') ?? ''),
        password: String(form.get('password') ?? ''),
      });
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      const fields = errorText.fields(err);
      // Uniqueness conflicts belong next to their field.
      const code = (err as { code?: string }).code;
      if (code === 'EMAIL_TAKEN') fields.email = errorText.message(err);
      if (code === 'USERNAME_TAKEN') fields.username = errorText.message(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(errorText.message(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <Field
        id="email"
        name="email"
        type="email"
        label={t('email')}
        autoComplete="email"
        dir="ltr"
        required
        maxLength={254}
        error={fieldErrors.email}
      />
      <Field
        id="username"
        name="username"
        label={t('username')}
        hint={t('usernameHint')}
        autoComplete="username"
        dir="ltr"
        required
        minLength={USERNAME_MIN}
        maxLength={USERNAME_MAX}
        pattern="[A-Za-z0-9_]+"
        error={fieldErrors.username}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label={t('password')}
        hint={t('passwordHint')}
        autoComplete="new-password"
        dir="ltr"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        error={fieldErrors.password}
      />
      <Button type="submit" loading={pending}>
        {t('submit')}
      </Button>
      <p className="text-sm text-ink-muted">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-accent underline underline-offset-4">
          {tLogin('title')}
        </Link>
      </p>
    </form>
  );
}
