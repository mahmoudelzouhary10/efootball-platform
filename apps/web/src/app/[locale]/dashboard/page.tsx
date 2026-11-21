import type { MyClanResponse, PlayerProfileResponse } from '@efp/contracts';
import { Clock3, Shield, UserRoundPlus } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Avatar, ClanTag, Country, Crest, GameIdStatus, RoleBadge } from '@/components/identity';
import { buttonClass, Card, Chip, EmptyState, PageContainer } from '@/components/ui';
import { Link, redirect } from '@/i18n/routing';
import { getCurrentUser, serverGet } from '@/lib/session';
import { ResendVerification } from '../account/account-actions';
import { ApplicationActions, InvitationActions, JoinRequestActions } from './dashboard-actions';

export async function generateMetadata() {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/login', locale });

  const profileRes = await serverGet<PlayerProfileResponse>('/me/player-profile');
  const profile = profileRes.ok ? profileRes.data : null;
  const clanRes = profile ? await serverGet<MyClanResponse>('/me/clan') : null;
  const myClan = clanRes?.ok ? clanRes.data : null;

  const [t, tp, tStatus, format] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('player'),
    getTranslations('statuses'),
    getFormatter(),
  ]);
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' });

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">
        {t('greeting', { name: profile?.displayName ?? user.username })}
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        {!user.emailVerified && <ResendVerification />}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Player profile */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('profileTitle')}</h2>
          {profile ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <Avatar url={profile.avatarUrl} name={profile.displayName} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold">
                    {profile.displayName}
                  </p>
                  <p className="text-sm text-ink-muted" dir="ltr">
                    @{profile.username}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">{tp('gameId')}</dt>
                  <dd className="mt-1 flex flex-col items-start gap-1.5">
                    <span className="kit-tag text-ink">{profile.gameId}</span>
                    <GameIdStatus verified={profile.gameIdVerified} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">{tp('country')}</dt>
                  <dd className="mt-1">
                    <Country code={profile.countryCode} locale={locale} />
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Link href="/me/profile" className={buttonClass('secondary', 'sm')}>
                  {tp('edit')}
                </Link>
                <Link href={`/players/${profile.username}`} className={buttonClass('ghost', 'sm')}>
                  {t('viewPublic')}
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<UserRoundPlus className="size-6" aria-hidden />}
              title={t('profileEmptyTitle')}
              description={t('profileEmptyBody')}
              action={
                user.emailVerified ? (
                  <Link href="/me/profile" className={buttonClass('primary')}>
                    {t('createProfile')}
                  </Link>
                ) : undefined
              }
            />
          )}
        </Card>

        {/* Clan */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('clanTitle')}</h2>
          {!profile ? (
            <p className="text-sm text-ink-muted">{t('needProfileForClan')}</p>
          ) : myClan?.membership ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Crest
                logoUrl={myClan.membership.clan.logoUrl}
                tag={myClan.membership.clan.tag}
                name={myClan.membership.clan.name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-semibold">{myClan.membership.clan.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <ClanTag tag={myClan.membership.clan.tag} className="text-sm" />
                  <RoleBadge role={myClan.membership.role} />
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  {t('memberSince', { date: date(myClan.membership.joinedAt) })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {myClan.membership.role !== 'member' && (
                    <Link
                      href={`/clans/${myClan.membership.clan.tag}/manage`}
                      className={buttonClass('primary', 'sm')}
                    >
                      {t('manageClan')}
                    </Link>
                  )}
                  <Link
                    href={`/clans/${myClan.membership.clan.tag}`}
                    className={buttonClass('secondary', 'sm')}
                  >
                    {t('viewClan')}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {myClan?.application &&
                myClan.application.status !== 'approved' &&
                myClan.application.status !== 'withdrawn' && (
                  <div className="rounded-[var(--radius-control)] border border-line bg-surface-2 p-4">
                    <div className="flex items-start gap-3">
                      <Crest
                        logoUrl={myClan.application.logoUrl}
                        tag={myClan.application.tag}
                        name={myClan.application.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{myClan.application.name}</p>
                          <Chip tone={myClan.application.status === 'pending' ? 'amber' : 'red'}>
                            {tStatus(myClan.application.status)}
                          </Chip>
                        </div>
                        <p className="mt-1 text-sm text-ink-muted">
                          {myClan.application.status === 'pending'
                            ? t('applicationPending')
                            : t('applicationRejected')}
                        </p>
                        {myClan.application.rejectionReason && (
                          <p className="mt-1 text-sm">
                            {t('rejectionReason', { reason: myClan.application.rejectionReason })}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-faint">
                          {t('submittedOn', { date: date(myClan.application.createdAt) })}
                        </p>
                        <ApplicationActions application={myClan.application} />
                      </div>
                    </div>
                  </div>
                )}

              {myClan && myClan.invitations.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-ink-muted">
                    {t('invitationsTitle')}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {myClan.invitations.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-accent/30 bg-accent/5 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Crest
                            logoUrl={inv.clan.logoUrl}
                            tag={inv.clan.tag}
                            name={inv.clan.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/clans/${inv.clan.tag}`}
                              className="font-semibold hover:text-accent"
                            >
                              {inv.clan.name}
                            </Link>
                            <p className="text-xs text-ink-muted">
                              {t('invitedBy', { name: inv.invitedBy.displayName })}
                            </p>
                            <p className="text-xs text-ink-faint">
                              {t('expires', { date: date(inv.expiresAt) })}
                            </p>
                          </div>
                        </div>
                        <InvitationActions invitationId={inv.id} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {myClan && myClan.joinRequests.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-ink-muted">
                    {t('requestsTitle')}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {myClan.joinRequests.map((req) => (
                      <li
                        key={req.id}
                        className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-line bg-surface-2 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Crest
                            logoUrl={req.clan.logoUrl}
                            tag={req.clan.tag}
                            name={req.clan.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold">{req.clan.name}</p>
                            <p className="flex items-center gap-1 text-xs text-ink-muted">
                              <Clock3 className="size-3.5" aria-hidden />
                              {t('requestedOn', { date: date(req.createdAt) })}
                            </p>
                          </div>
                        </div>
                        <JoinRequestActions requestId={req.id} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <EmptyState
                icon={<Shield className="size-6" aria-hidden />}
                title={t('noClanTitle')}
                description={t('noClanBody')}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/clans" className={buttonClass('primary')}>
                      {t('findClan')}
                    </Link>
                    {myClan?.application?.status !== 'pending' && (
                      <Link href="/clans/apply" className={buttonClass('secondary')}>
                        {t('foundClan')}
                      </Link>
                    )}
                  </div>
                }
              />
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
