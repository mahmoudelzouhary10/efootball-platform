import type { ClanDetailResponse, MyClanResponse, PlayerProfileResponse } from '@efp/contracts';
import { CalendarDays, ExternalLink, Users } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { cache } from 'react';
import {
  Avatar,
  ClanTag,
  Crest,
  flagEmoji,
  countryName,
  GameIdStatus,
  RoleBadge,
} from '@/components/identity';
import { buttonClass, Card, PageContainer } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getCurrentUser, serverGet } from '@/lib/session';
import { JoinPanel, type Viewer } from './join-panel';

type Params = { params: Promise<{ locale: string; tag: string }> };

/** One API call per request, shared by generateMetadata and the page. */
const getClan = cache((tag: string) =>
  serverGet<ClanDetailResponse>(`/clans/${encodeURIComponent(tag)}`),
);

export async function generateMetadata({ params }: Params) {
  const { tag } = await params;
  const res = await getClan(tag);
  return { title: res.ok ? `${res.data.name} [${res.data.tag}]` : tag };
}

export default async function ClanPage({ params }: Params) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const [clanRes, user] = await Promise.all([getClan(tag), getCurrentUser()]);
  if (!clanRes.ok) notFound();
  const clan = clanRes.data;
  const [t, format] = await Promise.all([getTranslations('clans'), getFormatter()]);

  // Work out what the viewer can do here; the API re-checks every action.
  let viewer: Viewer = { kind: 'anonymous' };
  if (user) {
    const profile = await serverGet<PlayerProfileResponse>('/me/player-profile');
    if (!profile.ok) viewer = { kind: 'no-profile' };
    else {
      const mine = await serverGet<MyClanResponse>('/me/clan');
      const m = mine.ok ? mine.data : null;
      if (m?.membership?.clan.id === clan.id) viewer = { kind: 'member', role: m.membership.role };
      else if (m?.membership) viewer = { kind: 'other-clan' };
      else {
        const pending = m?.joinRequests.find((r) => r.clan.id === clan.id);
        viewer = pending ? { kind: 'requested', requestId: pending.id } : { kind: 'can-request' };
      }
    }
  }
  const full = clan.memberCount >= clan.maxMembers;

  return (
    <PageContainer>
      {/* Crest hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-gradient-to-b from-surface-2 to-surface shadow-[var(--shadow-raise)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        />
        <div className="flex flex-col items-center gap-6 p-6 text-center sm:p-10 md:flex-row md:items-center md:text-start">
          <Crest logoUrl={clan.logoUrl} tag={clan.tag} name={clan.name} size="xl" priority />
          <div className="min-w-0 flex-1">
            <ClanTag tag={clan.tag} className="text-base" />
            <h1 className="mt-1 text-3xl font-bold sm:text-5xl">{clan.name}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted md:justify-start">
              <span className="flex items-center gap-1.5">
                <Users className="size-4" aria-hidden />
                <span className="tabular">
                  {t('capacity', { count: clan.memberCount, max: clan.maxMembers })}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden />
                {t('founded', {
                  date: format.dateTime(new Date(clan.createdAt), {
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-56">
            <JoinPanel tag={clan.tag} viewer={viewer} full={full} />
            <a
              href={clan.contactUrl}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className={buttonClass('ghost', 'md')}
            >
              <ExternalLink className="size-4" aria-hidden />
              {t('contact')}
            </a>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <Card className="self-start">
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">{t('about')}</h2>
          <p className="whitespace-pre-line leading-relaxed">{clan.description}</p>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center justify-between text-lg font-semibold">
            {t('roster')}
            <span className="text-sm font-normal text-ink-muted tabular">{clan.memberCount}</span>
          </h2>
          <ul className="-mx-2 flex flex-col">
            {clan.members.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/players/${m.username}`}
                  className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-2.5 hover:bg-surface-2"
                >
                  <Avatar url={m.avatarUrl} name={m.displayName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      <span className="truncate">{m.displayName}</span>
                      <span
                        title={countryName(m.countryCode, locale)}
                        aria-label={countryName(m.countryCode, locale)}
                      >
                        {flagEmoji(m.countryCode)}
                      </span>
                    </p>
                    <p className="truncate text-xs text-ink-muted" dir="ltr">
                      @{m.username}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <RoleBadge role={m.role} />
                    {/* Unverified is the default, so only a verified ID is worth marking here. */}
                    {m.gameIdVerified && (
                      <span className="hidden sm:inline">
                        <GameIdStatus verified />
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
