import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/ui';
import { redirect } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/session';
import { LoginForm } from './login-form';

export async function generateMetadata() {
  const t = await getTranslations('login');
  return { title: t('title') };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getCurrentUser()) redirect({ href: '/account', locale });
  const t = await getTranslations('login');
  return (
    <AuthShell title={t('title')}>
      <LoginForm />
    </AuthShell>
  );
}
