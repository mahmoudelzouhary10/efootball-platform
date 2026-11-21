'use client';

import { PASSWORD_MAX, PASSWORD_MIN } from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Field } from '@/components/ui';
import { useRouter } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function ResendVerification() {
  const t = useTranslations('account');
  const errorText = useErrorText();
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setStatus('pending');
    setError(null);
    try {
      await apiPost('/auth/verify-email/resend');
      setStatus('sent');
    } catch (err) {
      setError(errorText.message(err));
      setStatus('idle');
    }
  }

  return (
    <Alert tone={status === 'sent' ? 'success' : 'warning'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{status === 'sent' ? t('resent') : t('verifyBanner')}</span>
        {status !== 'sent' && (
          <Button
            variant="secondary"
            onClick={resend}
            loading={status === 'pending'}
            className="shrink-0"
          >
            {t('resend')}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-danger">{error}</p>}
    </Alert>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations('account');
  const tRegister = useTranslations('register');
  const errorText = useErrorText();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setPending(true);
    setDone(false);
    setError(null);
    setFieldError(undefined);
    try {
      await apiPost('/auth/password', {
        currentPassword: String(form.get('currentPassword') ?? ''),
        newPassword: String(form.get('newPassword') ?? ''),
      });
      formEl.reset();
      setDone(true);
    } catch (err) {
      const fields = errorText.fields(err);
      if (fields.newPassword) setFieldError(fields.newPassword);
      else setError(errorText.message(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {done && <Alert tone="success">{t('passwordChanged')}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      <Field
        id="currentPassword"
        name="currentPassword"
        type="password"
        label={t('currentPassword')}
        autoComplete="current-password"
        dir="ltr"
        required
      />
      <Field
        id="newPassword"
        name="newPassword"
        type="password"
        label={t('newPassword')}
        hint={tRegister('passwordHint')}
        autoComplete="new-password"
        dir="ltr"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        error={fieldError}
      />
      <Button type="submit" loading={pending} className="self-start">
        {t('savePassword')}
      </Button>
    </form>
  );
}

export function SessionActions() {
  const t = useTranslations('account');
  const errorText = useErrorText();
  const router = useRouter();
  const [pending, setPending] = useState<'one' | 'all' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function logout(scope: 'one' | 'all') {
    setPending(scope);
    setError(null);
    try {
      await apiPost(scope === 'all' ? '/auth/logout-all' : '/auth/logout');
      router.replace('/login');
      router.refresh();
    } catch (err) {
      setError(errorText.message(err));
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => logout('one')} loading={pending === 'one'}>
          {t('logout')}
        </Button>
        <Button variant="danger" onClick={() => logout('all')} loading={pending === 'all'}>
          {t('logoutAll')}
        </Button>
      </div>
    </div>
  );
}
