import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui';
import { redirect } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/session';
import { ChangePasswordForm, ResendVerification, SessionActions } from './account-actions';

export async function generateMetadata() {
  const t = await getTranslations('account');
  return { title: t('title') };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/login', locale });

  const [t, format] = await Promise.all([getTranslations('account'), getFormatter()]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      {!user.emailVerified && <ResendVerification />}

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-muted">{t('username')}</dt>
            <dd className="mt-1 font-semibold" dir="ltr">
              {user.username}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">{t('email')}</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <span dir="ltr">{user.email}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  user.emailVerified ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                }`}
              >
                {user.emailVerified ? t('verified') : t('notVerified')}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">{t('memberSince')}</dt>
            <dd className="mt-1">
              {format.dateTime(new Date(user.createdAt), { dateStyle: 'long' })}
            </dd>
          </div>
          {user.roles.length > 0 && (
            <div>
              <dt className="text-xs text-ink-muted">{t('roles')}</dt>
              <dd className="mt-1">{user.roles.join('، ')}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">{t('changePassword')}</h2>
        <ChangePasswordForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">{t('sessions')}</h2>
        <SessionActions />
      </Card>
    </div>
  );
}
