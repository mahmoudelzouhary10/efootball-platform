import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/ui';
import { VerifyEmail } from './verify-email';

export async function generateMetadata() {
  const t = await getTranslations('verify');
  return { title: t('title') };
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ locale }, { token }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('verify');
  return (
    <AuthShell title={t('title')}>
      <VerifyEmail token={typeof token === 'string' ? token : null} />
    </AuthShell>
  );
}
