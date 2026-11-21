import type { PlayerProfileResponse } from '@efp/contracts';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert, buttonClass, Card, PageContainer } from '@/components/ui';
import { Link, redirect } from '@/i18n/routing';
import { countryOptions } from '@/lib/countries';
import { getCurrentUser, serverGet } from '@/lib/session';
import { ProfileForm } from './profile-form';

export async function generateMetadata() {
  const t = await getTranslations('profileForm');
  return { title: t('titleEdit') };
}

export default async function ProfileEditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/login', locale });

  const res = await serverGet<PlayerProfileResponse>('/me/player-profile');
  const profile = res.ok ? res.data : null;
  const t = await getTranslations('profileForm');

  return (
    <PageContainer narrow>
      <h1 className="text-3xl font-bold">{profile ? t('titleEdit') : t('titleCreate')}</h1>
      {!profile && <p className="mt-2 text-ink-muted">{t('introCreate')}</p>}
      <div className="mt-6">
        {!profile && !user.emailVerified ? (
          <Alert
            tone="warning"
            action={
              <Link href="/account" className={buttonClass('secondary', 'sm')}>
                {t('toAccount')}
              </Link>
            }
          >
            {t('verifyEmailFirst')}
          </Alert>
        ) : (
          <Card>
            <ProfileForm profile={profile} countries={countryOptions(locale)} />
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
