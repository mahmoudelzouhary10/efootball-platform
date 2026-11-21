import type { ClanCardResponse, Page } from '@efp/contracts';
import { Shield, Swords, UserRound } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ClanTag, Crest } from '@/components/identity';
import { buttonClass, EmptyState } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { getCurrentUser, serverGet } from '@/lib/session';

/** Top-down pitch markings under the floodlights: the hero's backdrop. */
function PitchLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full opacity-[0.09]"
    >
      <g fill="none" stroke="#f2f4f8" strokeWidth="2">
        <rect x="40" y="40" width="1120" height="520" />
        <line x1="600" y1="40" x2="600" y2="560" />
        <circle cx="600" cy="300" r="90" />
        <rect x="40" y="170" width="150" height="260" />
        <rect x="1010" y="170" width="150" height="260" />
        <rect x="40" y="235" width="55" height="130" />
        <rect x="1105" y="235" width="55" height="130" />
      </g>
    </svg>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, user, clans] = await Promise.all([
    getTranslations('home'),
    getCurrentUser(),
    serverGet<Page<ClanCardResponse>>('/clans?limit=6'),
  ]);
  const tClans = await getTranslations('clans');
  const clanList = clans.ok ? clans.data.items : [];

  const steps = [
    { icon: UserRound, title: t('step1Title'), body: t('step1Body') },
    { icon: Shield, title: t('step2Title'), body: t('step2Body') },
    { icon: Swords, title: t('step3Title'), body: t('step3Body') },
  ];

  return (
    <div className="pb-28 md:pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/60">
        <PitchLines />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-28">
          <div>
            <h1 className="max-w-3xl text-[2.15rem] font-bold leading-[1.15] sm:text-5xl lg:text-[3.6rem]">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">{t('subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link href="/dashboard" className={buttonClass('primary', 'lg')}>
                  {t('ctaDashboard')}
                </Link>
              ) : (
                <>
                  <Link href="/register" className={buttonClass('primary', 'lg')}>
                    {t('ctaRegister')}
                  </Link>
                  <Link href="/login" className={buttonClass('secondary', 'lg')}>
                    {t('ctaLogin')}
                  </Link>
                </>
              )}
              <Link href="/clans" className={buttonClass('ghost', 'lg')}>
                {t('browseClans')}
              </Link>
            </div>
          </div>
          {/* Signature moment: real clan crests lined up like a wall of club badges. */}
          {clanList.length >= 3 && (
            <div aria-hidden className="hidden items-end justify-center gap-4 lg:flex">
              {clanList.slice(0, 3).map((clan, i) => (
                <div
                  key={clan.id}
                  className="animate-[var(--animate-rise)]"
                  style={{
                    animationDelay: `${i * 120}ms`,
                    transform: i === 1 ? 'translateY(-28px)' : undefined,
                  }}
                >
                  <Crest
                    logoUrl={clan.logoUrl}
                    tag={clan.tag}
                    name={clan.name}
                    size={i === 1 ? 'xl' : 'lg'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Clans on the platform (real data) */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">{t('clansTitle')}</h2>
          {clanList.length > 0 && (
            <Link href="/clans" className="text-sm text-accent hover:underline">
              {t('clansAll')}
            </Link>
          )}
        </div>
        {clanList.length === 0 ? (
          <EmptyState
            icon={<Shield className="size-6" aria-hidden />}
            title={t('clansEmptyTitle')}
            description={t('clansEmptyBody')}
            action={
              <Link href="/clans/apply" className={buttonClass('secondary')}>
                {t('clansEmptyCta')}
              </Link>
            }
          />
        ) : (
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {clanList.map((clan) => (
              <li key={clan.id} className="w-36 shrink-0 snap-start sm:w-auto">
                <Link
                  href={`/clans/${clan.tag}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-center transition hover:border-accent/50"
                >
                  <Crest logoUrl={clan.logoUrl} tag={clan.tag} name={clan.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold group-hover:text-accent">
                      {clan.name}
                    </p>
                    <ClanTag tag={clan.tag} className="text-xs" />
                  </div>
                  <p className="text-xs text-ink-muted">
                    {tClans('members', { count: clan.memberCount })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The path: a real sequence, so it's numbered. */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="mb-6 text-2xl font-bold">{t('stepsTitle')}</h2>
        <ol className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 bg-surface p-5 sm:flex-col sm:p-6">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-bold text-accent/70 tabular">
                  {i + 1}
                </span>
                <step.icon className="size-5 text-ink-muted" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
