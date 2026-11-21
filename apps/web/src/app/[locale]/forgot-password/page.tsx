import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/ui';
import { ForgotPasswordForm } from './forgot-password-form';

export async function generateMetadata() {
  const t = await getTranslations('forgot');
  return { title: t('title') };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('forgot');
  return (
    <AuthShell title={t('title')}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
