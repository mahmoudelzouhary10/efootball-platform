import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert, AuthShell } from '@/components/ui';
import { ResetPasswordForm } from './reset-password-form';

export async function generateMetadata() {
  const t = await getTranslations('reset');
  return { title: t('title') };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ locale }, { token }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('reset');
  return (
    <AuthShell title={t('title')}>
      {typeof token === 'string' && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert tone="error">{t('missingToken')}</Alert>
      )}
    </AuthShell>
  );
}
