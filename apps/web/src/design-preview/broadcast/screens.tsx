/* DESIGN PREVIEW ONLY — Concept A: Matchday Broadcast. */
import { Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Gauge, Home, LayoutGrid, Shield, Trophy, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { C, countryName, flag, fmtDate, fmtNum } from '../copy';
import { ACHIEVEMENTS, ADMIN, CLANS, clan, LIVE_GAMES, type Lang, MATCHES, ME, type PClan, ROSTER, TOURNAMENT, winRate } from '../data';
import { Emblem, initials } from '../emblem';

type P = { lang: Lang };
const t = <T extends { ar: string; en: string }>(n: T, lang: Lang) => n[lang];

// ── chrome ──────────────────────────────────────────────────────────────────

function Ticker({ lang }: P) {
  const items = MATCHES.filter((m) => m.status !== 'scheduled').concat(MATCHES.filter((m) => m.status !== 'scheduled'));
  return (
    <div className="flex h-9 items-stretch overflow-hidden bg-[var(--bc-deep)] text-[13px]">
      <div className="bc-skew z-10 -ms-2 flex shrink-0 items-center bg-[var(--bc-red)] px-5">
        <span className="bc-unskew bc-cond flex items-center gap-2 font-bold uppercase tracking-wide">
          <span className="bc-pulse size-2 rounded-full bg-white" />
          {t(C.live, lang)}
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="bc-ticker-track flex w-max items-center gap-8 px-6 py-2 whitespace-nowrap">
          {items.map((m, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="bc-num font-semibold">{m.home}</span>
              <span className="rounded-sm bg-white px-1.5 font-bold text-[var(--bc-ink)]">{m.games && <Score v={m.games} />}</span>
              <span className="bc-num font-semibold">{m.away}</span>
              <span className={m.status === 'live' ? 'text-[var(--bc-red)]' : 'text-[var(--bc-mute)]'}>
                {m.status === 'live' ? m.minute : t(C.finished, lang)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { key: 'home', icon: Home },
  { key: 'competitions', icon: Trophy },
  { key: 'clans', icon: Shield },
  { key: 'dashboard', icon: LayoutGrid },
  { key: 'admin', icon: Gauge },
] as const;

export function BroadcastShell({ lang, active, children }: P & { active: (typeof NAV)[number]['key']; children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <Ticker lang={lang} />
      <header className="sticky top-0 z-30 border-b border-[var(--bc-line)] bg-[var(--bc-night)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <div className="bc-skew flex items-center bg-white px-4 py-1.5">
            <span className="bc-unskew bc-display text-xl text-[var(--bc-ink)]">
              {t(C.brand, lang)}
              <span className="text-[var(--bc-red)]">.</span>
            </span>
          </div>
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.key}
                className={`bc-cond relative px-3 py-2 text-[15px] font-semibold uppercase tracking-wide ${active === n.key ? 'text-white' : 'text-[var(--bc-mute)] hover:text-white'}`}
              >
                {t(C.nav[n.key], lang)}
                {active === n.key && <span className="bc-skew absolute inset-x-2 -bottom-[17px] h-1 bg-[var(--bc-red)]" />}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <span className="hidden text-sm text-[var(--bc-mute)] sm:inline">{lang === 'ar' ? 'English' : 'العربية'}</span>
            <span className="grid size-9 place-items-center rounded-full bg-[var(--bc-red)] text-sm font-bold">{initials(ME.name[lang])}</span>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--bc-line)] bg-[var(--bc-deep)] md:hidden">
        {NAV.map((n) => (
          <a key={n.key} className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] ${active === n.key ? 'text-white' : 'text-[var(--bc-mute)]'}`}>
            <span className={`grid size-7 place-items-center ${active === n.key ? 'bc-skew bg-[var(--bc-red)]' : ''}`}>
              <n.icon className={`size-4 ${active === n.key ? 'bc-unskew' : ''}`} />
            </span>
            {t(C.nav[n.key], lang)}
          </a>
        ))}
      </nav>
    </div>
  );
}

/** Broadcast section header: a red slanted tab with the title. */
function Tab({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-white/10">
      <div className="bc-skew -mb-0.5 bg-[var(--bc-red)] px-5 py-1.5">
        <h2 className="bc-unskew bc-display text-xl uppercase sm:text-2xl">{children}</h2>
      </div>
      {aside}
    </div>
  );
}

function ClanCode({ tag, size = 'md' }: { tag: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = clan(tag);
  const box = size === 'lg' ? 'size-20 sm:size-28' : size === 'sm' ? 'size-7' : 'size-10';
  return <Emblem kind={c.emblem} colors={c.colors} shape="shield" className={box} title={c.name.en} />;
}

/** The scorebug: the single most recognisable broadcast element. */
function Scorebug({ lang, home, away, games, status, minute, big }: P & { home: string; away: string; games?: [number, number]; status: string; minute?: string; big?: boolean }) {
  const h = clan(home);
  const a = away === 'TBD' ? null : clan(away);
  const name = big ? 'text-2xl sm:text-4xl' : 'text-lg';
  return (
    <div className="flex items-stretch overflow-hidden">
      <div className="flex flex-1 items-center justify-end gap-3 px-3 py-3 sm:px-5" style={{ background: `linear-gradient(${lang === 'ar' ? '270deg' : '90deg'}, transparent, ${h.colors[0]})` }}>
        <span className={`bc-display truncate ${name}`}>{h.name[lang]}</span>
        <ClanCode tag={home} size={big ? 'md' : 'sm'} />
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center bg-white px-3 text-[var(--bc-ink)] sm:px-5">
        <span className={`font-extrabold ${big ? 'text-4xl sm:text-6xl' : 'text-2xl'}`}>
          {games ? (
            <Score v={games} />
          ) : (
            <span className="bc-num">{fmtDate(MATCHES.find((m) => m.home === home && m.away === away)?.time ?? '', lang, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          )}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-3 px-3 py-3 sm:px-5" style={{ background: a ? `linear-gradient(${lang === 'ar' ? '90deg' : '270deg'}, transparent, ${a.colors[0]})` : undefined }}>
        {a ? <ClanCode tag={away} size={big ? 'md' : 'sm'} /> : <span className="grid size-7 place-items-center border border-dashed border-white/40 text-xs">?</span>}
        <span className={`bc-display truncate ${name}`}>{a ? a.name[lang] : t(C.tour.tbd, lang)}</span>
      </div>
      <div className={`flex shrink-0 items-center px-3 ${status === 'live' ? 'bg-[var(--bc-red)]' : 'bg-[var(--bc-panel)]'}`}>
        <span className="bc-num text-sm font-bold">{status === 'live' ? minute : status === 'finished' ? 'FT' : '—'}</span>
      </div>
    </div>
  );
}

function FormDots({ form }: { form: PClan['form'] }) {
  const color = { W: 'bg-[#19c37d]', D: 'bg-[#f5b301]', L: 'bg-[var(--bc-red)]' };
  return (
    <span className="flex gap-1">
      {form.map((f, i) => (
        <span key={i} className={`bc-num grid size-5 place-items-center text-[10px] font-bold text-[var(--bc-ink)] ${color[f]}`}>
          {f}
        </span>
      ))}
    </span>
  );
}

const pts = (c: PClan) => c.record.w * 3 + c.record.d;

/**
 * Score that follows reading direction: each number sits next to its own team, so in RTL the
 * home score is on the right. (A forced-LTR "3–2" would put the home score beside the away team.)
 */
function Score({ v }: { v: [number, number] }) {
  return (
    <span className="inline-flex items-center gap-[0.15em]">
      <span className="bc-num">{v[0]}</span>
      <span className="bc-num opacity-60">–</span>
      <span className="bc-num">{v[1]}</span>
    </span>
  );
}

// ── 1. Home ─────────────────────────────────────────────────────────────────

export function BroadcastHome({ lang }: P) {
  const live = MATCHES[0]!;
  const table = [...CLANS].sort((a, b) => pts(b) - pts(a));
  return (
    <BroadcastShell lang={lang} active="home">
      <section className="bc-stripes bc-glow relative overflow-hidden border-b border-[var(--bc-line)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:py-16">
          <div>
            <div className="bc-skew mb-5 inline-block bg-white/10 px-3 py-1">
              <span className="bc-unskew bc-cond block text-sm font-semibold uppercase tracking-wider text-[var(--bc-sky)]">{t(C.home.kicker, lang)}</span>
            </div>
            <h1 className={`bc-display uppercase ${lang === 'ar' ? 'text-[2.3rem] sm:text-5xl lg:text-[3.4rem]' : 'text-[2.6rem] sm:text-6xl lg:text-7xl'}`}>{t(C.home.title, lang)}</h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--bc-mute)]">{t(C.home.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="bc-skew bg-[var(--bc-red)] px-7 py-3 hover:bg-[var(--bc-red-deep)]">
                <span className="bc-unskew bc-cond block text-lg font-bold uppercase">{t(C.home.ctaJoin, lang)}</span>
              </a>
              <a className="bc-skew bg-white px-7 py-3 text-[var(--bc-ink)]">
                <span className="bc-unskew bc-cond block text-lg font-bold uppercase">{t(C.home.ctaWatch, lang)}</span>
              </a>
            </div>
            <dl className="mt-10 flex gap-8">
              {[
                [126, C.home.stats.clans],
                [3967, C.home.stats.players],
                [1284, C.home.stats.matches],
              ].map(([n, label], i) => (
                <div key={i}>
                  <dd className="bc-num text-4xl font-extrabold">{fmtNum(n as number, lang)}</dd>
                  <dt className="text-sm text-[var(--bc-mute)]">{t(label as { ar: string; en: string }, lang)}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Match centre: the live semi-final as a broadcast graphic */}
          <div className="relative">
            <div className="bc-skew absolute -top-3 start-6 z-10 bg-[var(--bc-red)] px-3 py-1">
              <span className="bc-unskew bc-cond flex items-center gap-2 text-sm font-bold uppercase">
                <span className="bc-pulse size-2 rounded-full bg-white" />
                {t(C.home.liveNow, lang)}
              </span>
            </div>
            <div className="overflow-hidden bg-[var(--bc-deep)] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
              <div className="px-5 pt-7 pb-2 text-sm text-[var(--bc-mute)]">
                {t(TOURNAMENT.name, lang)} · {t(live.round, lang)}
              </div>
              <Scorebug lang={lang} home={live.home} away={live.away} games={live.games} status="live" minute={live.minute} big />
              <ol className="divide-y divide-white/5">
                {LIVE_GAMES.map((g, i) => (
                  <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="truncate text-end">{ROSTER.find((r) => r.username === g.home)?.name[lang]}</span>
                    <span className={`min-w-14 text-center font-bold ${g.state === 'live' ? 'bg-[var(--bc-red)]' : 'bg-white/10'} px-2 py-0.5`}>
                      {g.score ? <Score v={g.score} /> : '—'}
                    </span>
                    <span className="truncate text-[var(--bc-mute)]">@{g.away}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <Tab aside={<span className="pb-2 text-sm text-[var(--bc-mute)]">{t(C.clan.pts, lang)}</span>}>{t(C.home.topClans, lang)}</Tab>
          <ol className="flex flex-col gap-1.5">
            {table.slice(0, 6).map((c, i) => (
              <li key={c.tag} className="grid grid-cols-[2.5rem_auto_1fr_auto_auto] items-center gap-3 bg-[var(--bc-deep)] pe-4" style={{ boxShadow: `inset ${lang === 'ar' ? '-' : ''}4px 0 0 ${c.colors[0]}` }}>
                <span className={`bc-num grid h-12 place-items-center text-xl font-extrabold ${i === 0 ? 'bg-white text-[var(--bc-ink)]' : 'text-[var(--bc-mute)]'}`}>{i + 1}</span>
                <ClanCode tag={c.tag} size="sm" />
                <span className="min-w-0">
                  <span className="bc-cond block truncate text-lg font-bold">{c.name[lang]}</span>
                </span>
                <span className="hidden sm:block">
                  <FormDots form={c.form} />
                </span>
                <span className="bc-num w-10 text-end text-2xl font-extrabold">{pts(c)}</span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <Tab>{t(C.home.upcoming, lang)}</Tab>
          <div className="flex flex-col gap-3">
            {MATCHES.filter((m) => m.status === 'scheduled').map((m) => (
              <div key={m.id} className="bg-[var(--bc-deep)]">
                <div className="flex items-center justify-between px-4 pt-3 text-xs text-[var(--bc-mute)]">
                  <span>{t(m.round, lang)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {fmtDate(m.time, lang, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="pt-2">
                  <Scorebug lang={lang} home={m.home} away={m.away} status="scheduled" />
                </div>
              </div>
            ))}
            <div className="bc-stripes mt-2 flex items-center gap-4 bg-white p-4 text-[var(--bc-ink)]">
              <Trophy className="size-10 shrink-0 text-[var(--bc-red)]" />
              <div className="min-w-0">
                <p className="bc-display text-xl">{t(TOURNAMENT.name, lang)}</p>
                <p className="text-sm text-[#44507a]">
                  {t(TOURNAMENT.season, lang)} · {t(TOURNAMENT.dates, lang)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BroadcastShell>
  );
}

// ── 2. Player dashboard ─────────────────────────────────────────────────────

export function BroadcastDashboard({ lang }: P) {
  const s = ME.stats;
  const my = clan('NILE');
  const next = MATCHES.find((m) => m.id === 'l1')!;
  return (
    <BroadcastShell lang={lang} active="dashboard">
      {/* Lower-third identity graphic */}
      <section className="bc-stripes border-b border-[var(--bc-line)]" style={{ background: `linear-gradient(${lang === 'ar' ? '270deg' : '90deg'}, ${my.colors[0]}55, transparent 70%)` }}>
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="mb-3 text-[var(--bc-mute)]">{t(C.dash.hello, lang)}</p>
          <div className="flex flex-wrap items-end gap-5">
            <div className="grid size-24 shrink-0 place-items-center bg-white text-3xl font-extrabold text-[var(--bc-ink)] sm:size-28">
              <span className="bc-display">{initials(ME.name[lang])}</span>
            </div>
            <div className="min-w-0">
              <div className="bc-skew inline-block bg-[var(--bc-red)] px-3 py-0.5">
                <span className="bc-unskew bc-num block font-bold">{ME.position}</span>
              </div>
              <h1 className="bc-display mt-1 text-5xl uppercase sm:text-6xl">{ME.name[lang]}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[var(--bc-mute)]">
                <span>
                  {flag(ME.country)} {countryName(ME.country, lang)}
                </span>
                <span className="flex items-center gap-2">
                  <ClanCode tag="NILE" size="sm" /> {my.name[lang]} · {t(C.clan.roles.co_leader, lang)}
                </span>
                <span className="flex items-center gap-2">
                  {t(C.dash.gameId, lang)} <span className="bc-num font-semibold text-white">{ME.gameId}</span>
                  <span className="border border-white/30 px-1.5 text-xs">{t(C.dash.unverified, lang)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-10">
          <section>
            <Tab>{t(C.dash.record, lang)}</Tab>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {[
                [s.matches, C.dash.matches],
                [`${winRate(s)}%`, C.dash.winRate],
                [s.goals, C.dash.goals],
                [s.conceded, C.dash.conceded],
              ].map(([v, l], i) => (
                <div key={i} className={`p-4 ${i === 1 ? 'bg-white text-[var(--bc-ink)]' : 'bg-[var(--bc-deep)]'}`}>
                  <div className="bc-num text-4xl font-extrabold">{v as string}</div>
                  <div className={`text-sm ${i === 1 ? 'text-[#44507a]' : 'text-[var(--bc-mute)]'}`}>{t(l as { ar: string; en: string }, lang)}</div>
                </div>
              ))}
            </div>
            {/* W/D/L bar like a possession graphic */}
            <div className="mt-3 flex h-8 overflow-hidden text-xs font-bold">
              <div className="bc-num flex items-center bg-[#19c37d] px-2 text-[var(--bc-ink)]" style={{ width: `${(s.wins / s.matches) * 100}%` }}>{s.wins}W</div>
              <div className="bc-num flex items-center bg-[#f5b301] px-2 text-[var(--bc-ink)]" style={{ width: `${(s.draws / s.matches) * 100}%` }}>{s.draws}</div>
              <div className="bc-num flex flex-1 items-center justify-end bg-[var(--bc-red)] px-2">{s.losses}L</div>
            </div>
          </section>

          <section>
            <Tab>{t(C.dash.recent, lang)}</Tab>
            <div className="flex flex-col gap-1.5">
              {MATCHES.filter((m) => m.status !== 'scheduled' && (m.home === 'NILE' || m.away === 'NILE')).map((m) => (
                <div key={m.id} className="bg-[var(--bc-deep)]">
                  <Scorebug lang={lang} home={m.home} away={m.away} games={m.games} status={m.status} minute={m.minute} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-10">
          <section>
            <Tab>{t(C.dash.nextMatch, lang)}</Tab>
            <div className="bg-white text-[var(--bc-ink)]">
              <div className="flex items-center justify-between px-4 pt-3 text-sm text-[#44507a]">
                <span>{t(next.round, lang)}</span>
                <span className="bc-num font-semibold">{fmtDate(next.time, lang, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center justify-around px-4 py-5">
                <div className="flex flex-col items-center gap-2"><ClanCode tag={next.home} /><span className="bc-display">{clan(next.home).name[lang]}</span></div>
                <span className="bc-display text-3xl text-[var(--bc-red)]">{t(C.vs, lang)}</span>
                <div className="flex flex-col items-center gap-2"><ClanCode tag={next.away} /><span className="bc-display">{clan(next.away).name[lang]}</span></div>
              </div>
              <a className="bc-cond block bg-[var(--bc-ink)] py-3 text-center text-lg font-bold uppercase text-white">{t(C.dash.reportResult, lang)}</a>
            </div>
          </section>

          <section className="border-s-4 border-[var(--bc-sky)] bg-[var(--bc-deep)] p-4">
            <p className="text-sm text-[var(--bc-sky)]">{t(C.dash.invitations, lang)}</p>
            <div className="mt-2 flex items-center gap-3">
              <ClanCode tag="CRT" />
              <p className="font-semibold">{t(C.dash.inviteText, lang)}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <a className="bc-cond flex-1 bg-white py-2 text-center font-bold uppercase text-[var(--bc-ink)]">{t(C.dash.accept, lang)}</a>
              <a className="bc-cond flex-1 border border-white/30 py-2 text-center font-bold uppercase">{t(C.dash.decline, lang)}</a>
            </div>
          </section>

          <section>
            <Tab>{t(C.dash.achievements, lang)}</Tab>
            <ul className="flex flex-col gap-1.5">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.date} className="flex items-center gap-3 bg-[var(--bc-deep)] p-3">
                  <span className={`bc-num grid size-10 shrink-0 place-items-center text-lg font-extrabold ${a.place === 1 ? 'bg-[#f5b301] text-[var(--bc-ink)]' : 'bg-white/10'}`}>{a.place}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.title[lang]}</p>
                    <p className="text-xs text-[var(--bc-mute)]">{C.dash.places[lang][a.place]} · {fmtDate(a.date, lang, { month: 'long', year: 'numeric' })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </BroadcastShell>
  );
}

// ── 3. Clan profile ─────────────────────────────────────────────────────────

export function BroadcastClan({ lang }: P) {
  const c = clan('NILE');
  const r = c.record;
  return (
    <BroadcastShell lang={lang} active="clans">
      <section className="bc-stripes relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.colors[0]}, var(--bc-night) 75%)` }}>
        <Emblem kind={c.emblem} colors={[c.colors[1], c.colors[1]]} shape="bare" className="pointer-events-none absolute -end-20 -top-16 size-[28rem] opacity-[0.07]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <ClanCode tag={c.tag} size="lg" />
            <div className="min-w-0 flex-1">
              <span className="bc-num text-lg font-bold tracking-[0.25em] text-[color:var(--bc-sky)]">{c.tag}</span>
              <h1 className="bc-display text-5xl uppercase sm:text-7xl">{c.name[lang]}</h1>
              <p className="mt-2 text-[var(--bc-mute)]">
                {flag(c.country)} {countryName(c.country, lang)} · {t(C.clan.founded, lang)} {fmtDate(c.founded, lang, { month: 'long', year: 'numeric' })} · {c.members} {t(C.clan.members, lang)}
              </p>
            </div>
            <div className="flex gap-2">
              <a className="bc-skew bg-[var(--bc-red)] px-6 py-3"><span className="bc-unskew bc-cond block font-bold uppercase">{t(C.clan.join, lang)}</span></a>
              <a className="bc-skew bg-white/10 px-4 py-3"><span className="bc-unskew flex items-center gap-1"><ExternalLink className="size-4" />{t(C.clan.contact, lang)}</span></a>
            </div>
          </div>
        </div>
        {/* Stat strip */}
        <div className="relative border-t border-white/10 bg-black/30">
          <dl className="mx-auto grid max-w-7xl grid-cols-4 px-4 sm:grid-cols-7">
            {[
              [r.p, C.clan.played], [r.w, C.clan.won], [r.d, C.clan.drawn], [r.l, C.clan.lost],
              [`${Math.round((r.w / r.p) * 100)}%`, C.clan.winRate], [r.gf - r.ga, C.clan.gd], [c.trophies, C.clan.trophies],
            ].map(([v, l], i) => (
              <div key={i} className={`py-4 ${i > 3 ? 'hidden sm:block' : ''}`}>
                <dd className="bc-num text-3xl font-extrabold">{v as string}</dd>
                <dt className="text-xs text-[var(--bc-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <Tab aside={<span className="pb-2"><FormDots form={c.form} /></span>}>{t(C.clan.roster, lang)}</Tab>
          {/* Team sheet */}
          <ol className="flex flex-col gap-1">
            {ROSTER.map((p, i) => (
              <li key={p.username} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 bg-[var(--bc-deep)] sm:grid-cols-[3rem_minmax(0,1fr)_4rem_7.5rem]">
                <span className="bc-num grid h-14 place-items-center bg-white/5 text-xl font-extrabold text-[var(--bc-mute)]">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 px-3">
                  <p className="bc-cond truncate text-lg font-bold">
                    {p.name[lang]} <span className="text-sm">{flag(p.country)}</span>
                  </p>
                  <p className="bc-num text-xs text-[var(--bc-mute)]">@{p.username}</p>
                </div>
                <span className="bc-num hidden text-center text-base font-bold text-[var(--bc-sky)] sm:block">{p.position}</span>
                <span className="pe-3 text-end">
                  {p.role === 'leader' ? (
                    <span className="bc-cond bg-[#f5b301] px-2 py-0.5 text-sm font-bold text-[var(--bc-ink)]">{t(C.clan.roles.leader, lang)}</span>
                  ) : p.role === 'co_leader' ? (
                    <span className="bc-cond bg-white px-2 py-0.5 text-sm font-bold text-[var(--bc-ink)]">{t(C.clan.roles.co_leader, lang)}</span>
                  ) : (
                    <span className="bc-num text-sm font-semibold text-[var(--bc-mute)]">{winRate(p.stats)}%</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <aside className="flex flex-col gap-10">
          <section>
            <Tab>{t(C.clan.about, lang)}</Tab>
            <p className="text-lg leading-relaxed text-[#d4dcf0]">{t(C.clan.description, lang)}</p>
          </section>
          <section>
            <Tab>{t(C.clan.history, lang)}</Tab>
            <ul className="flex flex-col gap-1.5">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.date} className="flex items-center gap-3 bg-[var(--bc-deep)] p-3">
                  <Trophy className={`size-6 shrink-0 ${a.place === 1 ? 'text-[#f5b301]' : 'text-[var(--bc-mute)]'}`} />
                  <span className="min-w-0 flex-1 truncate">{a.title[lang]}</span>
                  <span className="bc-cond text-sm font-bold text-[var(--bc-mute)]">{C.dash.places[lang][a.place]}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </BroadcastShell>
  );
}

// ── 4. Tournament ───────────────────────────────────────────────────────────

export function BroadcastTournament({ lang }: P) {
  const live = MATCHES[0]!;
  const Chevron = lang === 'ar' ? ChevronLeft : ChevronRight;
  return (
    <BroadcastShell lang={lang} active="competitions">
      <section className="bc-stripes bc-glow border-b border-[var(--bc-line)]">
        <div className="mx-auto max-w-7xl px-4 pt-10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="bc-skew bg-[var(--bc-red)] px-3 py-1"><span className="bc-unskew bc-cond flex items-center gap-2 font-bold uppercase"><span className="bc-pulse size-2 rounded-full bg-white" />{t(C.live, lang)}</span></span>
            <span className="text-[var(--bc-mute)]">{t(TOURNAMENT.season, lang)}</span>
          </div>
          <h1 className="bc-display mt-3 text-5xl uppercase sm:text-7xl">{t(TOURNAMENT.name, lang)}</h1>
          <dl className="mt-6 grid grid-cols-2 gap-6 pb-8 text-sm sm:grid-cols-4">
            {[
              [C.tour.organizer, t(TOURNAMENT.organizer, lang)],
              [C.tour.format, t(TOURNAMENT.format, lang)],
              [C.tour.dates, t(TOURNAMENT.dates, lang)],
              [C.tour.participants, String(TOURNAMENT.participants)],
            ].map(([l, v], i) => (
              <div key={i}>
                <dt className="text-[var(--bc-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
                <dd className="mt-1 font-semibold">{v as string}</dd>
              </div>
            ))}
          </dl>
          <nav className="flex gap-1 overflow-x-auto">
            {[C.tour.overview, C.tour.bracket, C.tour.groups, C.tour.fixtures].map((x, i) => (
              <a key={i} className={`bc-cond shrink-0 px-4 py-3 text-base font-bold uppercase ${i === 0 ? 'bg-white text-[var(--bc-ink)]' : 'text-[var(--bc-mute)]'}`}>{t(x, lang)}</a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <section>
          <Tab>{t(C.tour.liveMatch, lang)}</Tab>
          <div className="bg-[var(--bc-deep)] ring-1 ring-white/10">
            <Scorebug lang={lang} home={live.home} away={live.away} games={live.games} status="live" minute={live.minute} big />
            <div className="grid grid-cols-5 gap-px bg-white/5">
              {LIVE_GAMES.map((g, i) => (
                <div key={i} className={`flex flex-col items-center gap-1 py-3 ${g.state === 'live' ? 'bg-[var(--bc-red)]' : 'bg-[var(--bc-deep)]'}`}>
                  <span className="text-[10px] text-white/70">{t(C.tour.board, lang)} {i + 1}</span>
                  <span className="text-xl font-extrabold">{g.score ? <Score v={g.score} /> : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <Tab>{t(C.tour.bracket, lang)}</Tab>
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col gap-6">
              {TOURNAMENT.bracket.semis.map((m) => (
                <div key={m.id}>
                  <p className="mb-1 text-xs text-[var(--bc-mute)]">{t(C.tour.semi, lang)}</p>
                  <div className="bg-[var(--bc-deep)]">
                    <Scorebug lang={lang} home={m.home} away={m.away} games={m.games} status={m.status} minute={m.minute} />
                  </div>
                </div>
              ))}
            </div>
            <Chevron className="mx-auto hidden size-10 text-[var(--bc-red)] md:block" />
            <div className="bc-stripes relative bg-white p-6 text-center text-[var(--bc-ink)]">
              <Trophy className="mx-auto size-14 text-[#f5b301]" strokeWidth={1.5} />
              <p className="bc-display mt-2 text-3xl uppercase">{t(C.tour.final, lang)}</p>
              <p className="bc-num mt-1 text-sm text-[#44507a]">{fmtDate(TOURNAMENT.bracket.final.time, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <div className="mt-5 flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1"><ClanCode tag="CEG" /><span className="bc-display">{clan('CEG').name[lang]}</span></div>
                <span className="bc-display text-2xl text-[var(--bc-red)]">{t(C.vs, lang)}</span>
                <div className="flex flex-col items-center gap-1"><span className="grid size-10 place-items-center border-2 border-dashed border-[#9aa6c8] text-lg">?</span><span className="text-sm text-[#44507a]">NILE / GST</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <Tab aside={<span className="pb-2 text-sm text-[var(--bc-mute)]">{t(C.tour.qualify, lang)}</span>}>{t(C.tour.groups, lang)}</Tab>
          <div className="grid gap-6 md:grid-cols-2">
            {TOURNAMENT.groups.map((g) => (
              <div key={g.name.en}>
                <p className="bc-display mb-2 text-xl uppercase">{g.name[lang]}</p>
                <table className="w-full text-sm">
                  <thead className="text-[var(--bc-mute)]">
                    <tr className="text-xs">
                      <th className="w-8 py-2 text-start">#</th>
                      <th className="text-start" />
                      {[C.clan.played, C.clan.won, C.clan.drawn, C.clan.lost, C.clan.gd, C.clan.pts].map((h, i) => (
                        <th key={i} className="w-9 text-center font-normal">{t(h, lang)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr key={r.tag} className={`border-t border-white/5 ${i < 2 ? 'bg-[var(--bc-deep)]' : ''}`}>
                        <td className={`bc-num py-2.5 font-bold ${i < 2 ? 'text-[var(--bc-sky)]' : 'text-[var(--bc-mute)]'}`}>{i + 1}</td>
                        <td><span className="flex items-center gap-2"><ClanCode tag={r.tag} size="sm" /><span className="bc-cond truncate text-base font-bold">{clan(r.tag).name[lang]}</span></span></td>
                        {[r.p, r.w, r.d, r.l, r.gd > 0 ? `+${r.gd}` : r.gd].map((v, j) => <td key={j} className="bc-num text-center">{v}</td>)}
                        <td className="bc-num text-center text-lg font-extrabold">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      </div>
    </BroadcastShell>
  );
}

// ── 5. Admin ────────────────────────────────────────────────────────────────

export function BroadcastAdmin({ lang }: P) {
  const sel = ADMIN.queue[0]!;
  const ok = (v: boolean, yes: { ar: string; en: string }, no: { ar: string; en: string }) => (
    <li className="flex items-center gap-2 text-sm">
      {v ? <Check className="size-4 text-[#19c37d]" /> : <X className="size-4 text-[var(--bc-red)]" />}
      <span className={v ? '' : 'text-[var(--bc-red)]'}>{t(v ? yes : no, lang)}</span>
    </li>
  );
  const age = (iso: string) => Math.max(1, Math.round((Date.parse('2026-11-21T08:00:00Z') - Date.parse(iso)) / 3_600_000));
  return (
    <BroadcastShell lang={lang} active="admin">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="bc-display text-4xl uppercase sm:text-5xl">{t(C.admin.title, lang)}</h1>
        {/* Status board */}
        <dl className="mt-6 grid grid-cols-2 gap-1.5 md:grid-cols-4">
          {[
            [ADMIN.stats.pending, C.admin.pending, 'bg-white text-[var(--bc-ink)]'],
            [ADMIN.stats.openDisputes, C.admin.disputes, 'bg-[var(--bc-red)]'],
            [ADMIN.stats.liveMatches, C.admin.liveMatches, 'bg-[var(--bc-deep)]'],
            [ADMIN.stats.clans, C.admin.clans, 'bg-[var(--bc-deep)]'],
          ].map(([v, l, cls], i) => (
            <div key={i} className={`p-4 ${cls}`}>
              <dd className="bc-num text-4xl font-extrabold">{v as number}</dd>
              <dt className="text-sm opacity-80">{t(l as { ar: string; en: string }, lang)}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section>
            <Tab>{t(C.admin.queue, lang)}</Tab>
            <ul className="flex flex-col gap-1">
              {ADMIN.queue.map((a, i) => (
                <li key={a.id} className={`flex items-center gap-3 p-3 ${i === 0 ? 'bg-white text-[var(--bc-ink)]' : 'bg-[var(--bc-deep)]'}`}>
                  <Emblem kind={a.emblem} colors={a.colors} className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="bc-cond truncate text-lg font-bold">{a.name[lang]} <span className="bc-num text-sm opacity-60">{a.tag}</span></p>
                    <p className="truncate text-xs opacity-70">{a.applicant[lang]} · {t(C.admin.waiting, lang)} {age(a.submitted)}h</p>
                  </div>
                  {(!a.checks.name || !a.checks.free) && <span className="size-2.5 shrink-0 rounded-full bg-[var(--bc-red)]" />}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white text-[var(--bc-ink)]">
            <div className="flex flex-col gap-5 border-b border-[#e3e8f4] p-5 sm:flex-row sm:items-center">
              <Emblem kind={sel.emblem} colors={sel.colors} className="size-24 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#44507a]">{t(C.admin.reviewing, lang)}</p>
                <h2 className="bc-display text-4xl uppercase">{sel.name[lang]}</h2>
                <p className="bc-num text-lg font-bold tracking-[0.2em] text-[var(--bc-red)]">{sel.tag}</p>
              </div>
              <ul className="flex flex-col gap-1">
                {ok(sel.checks.name, C.admin.checks.name, C.admin.checks.nameTaken)}
                {ok(sel.checks.tag, C.admin.checks.tag, C.admin.checks.tagTaken)}
                {ok(sel.checks.free, C.admin.checks.free, C.admin.checks.busy)}
              </ul>
            </div>
            <dl className="grid gap-4 p-5 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-[#44507a]">{t(C.admin.descriptionLabel, lang)}</dt>
              <dd className="leading-relaxed">{t(ADMIN.description, lang)}</dd>
              <dt className="text-[#44507a]">{t(C.admin.contact, lang)}</dt>
              <dd className="bc-num text-[#1d4ed8]">{ADMIN.contact}</dd>
              <dt className="text-[#44507a]">{t(C.admin.applicant, lang)}</dt>
              <dd>
                {sel.applicant[lang]} <span className="bc-num text-[#44507a]">@{sel.username}</span> · {flag(sel.country)} {countryName(sel.country, lang)}
              </dd>
            </dl>
            <div className="grid gap-px bg-[#e3e8f4] sm:grid-cols-2">
              <a className="bc-cond bg-[var(--bc-ink)] py-4 text-center text-lg font-bold uppercase text-white">{t(C.admin.approve, lang)}</a>
              <a className="bc-cond bg-white py-4 text-center text-lg font-bold uppercase text-[var(--bc-red)]">{t(C.admin.reject, lang)}</a>
            </div>
          </section>
        </div>

        <section className="mt-10">
          <Tab>{t(C.admin.recent, lang)}</Tab>
          <ul className="flex flex-col gap-1">
            {ADMIN.decisions.map((d, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-[var(--bc-deep)] px-4 py-3 text-sm">
                <span className={`size-2 rounded-full ${d.action === 'approve' ? 'bg-[#19c37d]' : 'bg-[var(--bc-red)]'}`} />
                <span className="bc-num font-semibold">@{d.who}</span>
                <span className="text-[var(--bc-mute)]">{t(d.action === 'approve' ? C.admin.approved : C.admin.rejected, lang)}</span>
                <span className="font-semibold">{d.target[lang]}</span>
                <span className="ms-auto text-xs text-[var(--bc-mute)]">{fmtDate(d.at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </BroadcastShell>
  );
}

export const BROADCAST = {
  home: BroadcastHome,
  dashboard: BroadcastDashboard,
  clan: BroadcastClan,
  tournament: BroadcastTournament,
  admin: BroadcastAdmin,
};

