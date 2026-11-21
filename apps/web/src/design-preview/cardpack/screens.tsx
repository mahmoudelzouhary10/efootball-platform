/* DESIGN PREVIEW ONLY — Concept C: Card Pack (eFootball collectible-card language). */
import { Check, Gauge, Home, LayoutGrid, Shield, Swords, Trophy, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { C, countryName, flag, fmtDate, fmtNum } from '../copy';
import { ACHIEVEMENTS, ADMIN, CLANS, clan, LIVE_GAMES, type Lang, MATCHES, ME, type PClan, type PPlayer, ROSTER, TOURNAMENT, winRate } from '../data';
import { Emblem, hueOf, initials } from '../emblem';

type P = { lang: Lang };
const t = <T extends { ar: string; en: string }>(n: T, lang: Lang) => n[lang];
const pts = (c: PClan) => c.record.w * 3 + c.record.d;

// ── chrome: side rail (desktop) + floating dock (mobile) ────────────────────

const NAV = [
  { key: 'home', icon: Home },
  { key: 'competitions', icon: Trophy },
  { key: 'clans', icon: Shield },
  { key: 'dashboard', icon: LayoutGrid },
  { key: 'admin', icon: Gauge },
] as const;

export function CardPackShell({ lang, active, children }: P & { active: (typeof NAV)[number]['key']; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center gap-2 border-e border-[var(--cp-line)] bg-[var(--cp-stage-2)]/80 py-5 backdrop-blur md:flex">
        <div className="cp-hex cp-holo mb-6 grid size-12 place-items-center">
          <Swords className="size-6 text-[var(--cp-stage)]" />
        </div>
        {NAV.map((n) => (
          <a key={n.key} className={`flex w-20 flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] ${active === n.key ? 'bg-[var(--cp-panel-2)] text-white' : 'text-[var(--cp-mute)] hover:text-white'}`}>
            <n.icon className={`size-5 ${active === n.key ? 'text-[#38e1ff]' : ''}`} />
            {t(C.nav[n.key], lang)}
          </a>
        ))}
        <div className="mt-auto grid size-11 place-items-center rounded-full ring-2 ring-[#8b5cf6]" style={{ background: `hsl(${hueOf(ME.username)} 45% 35%)` }}>
          <span className="text-sm font-bold">{initials(ME.name[lang])}</span>
        </div>
      </aside>
      <div className="min-w-0 flex-1 pb-28 md:pb-0">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <span className="cp-display text-xl">
            {t(C.brand, lang)}
          </span>
          <span className="text-sm text-[var(--cp-mute)]">{lang === 'ar' ? 'English' : 'العربية'}</span>
        </header>
        <main>{children}</main>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-3xl border border-[var(--cp-line)] bg-[var(--cp-panel)]/95 p-1.5 shadow-[0_20px_50px_-10px_rgb(0_0_0/0.7)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <a key={n.key} className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] ${active === n.key ? 'bg-[var(--cp-panel-2)] text-white' : 'text-[var(--cp-mute)]'}`}>
            <n.icon className={`size-5 ${active === n.key ? 'text-[#38e1ff]' : ''}`} />
            {t(C.nav[n.key], lang)}
          </a>
        ))}
      </nav>
    </div>
  );
}

function H({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="cp-display flex items-center gap-3 text-2xl sm:text-3xl">
        <span className="cp-holo h-6 w-1.5 rounded-full" />
        {children}
      </h2>
      {aside}
    </div>
  );
}

const tierOf = (rate: number) => (rate >= 65 ? 'cp-gold' : rate >= 60 ? 'cp-silver' : 'cp-bronze');

/** The signature element: a collectible player card. Its frame tier reflects the win rate. */
function PlayerCard({ p, lang, size = 'md', holo }: P & { p: PPlayer; size?: 'sm' | 'md' | 'lg'; holo?: boolean }) {
  const rate = winRate(p.stats);
  const frame = holo ? 'cp-holo' : tierOf(rate);
  const w = size === 'lg' ? 'w-64 sm:w-72' : size === 'sm' ? 'w-36' : 'w-44';
  const dark = frame === 'cp-holo' ? 'text-[#1a0f33]' : 'text-[#1c1405]';
  return (
    <div className={`cp-card-cut ${frame} ${w} shrink-0 p-[3px]`}>
      <div className={`cp-card-cut ${frame} relative flex flex-col ${dark}`}>
        <div className="cp-dots absolute inset-0 opacity-40" />
        <div className="relative flex items-start justify-between px-3 pt-3">
          <div className="leading-none">
            <p className={`cp-num font-bold ${size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-2xl' : 'text-3xl'}`}>{Math.round(rate)}</p>
            <p className="cp-num text-sm font-bold">{p.position}</p>
            <p className="mt-1 text-base">{flag(p.country)}</p>
          </div>
          <Emblem kind={clan('NILE').emblem} colors={clan('NILE').colors} shape="hex" className={size === 'sm' ? 'size-7' : 'size-9'} />
        </div>
        <div className={`relative mx-auto -mt-2 grid place-items-center rounded-full font-extrabold text-white ${size === 'lg' ? 'size-32 text-5xl' : size === 'sm' ? 'size-16 text-2xl' : 'size-20 text-3xl'}`} style={{ background: `radial-gradient(circle at 35% 30%, hsl(${hueOf(p.username)} 60% 55%), hsl(${hueOf(p.username)} 55% 22%))` }}>
          {initials(p.name[lang])}
        </div>
        <p className={`cp-display relative mt-2 truncate px-2 text-center ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'}`}>{p.name[lang]}</p>
        <div className={`relative mx-3 mb-6 mt-2 grid grid-cols-3 border-t border-black/15 pt-2 text-center ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          {[[p.stats.matches, 'MP'], [p.stats.wins, 'W'], [p.stats.goals, 'GF']].map(([v, l]) => (
            <div key={l as string}><p className="cp-num font-bold">{v}</p><p className="cp-num opacity-70">{l}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClanTile({ c, lang, rank }: P & { c: PClan; rank?: number }) {
  return (
    <div className="relative w-40 shrink-0 overflow-hidden rounded-3xl border border-[var(--cp-line)] bg-[var(--cp-panel)] p-4 text-center">
      <div className="absolute inset-x-0 top-0 h-20 opacity-60" style={{ background: `linear-gradient(180deg, ${c.colors[0]}, transparent)` }} />
      {rank !== undefined && <span className="cp-num absolute start-3 top-2 text-2xl font-bold text-white/80">{rank}</span>}
      <Emblem kind={c.emblem} colors={c.colors} shape="hex" className="relative mx-auto size-20" />
      <p className="cp-display relative mt-2 truncate text-lg">{c.name[lang]}</p>
      <p className="cp-num relative text-xs tracking-[0.2em] text-[var(--cp-mute)]">{c.tag}</p>
      <p className="cp-num relative mt-2 text-2xl font-bold text-[#38e1ff]">{pts(c)}<span className="ms-1 text-xs text-[var(--cp-mute)]">PTS</span></p>
    </div>
  );
}

function Score({ v, className = '' }: { v: [number, number]; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="cp-num">{v[0]}</span>
      <span className="cp-num text-[0.6em] text-[var(--cp-mute)]">—</span>
      <span className="cp-num">{v[1]}</span>
    </span>
  );
}

/** Versus card: two clan crests facing off, score in the middle. */
function Versus({ lang, m, big }: P & { m: (typeof MATCHES)[number]; big?: boolean }) {
  const h = clan(m.home);
  const a = m.away === 'TBD' ? null : clan(m.away);
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--cp-line)] bg-[var(--cp-panel)]">
      <div className="absolute inset-y-0 start-0 w-1/2 opacity-40" style={{ background: `linear-gradient(${lang === 'ar' ? '270deg' : '90deg'}, ${h.colors[0]}, transparent)` }} />
      {a && <div className="absolute inset-y-0 end-0 w-1/2 opacity-40" style={{ background: `linear-gradient(${lang === 'ar' ? '90deg' : '270deg'}, ${a.colors[0]}, transparent)` }} />}
      <div className={`relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 ${big ? 'p-6 sm:p-8' : 'p-4'}`}>
        <div className="flex flex-col items-center gap-2 text-center">
          <Emblem kind={h.emblem} colors={h.colors} shape="hex" className={big ? 'size-20 sm:size-24' : 'size-12'} />
          <span className={`cp-display truncate ${big ? 'text-xl sm:text-2xl' : 'text-base'}`}>{h.name[lang]}</span>
        </div>
        <div className="text-center">
          {m.status === 'live' && <span className="mx-auto mb-1 block w-fit rounded-full bg-[var(--cp-flame)] px-2.5 text-xs font-bold text-[#2a0710]">{t(C.live, lang)} {m.minute}</span>}
          {m.games ? (
            <Score v={m.games} className={`font-bold ${big ? 'text-5xl sm:text-6xl' : 'text-3xl'}`} />
          ) : (
            <span className="cp-num block text-xl font-bold text-[var(--cp-mute)]">{fmtDate(m.time, lang, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          )}
          <p className="text-xs text-[var(--cp-mute)]">{t(m.round, lang)}</p>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          {a ? <Emblem kind={a.emblem} colors={a.colors} shape="hex" className={big ? 'size-20 sm:size-24' : 'size-12'} /> : <span className="cp-hex grid size-12 place-items-center bg-[var(--cp-panel-2)] text-[var(--cp-mute)]">?</span>}
          <span className={`cp-display truncate ${big ? 'text-xl sm:text-2xl' : 'text-base'}`}>{a ? a.name[lang] : t(C.tour.tbd, lang)}</span>
        </div>
      </div>
    </div>
  );
}

// ── 1. Home ─────────────────────────────────────────────────────────────────

export function CardPackHome({ lang }: P) {
  const table = [...CLANS].sort((a, b) => pts(b) - pts(a));
  const fan = [ROSTER[2]!, ROSTER[0]!, ROSTER[1]!];
  return (
    <CardPackShell lang={lang} active="home">
      <section className="grid items-center gap-10 overflow-hidden px-4 pb-12 pt-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--cp-line)] bg-[var(--cp-panel)] px-3 py-1 text-sm text-[#38e1ff]">
            <span className="size-2 rounded-full bg-[var(--cp-mint)]" />
            {t(C.home.kicker, lang)}
          </span>
          <h1 className={`cp-display mt-5 ${lang === 'ar' ? 'text-[2.5rem] sm:text-6xl' : 'text-5xl sm:text-7xl'}`}>{t(C.home.title, lang)}</h1>
          <p className="mt-5 max-w-lg text-lg text-[var(--cp-mute)]">{t(C.home.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="cp-holo rounded-2xl px-6 py-3 font-bold text-[#1a0f33]">{t(C.home.ctaJoin, lang)}</a>
            <a className="rounded-2xl border border-[var(--cp-line)] bg-[var(--cp-panel)] px-6 py-3 font-semibold">{t(C.home.ctaWatch, lang)}</a>
          </div>
        </div>
        {/* The pack: three real player cards fanned out */}
        <div className="relative flex h-[20rem] scale-[0.8] items-center justify-center sm:h-[26rem] sm:scale-100">
          {fan.map((p, i) => (
            <div
              key={p.username}
              className="absolute"
              style={{ transform: `translateX(${(i - 1) * (lang === 'ar' ? -62 : 62)}%) rotate(${(i - 1) * (lang === 'ar' ? -10 : 10)}deg) translateY(${i === 1 ? 0 : 18}px)`, zIndex: i === 1 ? 2 : 1 }}
            >
              <div className={i === 1 ? 'cp-float' : ''}>
                <PlayerCard p={p} lang={lang} size={i === 1 ? 'md' : 'sm'} holo={i === 1} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-8">
        <H aside={<span className="text-sm text-[var(--cp-mute)]">{t(TOURNAMENT.name, lang)}</span>}>{t(C.home.liveNow, lang)}</H>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Versus lang={lang} m={MATCHES[0]!} big />
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-1">
            {LIVE_GAMES.map((g, i) => (
              <div key={i} className={`flex items-center justify-between rounded-2xl px-3 py-2 ${g.state === 'live' ? 'bg-[var(--cp-flame)]/20 ring-1 ring-[var(--cp-flame)]' : 'bg-[var(--cp-panel)]'}`}>
                <span className="hidden truncate text-sm lg:inline">{ROSTER.find((r) => r.username === g.home)?.name[lang]}</span>
                <span className="mx-auto font-bold lg:mx-0">{g.score ? <Score v={g.score} /> : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 px-4 sm:px-8">
        <H>{t(C.home.topClans, lang)}</H>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
          {table.map((c, i) => <ClanTile key={c.tag} c={c} lang={lang} rank={i + 1} />)}
        </div>
      </section>

      <section className="mt-14 px-4 pb-16 sm:px-8">
        <H>{t(C.home.upcoming, lang)}</H>
        <div className="grid gap-4 md:grid-cols-2">
          {MATCHES.filter((m) => m.status === 'scheduled').map((m) => <Versus key={m.id} lang={lang} m={m} />)}
        </div>
        <dl className="mt-10 grid grid-cols-3 gap-3">
          {[[126, C.home.stats.clans], [3967, C.home.stats.players], [1284, C.home.stats.matches]].map(([n, l], i) => (
            <div key={i} className="cp-hex bg-[var(--cp-panel)] px-6 py-6 text-center">
              <dd className="cp-num text-3xl font-bold sm:text-4xl">{fmtNum(n as number, lang)}</dd>
              <dt className="text-xs text-[var(--cp-mute)] sm:text-sm">{t(l as { ar: string; en: string }, lang)}</dt>
            </div>
          ))}
        </dl>
      </section>
    </CardPackShell>
  );
}

// ── 2. Player dashboard ─────────────────────────────────────────────────────

export function CardPackDashboard({ lang }: P) {
  const s = ME.stats;
  const next = MATCHES.find((m) => m.id === 'l1')!;
  const medal = ['', 'cp-gold', 'cp-silver', 'cp-bronze'];
  return (
    <CardPackShell lang={lang} active="dashboard">
      <section className="grid gap-8 px-4 pb-10 sm:px-8 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-4">
          <PlayerCard p={ME} lang={lang} size="lg" holo />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--cp-mute)]">{t(C.dash.gameId, lang)}</span>
            <span className="cp-num font-bold">{ME.gameId}</span>
            <span className="rounded-full border border-[var(--cp-line)] px-2 text-xs text-[var(--cp-mute)]">{t(C.dash.unverified, lang)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-[var(--cp-mute)]">{t(C.dash.hello, lang)}</p>
            <h1 className="cp-display mt-1 text-5xl">{ME.name[lang]}</h1>
            <p className="mt-2 text-[var(--cp-mute)]">{flag(ME.country)} {countryName(ME.country, lang)} · {clan('NILE').name[lang]} · {t(C.clan.roles.co_leader, lang)}</p>
          </div>
          {/* Hex stat block */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[[s.matches, C.dash.matches, ''], [`${winRate(s)}%`, C.dash.winRate, 'cp-holo text-[#1a0f33]'], [s.goals, C.dash.goals, ''], [s.conceded, C.dash.conceded, '']].map(([v, l, cls], i) => (
              <div key={i} className={`cp-hex px-4 py-7 text-center ${cls || 'bg-[var(--cp-panel)]'}`}>
                <dd className="cp-num text-3xl font-bold">{v as string}</dd>
                <dt className={`text-sm ${cls ? '' : 'text-[var(--cp-mute)]'}`}>{t(l as { ar: string; en: string }, lang)}</dt>
              </div>
            ))}
          </dl>
          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <H>{t(C.dash.nextMatch, lang)}</H>
              <Versus lang={lang} m={next} />
              <a className="cp-holo mt-3 block rounded-2xl py-3 text-center font-bold text-[#1a0f33]">{t(C.dash.reportResult, lang)}</a>
            </div>
            <div>
              <H>{t(C.dash.invitations, lang)}</H>
              <div className="rounded-[1.75rem] border border-[#38e1ff]/40 bg-[var(--cp-panel)] p-5">
                <div className="flex items-center gap-3">
                  <Emblem kind={clan('CRT').emblem} colors={clan('CRT').colors} shape="hex" className="size-14" />
                  <p className="font-semibold">{t(C.dash.inviteText, lang)}</p>
                </div>
                <div className="mt-5 flex gap-2">
                  <a className="flex-1 rounded-2xl bg-[var(--cp-mint)] py-2.5 text-center font-bold text-[#06210f]">{t(C.dash.accept, lang)}</a>
                  <a className="flex-1 rounded-2xl bg-[var(--cp-panel-2)] py-2.5 text-center font-semibold">{t(C.dash.decline, lang)}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="px-4 pb-16 sm:px-8">
        <H>{t(C.dash.achievements, lang)}</H>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.date} className="flex items-center gap-4 rounded-3xl bg-[var(--cp-panel)] p-4">
              <span className={`cp-hex ${medal[a.place]} grid size-14 shrink-0 place-items-center text-[#1c1405]`}><Trophy className="size-6" /></span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{a.title[lang]}</p>
                <p className="text-sm text-[var(--cp-mute)]">{C.dash.places[lang][a.place]} · {fmtDate(a.date, lang, { month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </CardPackShell>
  );
}

// ── 3. Clan profile ─────────────────────────────────────────────────────────

export function CardPackClan({ lang }: P) {
  const c = clan('NILE');
  const r = c.record;
  return (
    <CardPackShell lang={lang} active="clans">
      <section className="px-4 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--cp-line)]" style={{ background: `linear-gradient(120deg, ${c.colors[0]}, var(--cp-panel) 60%)` }}>
          <div className="cp-dots absolute inset-0" />
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
            <Emblem kind={c.emblem} colors={c.colors} shape="hex" className="size-28 shrink-0 drop-shadow-[0_10px_30px_rgb(0_0_0/0.5)] sm:size-36" />
            <div className="min-w-0 flex-1">
              <p className="cp-num tracking-[0.3em] text-white/80">{c.tag}</p>
              <h1 className="cp-display text-5xl sm:text-6xl">{c.name[lang]}</h1>
              <p className="mt-2 text-white/80">{flag(c.country)} {countryName(c.country, lang)} · {t(C.clan.founded, lang)} {fmtDate(c.founded, lang, { month: 'long', year: 'numeric' })}</p>
            </div>
            <a className="cp-holo rounded-2xl px-6 py-3 text-center font-bold text-[#1a0f33]">{t(C.clan.join, lang)}</a>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[[c.members, C.clan.members], [r.p, C.clan.played], [r.w, C.clan.won], [`${Math.round((r.w / r.p) * 100)}%`, C.clan.winRate], [r.gf - r.ga, C.clan.gd], [c.trophies, C.clan.trophies]].map(([v, l], i) => (
            <div key={i} className="rounded-2xl bg-[var(--cp-panel)] p-4 text-center">
              <dd className="cp-num text-3xl font-bold">{v as string}</dd>
              <dt className="text-xs text-[var(--cp-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 px-4 sm:px-8">
        <H aside={<span className="flex gap-1">{c.form.map((f, i) => <span key={i} className={`cp-num grid size-7 place-items-center rounded-lg text-xs font-bold ${f === 'W' ? 'bg-[var(--cp-mint)] text-[#06210f]' : f === 'D' ? 'bg-[var(--cp-panel-2)]' : 'bg-[var(--cp-flame)] text-[#2a0710]'}`}>{f}</span>)}</span>}>{t(C.clan.roster, lang)}</H>
        {/* Roster as a card binder */}
        <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {ROSTER.map((p) => (
            <div key={p.username} className="flex flex-col items-center gap-2">
              <PlayerCard p={p} lang={lang} size="sm" holo={p.role === 'leader'} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${p.role === 'leader' ? 'cp-gold font-bold text-[#1c1405]' : p.role === 'co_leader' ? 'bg-[#38e1ff]/20 text-[#38e1ff]' : 'bg-[var(--cp-panel)] text-[var(--cp-mute)]'}`}>{t(C.clan.roles[p.role], lang)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-8 px-4 pb-16 sm:px-8 lg:grid-cols-2">
        <div>
          <H>{t(C.clan.about, lang)}</H>
          <p className="rounded-3xl bg-[var(--cp-panel)] p-6 text-lg leading-relaxed text-[#ddd6fe]">{t(C.clan.description, lang)}</p>
        </div>
        <div>
          <H>{t(C.clan.history, lang)}</H>
          <ul className="flex flex-col gap-2">
            {ACHIEVEMENTS.map((a) => (
              <li key={a.date} className="flex items-center gap-3 rounded-2xl bg-[var(--cp-panel)] p-3">
                <span className={`cp-hex ${['', 'cp-gold', 'cp-silver', 'cp-bronze'][a.place]} grid size-10 place-items-center text-[#1c1405]`}><Trophy className="size-4" /></span>
                <span className="min-w-0 flex-1 truncate">{a.title[lang]}</span>
                <span className="text-sm text-[var(--cp-mute)]">{C.dash.places[lang][a.place]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </CardPackShell>
  );
}

// ── 4. Tournament ───────────────────────────────────────────────────────────

export function CardPackTournament({ lang }: P) {
  return (
    <CardPackShell lang={lang} active="competitions">
      <section className="px-4 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--cp-line)] bg-[var(--cp-panel)] p-6 sm:p-10">
          <div className="cp-holo absolute -end-24 -top-24 size-72 rounded-full opacity-25 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="cp-hex cp-gold grid size-24 shrink-0 place-items-center text-[#1c1405]"><Trophy className="size-11" /></span>
            <div className="min-w-0">
              <span className="rounded-full bg-[var(--cp-flame)] px-2.5 py-0.5 text-xs font-bold text-[#2a0710]">{t(C.live, lang)}</span>
              <h1 className="cp-display mt-2 text-5xl sm:text-6xl">{t(TOURNAMENT.name, lang)}</h1>
              <p className="mt-1 text-[var(--cp-mute)]">{t(TOURNAMENT.season, lang)} · {t(TOURNAMENT.organizer, lang)}</p>
            </div>
          </div>
          <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[[C.tour.format, t(TOURNAMENT.format, lang)], [C.tour.dates, t(TOURNAMENT.dates, lang)], [C.tour.participants, String(TOURNAMENT.participants)]].map(([l, v], i) => (
              <div key={i} className="rounded-2xl bg-[var(--cp-stage-2)] p-4">
                <dt className="text-xs text-[var(--cp-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
                <dd className="mt-1 font-semibold">{v as string}</dd>
              </div>
            ))}
          </dl>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto">
          {[C.tour.overview, C.tour.bracket, C.tour.groups, C.tour.fixtures].map((x, i) => (
            <a key={i} className={`shrink-0 rounded-2xl px-4 py-2 font-semibold ${i === 0 ? 'cp-holo text-[#1a0f33]' : 'bg-[var(--cp-panel)] text-[var(--cp-mute)]'}`}>{t(x, lang)}</a>
          ))}
        </nav>
      </section>

      <section className="mt-10 px-4 sm:px-8">
        <H>{t(C.tour.liveMatch, lang)}</H>
        <Versus lang={lang} m={MATCHES[0]!} big />
      </section>

      <section className="mt-12 px-4 sm:px-8">
        <H>{t(C.tour.bracket, lang)}</H>
        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="flex flex-col gap-4">
            {TOURNAMENT.bracket.semis.map((m) => <Versus key={m.id} lang={lang} m={{ ...m, time: '', round: C.tour.semi }} />)}
          </div>
          <div className="cp-gold rounded-[2rem] p-[3px]">
            <div className="rounded-[calc(2rem-3px)] bg-[var(--cp-panel)] p-6 text-center">
              <Trophy className="mx-auto size-12 text-[var(--cp-gold-1)]" />
              <p className="cp-display mt-2 text-3xl">{t(C.tour.final, lang)}</p>
              <p className="cp-num text-sm text-[var(--cp-mute)]">{fmtDate(TOURNAMENT.bracket.final.time, lang, { day: 'numeric', month: 'long' })}</p>
              <div className="mt-5 flex items-center justify-center gap-5">
                <div className="flex flex-col items-center gap-1"><Emblem kind={clan('CEG').emblem} colors={clan('CEG').colors} shape="hex" className="size-16" /><span className="cp-display">{clan('CEG').name[lang]}</span></div>
                <span className="cp-display text-xl text-[var(--cp-mute)]">{t(C.vs, lang)}</span>
                <div className="flex flex-col items-center gap-1"><span className="cp-hex grid size-16 place-items-center bg-[var(--cp-panel-2)] text-2xl text-[var(--cp-mute)]">?</span><span className="cp-num text-sm text-[var(--cp-mute)]">NILE / GST</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 px-4 pb-16 sm:px-8">
        <H aside={<span className="text-sm text-[var(--cp-mute)]">{t(C.tour.qualify, lang)}</span>}>{t(C.tour.groups, lang)}</H>
        <div className="grid gap-4 md:grid-cols-2">
          {TOURNAMENT.groups.map((g) => (
            <div key={g.name.en} className="rounded-3xl bg-[var(--cp-panel)] p-5">
              <p className="cp-display mb-3 text-xl">{g.name[lang]}</p>
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--cp-mute)]">
                  <tr><th className="w-6 text-start">#</th><th />{[C.clan.played, C.clan.gd, C.clan.pts].map((h, i) => <th key={i} className="w-10 text-center font-normal">{t(h, lang)}</th>)}</tr>
                </thead>
                <tbody>
                  {g.rows.map((r, i) => (
                    <tr key={r.tag} className={i < 2 ? '' : 'opacity-60'}>
                      <td className="cp-num py-2 font-bold">{i + 1}</td>
                      <td><span className="flex items-center gap-2"><Emblem kind={clan(r.tag).emblem} colors={clan(r.tag).colors} shape="hex" className="size-8" /><span className="truncate font-semibold">{clan(r.tag).name[lang]}</span>{i < 2 && <Check className="size-4 text-[var(--cp-mint)]" />}</span></td>
                      <td className="cp-num text-center">{r.p}</td>
                      <td className="cp-num text-center">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td className="cp-num text-center text-lg font-bold text-[#38e1ff]">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </CardPackShell>
  );
}

// ── 5. Admin ────────────────────────────────────────────────────────────────

export function CardPackAdmin({ lang }: P) {
  const sel = ADMIN.queue[0]!;
  const chk = (v: boolean, yes: { ar: string; en: string }, no: { ar: string; en: string }) => (
    <li className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${v ? 'bg-[var(--cp-mint)]/10 text-[var(--cp-mint)]' : 'bg-[var(--cp-flame)]/10 text-[var(--cp-flame)]'}`}>
      {v ? <Check className="size-4" /> : <X className="size-4" />}
      {t(v ? yes : no, lang)}
    </li>
  );
  return (
    <CardPackShell lang={lang} active="admin">
      <div className="px-4 pb-16 sm:px-8">
        <h1 className="cp-display text-4xl sm:text-5xl">{t(C.admin.title, lang)}</h1>
        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[[ADMIN.stats.pending, C.admin.pending, 'text-[#38e1ff]'], [ADMIN.stats.openDisputes, C.admin.disputes, 'text-[var(--cp-flame)]'], [ADMIN.stats.liveMatches, C.admin.liveMatches, 'text-[var(--cp-mint)]'], [ADMIN.stats.clans, C.admin.clans, '']].map(([v, l, cls], i) => (
            <div key={i} className="rounded-3xl bg-[var(--cp-panel)] p-5">
              <dd className={`cp-num text-4xl font-bold ${cls}`}>{v as number}</dd>
              <dt className="text-sm text-[var(--cp-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]">
          <section>
            <H>{t(C.admin.queue, lang)}</H>
            <ul className="flex flex-col gap-2">
              {ADMIN.queue.map((a, i) => (
                <li key={a.id} className={`flex items-center gap-3 rounded-2xl p-3 ${i === 0 ? 'bg-[var(--cp-panel-2)] ring-1 ring-[#38e1ff]/50' : 'bg-[var(--cp-panel)]'}`}>
                  <Emblem kind={a.emblem} colors={a.colors} shape="hex" className="size-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.name[lang]} <span className="cp-num text-xs text-[var(--cp-mute)]">{a.tag}</span></p>
                    <p className="truncate text-xs text-[var(--cp-mute)]">{a.applicant[lang]} · {fmtDate(a.submitted, lang, { day: 'numeric', month: 'short' })}</p>
                  </div>
                  {(!a.checks.name || !a.checks.free) && <span className="size-2.5 rounded-full bg-[var(--cp-flame)]" />}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[2rem] bg-[var(--cp-panel)] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Emblem kind={sel.emblem} colors={sel.colors} shape="hex" className="size-24 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-[var(--cp-mute)]">{t(C.admin.reviewing, lang)}</p>
                <h2 className="cp-display text-4xl">{sel.name[lang]}</h2>
                <p className="cp-num tracking-[0.25em] text-[#38e1ff]">{sel.tag}</p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {chk(sel.checks.name, C.admin.checks.name, C.admin.checks.nameTaken)}
              {chk(sel.checks.tag, C.admin.checks.tag, C.admin.checks.tagTaken)}
              {chk(sel.checks.free, C.admin.checks.free, C.admin.checks.busy)}
            </ul>
            <dl className="mt-6 flex flex-col gap-4 text-[15px]">
              {[[C.admin.descriptionLabel, t(ADMIN.description, lang)], [C.admin.contact, <span key="c" className="cp-num text-[#38e1ff]">{ADMIN.contact}</span>], [C.admin.applicant, <span key="a">{sel.applicant[lang]} <span className="cp-num text-[var(--cp-mute)]">@{sel.username}</span> · {flag(sel.country)} {countryName(sel.country, lang)}</span>]].map(([l, v], i) => (
                <div key={i}><dt className="text-xs text-[var(--cp-mute)]">{t(l as { ar: string; en: string }, lang)}</dt><dd className="mt-1 leading-relaxed">{v as ReactNode}</dd></div>
              ))}
            </dl>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <a className="flex-1 rounded-2xl bg-[var(--cp-mint)] py-3 text-center font-bold text-[#06210f]">{t(C.admin.approve, lang)}</a>
              <a className="flex-1 rounded-2xl border border-[var(--cp-flame)]/60 py-3 text-center font-semibold text-[var(--cp-flame)]">{t(C.admin.reject, lang)}</a>
            </div>
          </section>
        </div>
        <section className="mt-10">
          <H>{t(C.admin.recent, lang)}</H>
          <ul className="flex flex-col gap-2">
            {ADMIN.decisions.map((d, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-[var(--cp-panel)] px-4 py-3 text-sm">
                <span className={`size-2 rounded-full ${d.action === 'approve' ? 'bg-[var(--cp-mint)]' : 'bg-[var(--cp-flame)]'}`} />
                <span className="cp-num">@{d.who}</span>
                <span className="text-[var(--cp-mute)]">{t(d.action === 'approve' ? C.admin.approved : C.admin.rejected, lang)}</span>
                <span className="font-semibold">{d.target[lang]}</span>
                <span className="ms-auto text-xs text-[var(--cp-mute)]">{fmtDate(d.at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </CardPackShell>
  );
}

export const CARDPACK = {
  home: CardPackHome,
  dashboard: CardPackDashboard,
  clan: CardPackClan,
  tournament: CardPackTournament,
  admin: CardPackAdmin,
};
