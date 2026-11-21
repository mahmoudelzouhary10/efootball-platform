import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/ui';
import { redirect } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/session';
import { RegisterForm } from './register-form';

export async function generateMetadata() {
  const t = await getTranslations('register');
  return { title: t('title') };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getCurrentUser()) redirect({ href: '/dashboard', locale });
  const t = await getTranslations('register');
  return (
    <AuthShell title={t('title')}>
      <RegisterForm />
    </AuthShell>
  );
}
