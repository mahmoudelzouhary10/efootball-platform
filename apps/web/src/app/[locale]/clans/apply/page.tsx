import type { MyClanResponse, PlayerProfileResponse } from '@efp/contracts';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert, buttonClass, PageContainer } from '@/components/ui';
import { Link, redirect } from '@/i18n/routing';
import { getCurrentUser, serverGet } from '@/lib/session';
import { ApplyForm } from './apply-form';

export async function generateMetadata() {
  const t = await getTranslations('apply');
  return { title: t('title') };
}

export default async function ApplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/login', locale });

  const t = await getTranslations('apply');
  const profile = await serverGet<PlayerProfileResponse>('/me/player-profile');
  const myClan = profile.ok ? await serverGet<MyClanResponse>('/me/clan') : null;

  let blocker: { title: string; body: string; href: '/me/profile' | '/dashboard' } | null = null;
  if (!profile.ok) blocker = { title: t('profileRequired'), body: '', href: '/me/profile' };
  else if (myClan?.ok && myClan.data.membership)
    blocker = { title: t('inClanTitle'), body: t('inClanBody'), href: '/dashboard' };
  else if (myClan?.ok && myClan.data.application?.status === 'pending')
    blocker = { title: t('pendingTitle'), body: t('pendingBody'), href: '/dashboard' };

  return (
    <PageContainer>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-ink-muted">{t('intro')}</p>
      </div>
      <div className="mt-8">
        {blocker ? (
          <div className="max-w-2xl">
            <Alert
              tone="info"
              action={
                <Link href={blocker.href} className={buttonClass('secondary', 'sm')}>
                  {t('toDashboard')}
                </Link>
              }
            >
              <p className="font-semibold">{blocker.title}</p>
              {blocker.body && <p className="mt-1 text-ink-muted">{blocker.body}</p>}
            </Alert>
          </div>
        ) : (
          <ApplyForm />
        )}
      </div>
    </PageContainer>
  );
}
