import type { PlayerProfileResponse } from '@efp/contracts';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Avatar, ClanTag, Country, Crest, GameIdStatus, RoleBadge } from '@/components/identity';
import { buttonClass, Card, PageContainer } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { getCurrentUser, serverGetOr404 } from '@/lib/session';

type Params = { params: Promise<{ locale: string; username: string }> };

export async function generateMetadata({ params }: Params) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PlayerPage({ params }: Params) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const [player, user] = await Promise.all([
    serverGetOr404<PlayerProfileResponse>(`/players/${encodeURIComponent(username)}`),
    getCurrentUser(),
  ]);
  const [t, format] = await Promise.all([getTranslations('player'), getFormatter()]);
  const isMe = user?.username.toLowerCase() === player.username.toLowerCase();

  return (
    <PageContainer>
      {/* Player card: the profile as a matchday graphic */}
      <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-gradient-to-b from-surface-2 to-surface shadow-[var(--shadow-raise)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        />
        <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:items-center sm:gap-7 sm:p-8 sm:text-start">
          <Avatar url={player.avatarUrl} name={player.displayName} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold sm:text-4xl">{player.displayName}</h1>
            <p className="mt-1 text-ink-muted" dir="ltr">
              @{player.username}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:justify-start">
              <Country code={player.countryCode} locale={locale} />
              <span className="text-ink-muted">
                {t('joined', {
                  date: format.dateTime(new Date(player.createdAt), {
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </span>
            </div>
          </div>
          {isMe && (
            <Link href="/me/profile" className={buttonClass('secondary', 'sm')}>
              {t('edit')}
            </Link>
          )}
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">{t('gameId')}</h2>
          <p className="kit-tag text-2xl">{player.gameId}</p>
          <div className="mt-3">
            <GameIdStatus verified={player.gameIdVerified} />
          </div>
          {!player.gameIdVerified && (
            <p className="mt-3 text-xs text-ink-muted">{t('gameIdNotice')}</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">{t('clan')}</h2>
          {player.clan ? (
            <Link href={`/clans/${player.clan.tag}`} className="group flex items-center gap-4">
              <Crest
                logoUrl={player.clan.logoUrl}
                tag={player.clan.tag}
                name={player.clan.name}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold group-hover:text-accent">
                  {player.clan.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <ClanTag tag={player.clan.tag} className="text-xs" />
                  <RoleBadge role={player.clan.role} />
                </div>
              </div>
            </Link>
          ) : (
            <p className="text-ink-muted">{t('noClan')}</p>
          )}
        </Card>

        {player.bio && (
          <Card className="md:col-span-2">
            <h2 className="mb-2 text-sm font-semibold text-ink-muted">{t('bio')}</h2>
            <p className="whitespace-pre-line">{player.bio}</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
