import type {
  ClanDetailResponse,
  ClanInvitationResponse,
  ClanJoinRequestResponse,
  MyClanResponse,
} from '@efp/contracts';
import { Inbox, MailOpen } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Avatar, ClanTag, Crest, flagEmoji, RoleBadge } from '@/components/identity';
import { Alert, buttonClass, Card, cx, EmptyState, PageContainer } from '@/components/ui';
import { Link, redirect } from '@/i18n/routing';
import { getCurrentUser, serverGet, serverGetOr404 } from '@/lib/session';
import {
  ClanSettingsForm,
  InvitationRowActions,
  InviteForm,
  MemberActions,
  RequestRowActions,
} from './manage-actions';

const TABS = ['members', 'requests', 'invitations', 'settings'] as const;
type Tab = (typeof TABS)[number];

type Props = {
  params: Promise<{ locale: string; tag: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations('manage');
  return { title: t('title') };
}

export default async function ManageClanPage({ params, searchParams }: Props) {
  const [{ locale, tag }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/login', locale });

  const clan = await serverGetOr404<ClanDetailResponse>(`/clans/${encodeURIComponent(tag)}`);
  const [mine, pending, t, format] = await Promise.all([
    serverGet<MyClanResponse>('/me/clan'),
    serverGet<{ invitations: ClanInvitationResponse[]; joinRequests: ClanJoinRequestResponse[] }>(
      `/clans/${encodeURIComponent(clan.tag)}/pending`,
    ),
    getTranslations('manage'),
    getFormatter(),
  ]);
  const role =
    mine.ok && mine.data.membership?.clan.id === clan.id ? mine.data.membership.role : null;

  if (!pending.ok || !role || role === 'member') {
    return (
      <PageContainer narrow>
        <Alert tone="warning">{t('notAllowed')}</Alert>
      </PageContainer>
    );
  }

  const isLeader = role === 'leader';
  const visibleTabs = TABS.filter((x) => x !== 'settings' || isLeader);
  const tab: Tab = visibleTabs.includes(rawTab as Tab) ? (rawTab as Tab) : 'members';
  const counts: Partial<Record<Tab, number>> = {
    members: clan.memberCount,
    requests: pending.data.joinRequests.length,
    invitations: pending.data.invitations.length,
  };
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' });

  return (
    <PageContainer>
      <div className="flex items-center gap-4">
        <Crest logoUrl={clan.logoUrl} tag={clan.tag} name={clan.name} size="md" />
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{t('title')}</p>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">
            <Link href={`/clans/${clan.tag}`} className="hover:text-accent">
              {clan.name}
            </Link>
          </h1>
          <ClanTag tag={clan.tag} className="text-xs" />
        </div>
      </div>

      {/* Tabs: links, so each view is addressable and works without JavaScript. */}
      <nav
        aria-label={t('title')}
        className="-mx-4 mt-6 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0"
      >
        <ul className="flex gap-1">
          {visibleTabs.map((x) => (
            <li key={x}>
              <Link
                href={`/clans/${clan.tag}/manage?tab=${x}`}
                aria-current={tab === x ? 'page' : undefined}
                className={cx(
                  'relative flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm transition',
                  tab === x ? 'text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {t(x)}
                {counts[x] !== undefined && counts[x]! > 0 && (
                  <span
                    className={cx(
                      'rounded-full px-1.5 text-xs tabular',
                      x === 'requests'
                        ? 'bg-accent text-accent-ink'
                        : 'bg-surface-3 text-ink-muted',
                    )}
                  >
                    {counts[x]}
                  </span>
                )}
                {tab === x && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        {tab === 'members' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start">
            <Card>
              <p className="mb-3 text-sm text-ink-muted tabular">
                {t('capacity', { count: clan.memberCount, max: clan.maxMembers })}
              </p>
              <ul className="-mx-2 flex flex-col divide-y divide-line/60">
                {clan.members.map((m) => {
                  const isSelf = m.username.toLowerCase() === user.username.toLowerCase();
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-2 py-3">
                      <Avatar url={m.avatarUrl} name={m.displayName} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium">
                          <span className="truncate">{m.displayName}</span>
                          <span aria-hidden>{flagEmoji(m.countryCode)}</span>
                        </p>
                        <p className="truncate text-xs text-ink-muted" dir="ltr">
                          @{m.username}
                        </p>
                      </div>
                      <RoleBadge role={m.role} />
                      {!isSelf && (
                        <MemberActions
                          tag={clan.tag}
                          member={{
                            username: m.username,
                            displayName: m.displayName,
                            role: m.role,
                          }}
                          actorRole={role}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">{t('inviteTitle')}</h2>
              <InviteForm tag={clan.tag} />
            </Card>
          </div>
        )}

        {tab === 'requests' &&
          (pending.data.joinRequests.length === 0 ? (
            <EmptyState icon={<Inbox className="size-6" aria-hidden />} title={t('noRequests')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.data.joinRequests.map((r) => (
                <li key={r.id}>
                  <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <Link
                      href={`/players/${r.player.username}`}
                      className="flex min-w-0 flex-1 items-start gap-3"
                    >
                      <Avatar url={r.player.avatarUrl} name={r.player.displayName} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {r.player.displayName}{' '}
                          <span aria-hidden>{flagEmoji(r.player.countryCode)}</span>
                        </p>
                        <p className="text-xs text-ink-muted" dir="ltr">
                          @{r.player.username}
                        </p>
                        {r.message && (
                          <p className="mt-2 rounded-[var(--radius-control)] bg-surface-2 px-3 py-2 text-sm">
                            {r.message}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-ink-faint">{date(r.createdAt)}</p>
                      </div>
                    </Link>
                    <RequestRowActions requestId={r.id} />
                  </Card>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'invitations' &&
          (pending.data.invitations.length === 0 ? (
            <EmptyState
              icon={<MailOpen className="size-6" aria-hidden />}
              title={t('noInvitations')}
              action={
                <Link
                  href={`/clans/${clan.tag}/manage?tab=members`}
                  className={buttonClass('secondary')}
                >
                  {t('inviteTitle')}
                </Link>
              }
            />
          ) : (
            <Card>
              <ul className="-mx-2 flex flex-col divide-y divide-line/60">
                {pending.data.invitations.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center gap-3 px-2 py-3">
                    <Avatar url={inv.player.avatarUrl} name={inv.player.displayName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{inv.player.displayName}</p>
                      <p className="text-xs text-ink-muted">
                        {t('expires', { date: date(inv.expiresAt) })}
                      </p>
                    </div>
                    <InvitationRowActions invitationId={inv.id} />
                  </li>
                ))}
              </ul>
            </Card>
          ))}

        {tab === 'settings' && isLeader && (
          <Card className="max-w-2xl">
            <h2 className="mb-1 font-semibold">{t('settingsTitle')}</h2>
            <p className="mb-5 text-sm text-ink-muted">{t('nameLocked')}</p>
            <ClanSettingsForm
              tag={clan.tag}
              initial={{
                logoUrl: clan.logoUrl,
                description: clan.description,
                contactUrl: clan.contactUrl,
              }}
            />
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
