/* DESIGN PREVIEW ONLY — Hybrid direction: one identity, three surface treatments (stage / sheet / card). */
import { Check, ChevronLeft, ChevronRight, Gauge, Home, Radio, Share2, Shield, Trophy, User, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { C, countryName, flag, fmtDate, fmtNum } from '../copy';
import { ACHIEVEMENTS, ADMIN, CLANS, clan, LIVE_GAMES, type Lang, MATCHES, ME, type PMatch, type PPlayer, ROSTER, TOURNAMENT, winRate } from '../data';
import { Emblem, hueOf, initials } from '../emblem';
import { COMPETITIONS, H, MY_RESULTS, OPPONENTS, TOP_PLAYERS } from './extra';

type P = { lang: Lang };
type T = { ar: string; en: string };
const t = (n: T, lang: Lang) => n[lang];
const pts = (r: { w: number; d: number }) => r.w * 3 + r.d;
const LIVE = MATCHES.find((m) => m.id === 'sf1')!;

// ════════════════════════════════════════════════════════════════════════════
// Primitives
// ════════════════════════════════════════════════════════════════════════════

/** Score that follows reading direction: each number sits beside its own team. */
function Score({ v, className = '', sep = 'dash' }: { v: [number, number]; className?: string; sep?: 'dash' | 'none' }) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className}`}>
      <span className="hy-num">{v[0]}</span>
      {sep === 'dash' && <span className="hy-num opacity-40">–</span>}
      <span className="hy-num">{v[1]}</span>
    </span>
  );
}

/** The only place red appears by default: live state. */
function LiveTag({ lang, minute, size = 'sm' }: P & { minute?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={`hy-slant inline-flex bg-[var(--hy-signal)] ${size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5'}`}>
      <span className={`hy-unslant flex items-center gap-1.5 font-bold ${size === 'md' ? 'text-sm' : 'text-[11px]'}`}>
        <span className="hy-pulse size-1.5 rounded-full bg-white" />
        {t(C.live, lang)}
        {minute && <span className="hy-num">{minute}</span>}
      </span>
    </span>
  );
}

function Crest({ tag, size = 'size-10', shape = 'shield' as const }: { tag: string; size?: string; shape?: 'shield' | 'hex' }) {
  const c = clan(tag);
  return <Emblem kind={c.emblem} colors={c.colors} shape={shape} className={`${size} shrink-0`} title={c.name.en} />;
}

/** Section heading. On stage it's white; on a sheet it's ink. A short slanted bar keeps the broadcast DNA quiet. */
function Heading({ children, aside, tone = 'stage', as: Tag = 'h2' }: { children: ReactNode; aside?: ReactNode; tone?: 'stage' | 'sheet'; as?: 'h2' | 'h3' }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <Tag className={`hy-head flex items-center gap-2.5 text-2xl sm:text-[1.75rem] ${tone === 'sheet' ? 'text-[var(--hy-ink)]' : ''}`}>
        <span className={`hy-slant inline-block h-5 w-1.5 ${tone === 'sheet' ? 'bg-[var(--hy-ink)]' : 'bg-[var(--hy-sky)]'}`} />
        {children}
      </Tag>
      {aside && <span className={`shrink-0 pb-1 text-sm ${tone === 'sheet' ? 'text-[var(--hy-ink-2)]' : 'text-[var(--hy-mute)]'}`}>{aside}</span>}
    </div>
  );
}

/** Paper surface for information. */
function Sheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[10px] bg-[var(--hy-paper)] text-[var(--hy-ink)] ${className}`}>{children}</div>;
}

function Form({ f }: { f: ('W' | 'D' | 'L')[] }) {
  return (
    <span className="flex gap-0.5">
      {f.map((r, i) => (
        <span key={i} className={`h-4 w-1.5 rounded-[1px] ${r === 'W' ? 'bg-[var(--hy-pitch)]' : r === 'D' ? 'bg-[#b6c0cf]' : 'bg-[var(--hy-signal)]'}`} title={r} />
      ))}
    </span>
  );
}

function Btn({ children, kind = 'plate', className = '' }: { children: ReactNode; kind?: 'plate' | 'ghost' | 'ink' | 'pitch' | 'danger'; className?: string }) {
  const k = {
    plate: 'bg-white text-[var(--hy-ink)] hover:bg-[#dbe8ff]',
    ghost: 'border border-white/25 text-white hover:bg-white/10',
    ink: 'bg-[var(--hy-ink)] text-white hover:bg-[#1f2c45]',
    pitch: 'bg-[var(--hy-pitch)] text-white hover:bg-[#0a7550]',
    danger: 'border border-[var(--hy-signal)] text-[var(--hy-signal)] hover:bg-[var(--hy-signal)]/5',
  }[kind];
  return <a className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[15px] font-semibold transition-colors ${k} ${className}`}>{children}</a>;
}

/** Board strip: one segment per individual game, coloured by who won it. */
function Boards({ games, home, away, className = '' }: { games: typeof LIVE_GAMES; home: string; away: string; className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {games.map((g, i) => {
        const won = g.score && g.state === 'done' ? (g.score[0] > g.score[1] ? 'h' : g.score[0] < g.score[1] ? 'a' : 'd') : null;
        const bg = won === 'h' ? clan(home).colors[0] : won === 'a' ? clan(away).colors[0] : won === 'd' ? '#5b6787' : 'transparent';
        return <span key={i} className={`h-1.5 flex-1 rounded-full ${g.state === 'live' ? 'hy-pulse bg-[var(--hy-signal)]' : ''} ${!won && g.state !== 'live' ? 'ring-1 ring-white/25' : ''}`} style={won ? { background: bg } : undefined} />;
      })}
    </div>
  );
}

const tierOf = (rate: number) => (rate >= 70 ? 'hy-gold' : rate >= 62 ? 'hy-silver' : 'hy-bronze');

/** The player card. Navy body, metal frame by win rate (gold ≥70%, silver ≥62%, bronze), clan colour glow. */
function PlayerCard({ p, tag, lang, size = 'md' }: P & { p: PPlayer; tag: string; size?: 'sm' | 'md' | 'lg' }) {
  const rate = winRate(p.stats);
  const c = clan(tag);
  const S = {
    sm: { w: 'w-full max-w-[10.5rem]', rate: 'text-3xl', av: 'size-16 text-xl', name: 'text-[15px]', stat: 'text-base', pad: 'p-3' },
    md: { w: 'w-full max-w-[13rem]', rate: 'text-4xl', av: 'size-20 text-2xl', name: 'text-lg', stat: 'text-lg', pad: 'p-3.5' },
    lg: { w: 'w-full max-w-[17rem]', rate: 'text-6xl', av: 'size-28 text-4xl', name: 'text-2xl', stat: 'text-2xl', pad: 'p-5' },
  }[size];
  return (
    <div className={`hy-cut ${tierOf(rate)} ${S.w} p-[2px]`}>
      <div className="hy-cut relative overflow-hidden bg-[var(--hy-night-2)]">
        <div className="absolute inset-x-0 top-0 h-2/3 opacity-60" style={{ background: `radial-gradient(90% 80% at 50% 0%, ${c.colors[0]}, transparent 75%)` }} />
        <div className={`relative ${S.pad}`}>
          <div className="flex items-start justify-between">
            <div className="leading-none">
              <p className={`hy-num ${S.rate}`}>{Math.round(rate)}</p>
              <p className="hy-num mt-1 text-sm text-white/80">{p.position}</p>
            </div>
            <Crest tag={tag} size={size === 'lg' ? 'size-11' : 'size-8'} />
          </div>
          <div className={`mx-auto -mt-1 grid ${S.av} place-items-center rounded-full font-bold ring-2 ring-white/20`} style={{ background: `linear-gradient(160deg, hsl(${hueOf(p.username)} 45% 46%), hsl(${hueOf(p.username)} 50% 22%))` }}>
            {initials(p.name[lang])}
          </div>
          <p className={`hy-head mt-2 truncate text-center ${S.name}`}>{p.name[lang]}</p>
          <p className="text-center text-xs text-white/60">
            {flag(p.country)} {c.name[lang]}
          </p>
          <dl className="mt-3 grid grid-cols-3 border-t border-white/15 pt-2 text-center">
            {([[p.stats.matches, H.card.mp], [p.stats.wins, H.card.w], [p.stats.goals, H.card.gf]] as const).map(([v, l]) => (
              <div key={l.en}>
                <dd className={`hy-num ${S.stat}`}>{v}</dd>
                <dt className="text-[10px] text-white/60">{t(l, lang)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/** Hexagonal honour badge: the same metal tiers as player cards. */
function Medal({ place, size = 'size-12' }: { place: 1 | 2 | 3; size?: string }) {
  return (
    <span className={`hy-hex ${['', 'hy-gold', 'hy-silver', 'hy-bronze'][place]} grid ${size} shrink-0 place-items-center text-[var(--hy-ink)]`}>
      <Trophy className="size-1/2" />
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Chrome
// ════════════════════════════════════════════════════════════════════════════

type NavKey = 'home' | 'competitions' | 'live' | 'clans' | 'me' | 'admin';

function Ticker({ lang }: P) {
  const ms = MATCHES.filter((m) => m.status !== 'scheduled');
  const items = [...ms, ...ms, ...ms];
  return (
    <div className="flex h-9 items-stretch overflow-hidden border-b border-[var(--hy-line)] bg-[#070e25] text-[13px]">
      <div className="z-10 flex shrink-0 items-center ps-3 pe-2">
        <LiveTag lang={lang} />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="hy-ticker-track flex w-max items-center gap-10 px-4 py-2 whitespace-nowrap">
          {items.map((m, i) => (
            <span key={i} className="flex items-center gap-2">
              <Crest tag={m.home} size="size-4" />
              <span className="font-semibold">{clan(m.home).name[lang]}</span>
              <span className="rounded-sm bg-white px-1.5 text-[var(--hy-ink)]">{m.games && <Score v={m.games} />}</span>
              <span className="font-semibold">{m.away === 'TBD' ? '' : clan(m.away).name[lang]}</span>
              <Crest tag={m.away} size="size-4" />
              <span className={m.status === 'live' ? 'hy-num text-[#ff6b70]' : 'text-[var(--hy-mute)]'}>{m.status === 'live' ? m.minute : t(C.finished, lang)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const NAV: { key: NavKey; label: T; icon: typeof Home }[] = [
  { key: 'home', label: C.nav.home, icon: Home },
  { key: 'competitions', label: C.nav.competitions, icon: Trophy },
  { key: 'live', label: H.nav.live, icon: Radio },
  { key: 'clans', label: C.nav.clans, icon: Shield },
  { key: 'me', label: H.nav.me, icon: User },
];

function Shell({ lang, active, ticker = true, children }: P & { active: NavKey; ticker?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[4.5rem] md:pb-0">
      {ticker && <Ticker lang={lang} />}
      <header className="sticky top-0 z-30 border-b border-[var(--hy-line)] bg-[var(--hy-night)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-8 px-4 sm:px-6">
          <a className="flex items-center gap-2.5">
            <span className="hy-slant grid size-8 place-items-center bg-white">
              <span className="hy-unslant hy-num text-lg text-[var(--hy-ink)]">CA</span>
            </span>
            <span className="hy-head text-xl">{t(C.brand, lang)}</span>
          </a>
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.key} aria-current={active === n.key ? 'page' : undefined} className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-[15px] font-medium ${active === n.key ? 'text-white' : 'text-[var(--hy-mute)] hover:text-white'}`}>
                {n.key === 'live' && <span className="hy-pulse size-1.5 rounded-full bg-[var(--hy-signal)]" />}
                {t(n.label, lang)}
                {active === n.key && <span className="absolute inset-x-3 -bottom-[13px] h-[3px] bg-white" />}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <a className={`hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm md:flex ${active === 'admin' ? 'bg-white text-[var(--hy-ink)]' : 'border border-white/15 text-[var(--hy-mute)]'}`}>
              <Gauge className="size-4" /> {t(C.nav.admin, lang)}
            </a>
            <span className="text-sm text-[var(--hy-mute)]">{lang === 'ar' ? 'EN' : 'ع'}</span>
            <span className="grid size-9 place-items-center rounded-full text-sm font-bold ring-2 ring-[var(--hy-gold)]/70" style={{ background: `hsl(${hueOf(ME.username)} 45% 32%)` }}>
              {initials(ME.name[lang])}
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="hidden border-t border-[var(--hy-line)] py-6 text-center text-sm text-[var(--hy-mute)] md:block">© 2026 {t(C.brand, lang)}</footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--hy-line)] bg-[#070e25]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.key} className={`relative flex h-[4.5rem] flex-col items-center justify-center gap-1 text-[11px] ${active === n.key ? 'text-white' : 'text-[var(--hy-mute)]'}`}>
            {active === n.key && <span className="absolute inset-x-5 top-0 h-[3px] bg-white" />}
            {n.key === 'live' ? (
              <span className="hy-slant grid h-7 w-10 place-items-center bg-[var(--hy-signal)]">
                <n.icon className="hy-unslant size-4 text-white" />
              </span>
            ) : (
              <n.icon className="size-5" />
            )}
            {t(n.label, lang)}
          </a>
        ))}
      </nav>
    </div>
  );
}

const wrap = 'mx-auto max-w-[84rem] px-4 sm:px-6';

// ════════════════════════════════════════════════════════════════════════════
// Shared competition graphics
// ════════════════════════════════════════════════════════════════════════════

/** Big broadcast scoreboard. Used on home (featured) and the live match screen. */
function Scoreboard({ lang, m, size = 'md' }: P & { m: PMatch; size?: 'md' | 'lg' }) {
  const h = clan(m.home);
  const a = clan(m.away);
  const lg = size === 'lg';
  const side = (c: typeof h, tag: string, end: boolean) => (
    <div className={`flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row ${end ? 'sm:flex-row-reverse sm:text-end' : 'sm:text-start'}`}>
      <Crest tag={tag} size={lg ? 'size-16 sm:size-28' : 'size-14 sm:size-20'} />
      <div className="min-w-0">
        <p className={`hy-head ${lg ? 'text-xl sm:text-4xl' : 'text-lg sm:text-2xl'} leading-tight`}>{c.name[lang]}</p>
        <p className="hy-num text-sm tracking-[0.15em] text-white/60">{tag}</p>
      </div>
    </div>
  );
  return (
    <div className="relative overflow-hidden rounded-[10px] bg-[var(--hy-night-2)]">
      <div className="absolute inset-y-0 start-0 w-1/2 opacity-35" style={{ background: `linear-gradient(to ${lang === 'ar' ? 'left' : 'right'}, ${h.colors[0]}, transparent)` }} />
      <div className="absolute inset-y-0 end-0 w-1/2 opacity-35" style={{ background: `linear-gradient(to ${lang === 'ar' ? 'right' : 'left'}, ${a.colors[0]}, transparent)` }} />
      <div className={`relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6 ${lg ? 'px-4 py-8 sm:px-10 sm:py-12' : 'px-4 py-6 sm:px-6'}`}>
        {side(h, m.home, false)}
        <div className="flex flex-col items-center gap-2">
          {m.status === 'live' && <LiveTag lang={lang} minute={m.minute} size={lg ? 'md' : 'sm'} />}
          <div className="hy-slant bg-white px-4 py-1 sm:px-6">
            <Score v={m.games!} className={`hy-unslant text-[var(--hy-ink)] ${lg ? 'text-4xl sm:text-8xl' : 'text-4xl sm:text-6xl'}`} />
          </div>
          <p className="text-xs text-white/70">{t(H.live.games, lang)}</p>
        </div>
        {side(a, m.away, true)}
      </div>
      <div className="relative border-t border-white/10 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span className="hy-num text-sm text-white/70">{m.score?.[0]}</span>
          <Boards games={LIVE_GAMES} home={m.home} away={m.away} className="flex-1" />
          <span className="hy-num text-sm text-white/70">{m.score?.[1]}</span>
        </div>
      </div>
    </div>
  );
}

/** Compact fixture row, used on sheets. */
function FixtureRow({ lang, m }: P & { m: PMatch }) {
  const away = m.away === 'TBD' ? null : clan(m.away);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-center gap-2 py-3">
      <span className="flex min-w-0 items-center justify-end gap-2 text-end">
        <span className="truncate font-semibold">{clan(m.home).name[lang]}</span>
        <Crest tag={m.home} size="size-7" />
      </span>
      <span className="text-center">
        {m.games ? (
          <span className={`inline-block rounded px-2 py-0.5 text-lg ${m.status === 'live' ? 'bg-[var(--hy-signal)] text-white' : 'bg-[var(--hy-mist)]'}`}>
            <Score v={m.games} />
          </span>
        ) : (
          <span className="hy-num text-lg">{fmtDate(m.time, lang, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        )}
        <span className="block text-[11px] text-[var(--hy-ink-2)]">{m.status === 'live' ? m.minute : fmtDate(m.time, lang, { day: 'numeric', month: 'short' })}</span>
      </span>
      <span className="flex min-w-0 items-center gap-2">
        {away ? <Crest tag={m.away} size="size-7" /> : <span className="grid size-7 place-items-center rounded-full bg-[var(--hy-mist)] text-xs">?</span>}
        <span className="truncate font-semibold">{away ? away.name[lang] : t(C.tour.tbd, lang)}</span>
      </span>
    </li>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. Home
// ════════════════════════════════════════════════════════════════════════════

export function HybridHome({ lang }: P) {
  const table = [...CLANS].sort((a, b) => pts(b.record) - pts(a.record)).slice(0, 6);
  return (
    <Shell lang={lang} active="home">
      {/* Stage: the competition is the hero */}
      <section className="hy-floodlight border-b border-[var(--hy-line)]">
        <div className={`${wrap} grid items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-16`}>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--hy-sky)]">
              <span className="size-1.5 rounded-full bg-[var(--hy-sky)]" />
              {t(C.home.kicker, lang)}
            </p>
            <h1 className={`hy-display mt-4 ${lang === 'ar' ? 'text-[2.4rem] sm:text-6xl' : 'text-6xl sm:text-[5.5rem]'}`}>{t(C.home.title, lang)}</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--hy-mute)]">{t(C.home.subtitle, lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn>{t(C.home.ctaJoin, lang)}</Btn>
              <Btn kind="ghost">{t(C.home.ctaWatch, lang)}</Btn>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold">{t(H.home.featured, lang)}</span>
              <span className="text-[var(--hy-mute)]">
                {t(TOURNAMENT.name, lang)} · {t(LIVE.round, lang)}
              </span>
            </div>
            <Scoreboard lang={lang} m={LIVE} />
            <a className="mt-3 flex items-center justify-end gap-1 text-sm font-semibold text-[var(--hy-sky)]">
              {t(H.home.watch, lang)}
              {lang === 'ar' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </a>
          </div>
        </div>
      </section>

      {/* Sheets: the information layer */}
      <section className={`${wrap} grid gap-6 py-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]`}>
        <Sheet className="p-5 sm:p-6">
          <Heading tone="sheet" aside={<a className="font-semibold text-[var(--hy-ink)] underline underline-offset-4">{t(H.home.fullTable, lang)}</a>}>
            {t(H.home.league, lang)}
          </Heading>
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-[var(--hy-rule)] text-xs text-[var(--hy-ink-2)]">
                <th className="w-8 py-2 text-start font-medium">#</th>
                <th className="text-start font-medium">{t(C.nav.clans, lang)}</th>
                <th className="w-10 text-center font-medium">{t(C.clan.played, lang)}</th>
                <th className="hidden w-12 text-center font-medium sm:table-cell">{t(C.clan.gd, lang)}</th>
                <th className="hidden w-20 font-medium sm:table-cell">{t(C.clan.form, lang)}</th>
                <th className="w-12 text-center font-medium">{t(C.clan.pts, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {table.map((c, i) => (
                <tr key={c.tag} className="border-b border-[var(--hy-rule)] last:border-0">
                  <td className="hy-num py-3 text-lg text-[var(--hy-ink-2)]">{i + 1}</td>
                  <td>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Crest tag={c.tag} size="size-7" />
                      <span className="truncate font-semibold">{c.name[lang]}</span>
                    </span>
                  </td>
                  <td className="hy-num text-center">{c.record.p}</td>
                  <td className="hy-num hidden text-center sm:table-cell">+{c.record.gf - c.record.ga}</td>
                  <td className="hidden sm:table-cell">
                    <Form f={c.form} />
                  </td>
                  <td className="hy-num text-center text-xl">{pts(c.record)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
        <Sheet className="p-5 sm:p-6">
          <Heading tone="sheet">{t(C.home.upcoming, lang)}</Heading>
          <ul className="divide-y divide-[var(--hy-rule)]">
            {MATCHES.filter((m) => m.id !== 'f').slice(0, 5).map((m) => (
              <FixtureRow key={m.id} lang={lang} m={m} />
            ))}
          </ul>
        </Sheet>
      </section>

      {/* Cards: players */}
      <section className={`${wrap} pb-12`}>
        <Heading>{t(H.home.topPlayers, lang)}</Heading>
        <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-4">
          {TOP_PLAYERS.map(({ p, clan: tag }) => (
            <PlayerCard key={p.username} p={p} tag={tag} lang={lang} />
          ))}
        </div>
      </section>

      <section className={`${wrap} pb-16`}>
        <Heading>{t(H.home.competitions, lang)}</Heading>
        <ul className="grid gap-3 md:grid-cols-3">
          {COMPETITIONS.map((c) => (
            <li key={c.id} className="flex items-center gap-4 rounded-[10px] border border-[var(--hy-line)] bg-[var(--hy-night-2)] p-4">
              <span className={`hy-hex grid size-12 shrink-0 place-items-center ${c.state === 'live' ? 'hy-gold text-[var(--hy-ink)]' : 'bg-[var(--hy-night-3)] text-[var(--hy-mute)]'}`}>
                <Trophy className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name[lang]}</p>
                <p className="truncate text-sm text-[var(--hy-mute)]">
                  {c.kind[lang]} · <span className="hy-num">{c.teams}</span> {t(H.home.teams, lang)}
                </p>
                <p className="mt-1 text-sm">{c.detail[lang]}</p>
              </div>
              {c.state === 'live' ? <LiveTag lang={lang} /> : c.state === 'open' ? <span className="rounded bg-[var(--hy-pitch)] px-2 py-0.5 text-xs font-semibold">{t(H.home.open, lang)}</span> : <span className="text-xs text-[var(--hy-mute)]">{t(H.home.soon, lang)}</span>}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. Player profile
// ════════════════════════════════════════════════════════════════════════════

export function HybridProfile({ lang }: P) {
  const s = ME.stats;
  const c = clan('NILE');
  const next = MATCHES.find((m) => m.id === 'l1')!;
  const seg = (n: number) => `${(n / s.matches) * 100}%`;
  return (
    <Shell lang={lang} active="me">
      <section className="hy-floodlight border-b border-[var(--hy-line)]">
        <div className={`${wrap} grid items-center gap-8 py-10 md:grid-cols-[auto_minmax(0,1fr)] lg:gap-14 lg:py-14`}>
          <div className="flex justify-center">
            <PlayerCard p={ME} tag="NILE" lang={lang} size="lg" />
          </div>
          <div>
            <p className="hy-num text-[var(--hy-mute)]">@{ME.username}</p>
            <h1 className={`hy-display mt-1 ${lang === 'ar' ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-8xl'}`}>{ME.name[lang]}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
              <span className="flex items-center gap-2">
                <Crest tag="NILE" size="size-6" /> {c.name[lang]} · {t(C.clan.roles.co_leader, lang)}
              </span>
              <span>
                {flag(ME.country)} {countryName(ME.country, lang)}
              </span>
              <span>
                {t(C.dash.position, lang)} <span className="hy-num">{ME.position}</span>
              </span>
            </div>
            {/* Game ID verification is its own, honest state — never self-declared. */}
            <div className="mt-6 flex max-w-xl flex-wrap items-center gap-3 rounded-[10px] border border-dashed border-white/25 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--hy-mute)]">{t(C.dash.gameId, lang)}</p>
                <p className="hy-num text-xl tracking-wider">{ME.gameId}</p>
                <p className="mt-1 text-xs text-[var(--hy-mute)]">{t(H.profile.pendingNote, lang)}</p>
              </div>
              <span className="rounded-full border border-[var(--hy-gold)]/60 px-3 py-1 text-xs font-semibold text-[var(--hy-gold)]">{t(H.profile.pending, lang)}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Btn>{t(H.profile.viewClan, lang)}</Btn>
              <Btn kind="ghost">
                <Share2 className="size-4" /> {t(H.profile.share, lang)}
              </Btn>
            </div>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-10`}>
        <Sheet className="p-5 sm:p-7">
          <Heading tone="sheet" aside={t(H.profile.rating, lang)}>
            {t(H.profile.stats, lang)}
          </Heading>
          <dl className="grid grid-cols-3 gap-y-5 sm:grid-cols-6 sm:divide-x sm:divide-[var(--hy-rule)] sm:rtl:divide-x-reverse">
            {(
              [
                [s.matches, C.dash.matches],
                [`${winRate(s)}%`, C.dash.winRate],
                [s.wins, H.profile.wins],
                [s.draws, H.profile.draws],
                [s.losses, H.profile.losses],
                [s.goals, C.dash.goals],
              ] as const
            ).map(([v, l], i) => (
              <div key={i} className="sm:px-5 sm:first:ps-0">
                <dd className={`hy-num text-4xl sm:text-5xl ${i === 1 ? 'text-[var(--hy-pitch)]' : ''}`}>{v}</dd>
                <dt className="mt-1 text-sm text-[var(--hy-ink-2)]">{t(l, lang)}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full">
            <span style={{ width: seg(s.wins) }} className="bg-[var(--hy-pitch)]" />
            <span style={{ width: seg(s.draws) }} className="bg-[#b6c0cf]" />
            <span style={{ width: seg(s.losses) }} className="bg-[var(--hy-signal)]" />
          </div>
        </Sheet>
      </section>

      <section className={`${wrap} grid gap-6 pb-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]`}>
        <Sheet className="p-5 sm:p-6">
          <Heading tone="sheet">{t(H.profile.results, lang)}</Heading>
          <ul className="divide-y divide-[var(--hy-rule)]">
            {MY_RESULTS.map((r, i) => {
              const res = r.score[0] > r.score[1] ? 'W' : r.score[0] < r.score[1] ? 'L' : 'D';
              return (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className={`hy-num grid size-8 shrink-0 place-items-center rounded text-sm text-white ${res === 'W' ? 'bg-[var(--hy-pitch)]' : res === 'L' ? 'bg-[var(--hy-signal)]' : 'bg-[#8a96aa]'}`}>{res}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      <Crest tag={r.oppClan} size="size-5" />
                      <span className="truncate">{r.opp[lang]}</span>
                    </p>
                    <p className="truncate text-xs text-[var(--hy-ink-2)]">
                      {r.comp[lang]} · {fmtDate(r.date, lang)}
                    </p>
                  </div>
                  <Score v={r.score} className="text-2xl" />
                </li>
              );
            })}
          </ul>
        </Sheet>
        <div className="flex flex-col gap-8">
          <div>
            <Heading>{t(C.dash.nextMatch, lang)}</Heading>
            <div className="rounded-[10px] bg-[var(--hy-night-2)] p-5">
              <p className="text-sm text-[var(--hy-mute)]">{t(next.round, lang)}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Crest tag="NILE" size="size-10" />
                  <span className="hy-head truncate text-lg">{clan('NILE').name[lang]}</span>
                </span>
                <span className="hy-num shrink-0 rounded bg-white px-2 text-xl text-[var(--hy-ink)]">{fmtDate(next.time, lang, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="hy-head truncate text-lg">{clan('ATL').name[lang]}</span>
                  <Crest tag="ATL" size="size-10" />
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--hy-mute)]">{fmtDate(next.time, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div>
            <Heading>{t(C.dash.achievements, lang)}</Heading>
            <ul className="flex flex-col gap-2">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.date} className="flex items-center gap-3 rounded-[10px] bg-[var(--hy-night-2)] p-3">
                  <Medal place={a.place} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.title[lang]}</p>
                    <p className="text-sm text-[var(--hy-mute)]">
                      {C.dash.places[lang][a.place]} · {fmtDate(a.date, lang, { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. Clan profile
// ════════════════════════════════════════════════════════════════════════════

export function HybridClan({ lang }: P) {
  const c = clan('NILE');
  const r = c.record;
  const leaders = ROSTER.filter((p) => p.role !== 'member');
  const squad = ROSTER.filter((p) => p.role === 'member');
  const results = MATCHES.filter((m) => m.home === 'NILE' || m.away === 'NILE');
  return (
    <Shell lang={lang} active="clans">
      {/* Kit band: the clan's own colours own the hero */}
      <section className="relative overflow-hidden border-b border-[var(--hy-line)]" style={{ background: `linear-gradient(${lang === 'ar' ? '250deg' : '110deg'}, ${c.colors[0]} 0%, var(--hy-night) 62%)` }}>
        <div className="hy-slant absolute -end-16 inset-y-0 hidden w-40 opacity-90 md:block" style={{ background: c.colors[1] }} />
        <div className="hy-slant absolute end-28 inset-y-0 hidden w-6 opacity-50 md:block" style={{ background: c.colors[1] }} />
        <div className="absolute inset-x-0 bottom-0 h-1.5 md:hidden" style={{ background: c.colors[1] }} />
        <div className={`${wrap} relative flex flex-col gap-6 py-10 sm:flex-row sm:items-center lg:py-14`}>
          <Crest tag="NILE" shape="hex" size="size-28 sm:size-40" />
          <div className="min-w-0 flex-1">
            <p className="hy-num tracking-[0.3em] text-white/75">{c.tag}</p>
            <h1 className={`hy-display ${lang === 'ar' ? 'text-5xl sm:text-7xl' : 'text-6xl sm:text-8xl'}`}>{c.name[lang]}</h1>
            <p className="mt-3 text-white/80">
              {flag(c.country)} {countryName(c.country, lang)} · {t(C.clan.founded, lang)} {fmtDate(c.founded, lang, { month: 'long', year: 'numeric' })} · <span className="hy-num">{c.members}</span> {t(C.clan.members, lang)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Btn>{t(C.clan.join, lang)}</Btn>
              <Btn kind="ghost">{t(C.clan.contact, lang)}</Btn>
            </div>
          </div>
        </div>
      </section>

      <section className={`${wrap} -mt-px py-8`}>
        <Sheet className="grid grid-cols-3 gap-y-5 p-5 sm:grid-cols-7 sm:p-6">
          {(
            [
              [r.p, C.clan.played],
              [r.w, C.clan.won],
              [r.d, C.clan.drawn],
              [r.l, C.clan.lost],
              [`+${r.gf - r.ga}`, C.clan.gd],
              [`${Math.round((r.w / r.p) * 100)}%`, C.clan.winRate],
              [c.trophies, C.clan.trophies],
            ] as const
          ).map(([v, l], i) => (
            <div key={i} className="text-center">
              <p className={`hy-num text-4xl ${i === 6 ? 'text-[#a87b10]' : ''}`}>{v}</p>
              <p className="text-sm text-[var(--hy-ink-2)]">{t(l, lang)}</p>
            </div>
          ))}
        </Sheet>
      </section>

      <section className={`${wrap} pb-12`}>
        <Heading aside={<Form f={c.form} />}>{t(C.clan.roster, lang)}</Heading>
        <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...leaders, ...squad].map((p) => (
            <div key={p.username} className="flex w-full flex-col items-center gap-2">
              <PlayerCard p={p} tag="NILE" lang={lang} size="sm" />
              <span className={`text-xs ${p.role === 'leader' ? 'font-semibold text-[var(--hy-gold)]' : p.role === 'co_leader' ? 'text-[var(--hy-sky)]' : 'text-[var(--hy-mute)]'}`}>{t(C.clan.roles[p.role], lang)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${wrap} grid gap-6 pb-16 lg:grid-cols-2`}>
        <Sheet className="p-5 sm:p-6">
          <Heading tone="sheet">{t(H.clan.results, lang)}</Heading>
          <ul className="divide-y divide-[var(--hy-rule)]">
            {results.map((m) => (
              <FixtureRow key={m.id} lang={lang} m={m} />
            ))}
          </ul>
        </Sheet>
        <div className="flex flex-col gap-8">
          <div>
            <Heading>{t(C.clan.history, lang)}</Heading>
            <ul className="flex flex-col gap-2">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.date} className="flex items-center gap-3 rounded-[10px] bg-[var(--hy-night-2)] p-3">
                  <Medal place={a.place} size="size-10" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{a.title[lang]}</span>
                  <span className="text-sm text-[var(--hy-mute)]">{C.dash.places[lang][a.place]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Heading>{t(C.clan.about, lang)}</Heading>
            <p className="max-w-prose text-lg leading-relaxed text-[#d5ddf0]">{t(C.clan.description, lang)}</p>
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. Tournament + knockout bracket
// ════════════════════════════════════════════════════════════════════════════

function BracketTie({ lang, m }: P & { m: (typeof TOURNAMENT.bracket.semis)[number] }) {
  const done = m.status === 'finished';
  const row = (tag: string, g: number, lead: boolean) => (
    <div className={`flex items-center gap-3 px-4 py-3 ${lead ? '' : 'text-white/60'}`}>
      <Crest tag={tag} size="size-8" />
      <span className={`min-w-0 flex-1 truncate ${lead ? 'font-semibold' : ''}`}>{clan(tag).name[lang]}</span>
      <span className={`hy-num w-8 rounded text-center text-xl ${lead && done ? 'bg-white text-[var(--hy-ink)]' : ''}`}>{g}</span>
    </div>
  );
  return (
    <div className={`overflow-hidden rounded-[10px] bg-[var(--hy-night-2)] ${m.status === 'live' ? 'ring-2 ring-[var(--hy-signal)]' : 'ring-1 ring-[var(--hy-line)]'}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5 text-xs text-[var(--hy-mute)]">
        <span>{t(C.tour.semi, lang)}</span>
        {m.status === 'live' ? <LiveTag lang={lang} minute={m.minute} /> : <span>{t(C.finished, lang)}</span>}
      </div>
      {row(m.home, m.games[0], m.games[0] >= m.games[1])}
      <div className="h-px bg-white/10" />
      {row(m.away, m.games[1], m.games[1] > m.games[0])}
    </div>
  );
}

export function HybridTournament({ lang }: P) {
  const [sf1, sf2] = TOURNAMENT.bracket.semis;
  return (
    <Shell lang={lang} active="competitions">
      <section className="hy-floodlight border-b border-[var(--hy-line)]">
        <div className={`${wrap} py-10 lg:py-12`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="hy-hex hy-gold grid size-24 shrink-0 place-items-center text-[var(--hy-ink)]">
              <Trophy className="size-10" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-sm text-[var(--hy-mute)]">
                <LiveTag lang={lang} />
                {t(TOURNAMENT.season, lang)} · {t(TOURNAMENT.organizer, lang)}
              </div>
              <h1 className={`hy-display mt-2 ${lang === 'ar' ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-8xl'}`}>{t(TOURNAMENT.name, lang)}</h1>
            </div>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-y-4 border-t border-white/10 pt-6 sm:grid-cols-4">
            {(
              [
                [C.tour.format, t(TOURNAMENT.format, lang)],
                [C.tour.dates, t(TOURNAMENT.dates, lang)],
                [C.tour.participants, String(TOURNAMENT.participants)],
                [H.admin.status, t(H.tour.status, lang)],
              ] as const
            ).map(([l, v], i) => (
              <div key={i} className="pe-4">
                <dt className="text-xs text-[var(--hy-mute)]">{t(l, lang)}</dt>
                <dd className="mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <nav className={`${wrap} flex gap-6 overflow-x-auto`}>
          {[C.tour.bracket, C.tour.groups, H.tour.fixtures, C.tour.overview].map((x, i) => (
            <a key={i} className={`shrink-0 border-b-[3px] pb-3 font-semibold ${i === 0 ? 'border-white text-white' : 'border-transparent text-[var(--hy-mute)]'}`}>
              {t(x, lang)}
            </a>
          ))}
        </nav>
      </section>

      {/* Bracket on stage */}
      <section className={`${wrap} py-12`}>
        <Heading>{t(C.tour.bracket, lang)}</Heading>
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)_minmax(0,0.7fr)] lg:gap-0">
          <div className="flex flex-col gap-6 lg:gap-16">
            <BracketTie lang={lang} m={sf1!} />
            <BracketTie lang={lang} m={sf2!} />
          </div>
          {/* connector */}
          <div className="relative hidden h-full lg:block" aria-hidden>
            <div className="absolute inset-y-[24%] start-0 w-1/2 border-y-2 border-e-2 border-white/25 rtl:border-e-2" />
            <div className="absolute start-1/2 top-1/2 h-0.5 w-1/2 bg-white/25" />
          </div>
          <div className="hy-gold rounded-[12px] p-[2px]">
            <div className="rounded-[10px] bg-[var(--hy-night-2)] p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="hy-head text-2xl">{t(C.tour.final, lang)}</span>
                <span className="text-[var(--hy-mute)]">{fmtDate(TOURNAMENT.bracket.final.time, lang, { day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-md bg-[var(--hy-night-3)] p-3">
                  <Crest tag="CEG" size="size-10" />
                  <span className="hy-head text-lg">{clan('CEG').name[lang]}</span>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-dashed border-white/25 p-3 text-[var(--hy-mute)]">
                  <span className="flex -space-x-2 rtl:space-x-reverse">
                    <Crest tag="NILE" size="size-8" />
                    <Crest tag="GST" size="size-8" />
                  </span>
                  <span className="text-sm">
                    {t(H.tour.winner, lang)} {clan('NILE').name[lang]} / {clan('GST').name[lang]}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center lg:ps-6">
            <span className="hy-hex grid size-20 place-items-center bg-[var(--hy-night-3)] text-[var(--hy-gold)]">
              <Trophy className="size-9" />
            </span>
            <span className="hy-head text-lg">{t(H.tour.champion, lang)}</span>
            <span className="text-sm text-[var(--hy-mute)]">{t(C.tour.tbd, lang)}</span>
          </div>
        </div>
      </section>

      {/* Groups on sheets */}
      <section className={`${wrap} pb-12`}>
        <Heading aside={t(C.tour.qualify, lang)}>{t(C.tour.groups, lang)}</Heading>
        <div className="grid gap-6 md:grid-cols-2">
          {TOURNAMENT.groups.map((g) => (
            <Sheet key={g.name.en} className="p-5">
              <h3 className="hy-head mb-2 text-xl">{g.name[lang]}</h3>
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b border-[var(--hy-rule)] text-xs text-[var(--hy-ink-2)]">
                    <th className="w-7 py-2 text-start font-medium">#</th>
                    <th className="text-start font-medium">{t(C.nav.clans, lang)}</th>
                    {[C.clan.played, C.clan.won, C.clan.drawn, C.clan.lost, C.clan.gd, C.clan.pts].map((h, i) => (
                      <th key={i} className={`w-9 text-center font-medium ${i > 0 && i < 4 ? 'hidden sm:table-cell' : ''}`}>
                        {t(h, lang)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r, i) => (
                    <tr key={r.tag} className="border-b border-[var(--hy-rule)] last:border-0">
                      <td className="py-2.5">
                        <span className={`hy-num grid size-6 place-items-center rounded text-sm ${i < 2 ? 'bg-[var(--hy-pitch)] text-white' : 'text-[var(--hy-ink-2)]'}`}>{i + 1}</span>
                      </td>
                      <td>
                        <span className="flex min-w-0 items-center gap-2">
                          <Crest tag={r.tag} size="size-6" />
                          <span className="truncate font-semibold">{clan(r.tag).name[lang]}</span>
                        </span>
                      </td>
                      <td className="hy-num text-center">{r.p}</td>
                      <td className="hy-num hidden text-center sm:table-cell">{r.w}</td>
                      <td className="hy-num hidden text-center sm:table-cell">{r.d}</td>
                      <td className="hy-num hidden text-center sm:table-cell">{r.l}</td>
                      <td className="hy-num text-center">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td className="hy-num text-center text-lg">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Sheet>
          ))}
        </div>
      </section>

      <section className={`${wrap} pb-16`}>
        <Sheet className="p-5 sm:p-6">
          <Heading tone="sheet">{t(H.tour.fixtures, lang)}</Heading>
          <ul className="divide-y divide-[var(--hy-rule)]">
            {MATCHES.filter((m) => m.id !== 'l1').map((m) => (
              <FixtureRow key={m.id} lang={lang} m={m} />
            ))}
          </ul>
        </Sheet>
      </section>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. Live match centre
// ════════════════════════════════════════════════════════════════════════════

export function HybridLive({ lang }: P) {
  const name = (u: string) => ROSTER.find((r) => r.username === u)?.name[lang] ?? OPPONENTS[u]?.[lang] ?? u;
  return (
    <Shell lang={lang} active="live">
      <section className="hy-pitchlines border-b border-[var(--hy-line)]">
        <div className={`${wrap} py-8 lg:py-10`}>
          <p className="mb-4 flex flex-wrap items-center gap-x-2 text-sm text-[var(--hy-mute)]">
            <Trophy className="size-4 text-[var(--hy-gold)]" />
            {t(TOURNAMENT.name, lang)} · {t(LIVE.round, lang)} · {fmtDate(LIVE.time, lang, { day: 'numeric', month: 'long' })}
          </p>
          <Scoreboard lang={lang} m={LIVE} size="lg" />
          <p className="mt-4 text-center text-sm">
            <span className="text-[var(--hy-mute)]">{t(H.live.goals, lang)}: </span>
            <Score v={LIVE.score!} className="font-bold" />
            <span className="mx-2 text-[var(--hy-mute)]">·</span>
            <span className="font-semibold">{t(H.live.needs, lang)}</span>
          </p>
        </div>
      </section>

      <section className={`${wrap} grid gap-6 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]`}>
        <div>
          <Heading>{t(H.live.boards, lang)}</Heading>
          <ol className="flex flex-col gap-2">
            {LIVE_GAMES.map((g, i) => {
              const live = g.state === 'live';
              const hw = g.score && g.score[0] > g.score[1];
              const aw = g.score && g.score[1] > g.score[0];
              return (
                <li key={i} className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[10px] bg-[var(--hy-night-2)] px-3 py-3 sm:gap-4 sm:px-4 ${live ? 'ring-2 ring-[var(--hy-signal)]' : ''}`}>
                  <span className="hy-num grid size-9 place-items-center rounded-md bg-[var(--hy-night-3)] text-lg">{i + 1}</span>
                  <span className={`flex min-w-0 items-center justify-end gap-2 text-end ${!hw && !live ? 'text-white/65' : 'font-semibold'}`}>
                    <span className="truncate">{name(g.home)}</span>
                    <span className="hidden sm:block"><Crest tag="NILE" size="size-6" /></span>
                  </span>
                  <span className="flex flex-col items-center">
                    <span className={`hy-slant px-3 ${live ? 'bg-[var(--hy-signal)]' : 'bg-white'}`}>
                      <Score v={g.score!} className={`hy-unslant text-2xl ${live ? 'text-white' : 'text-[var(--hy-ink)]'}`} />
                    </span>
                    <span className={`mt-1 text-[11px] ${live ? 'text-[#ff8a8e]' : 'text-[var(--hy-mute)]'}`}>{live ? t(H.live.playing, lang) : t(H.live.done, lang)}</span>
                  </span>
                  <span className={`flex min-w-0 items-center gap-2 ${!aw && !live ? 'text-white/65' : 'font-semibold'}`}>
                    <span className="hidden sm:block"><Crest tag="GST" size="size-6" /></span>
                    <span className="truncate">{name(g.away)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-col gap-6">
          <Sheet className="p-5 sm:p-6">
            <Heading tone="sheet" as="h3">
              {t(H.live.rules, lang)}
            </Heading>
            <dl className="flex flex-col gap-4 text-[15px]">
              {(
                [
                  [H.live.format, t(H.live.formatV, lang)],
                  [H.live.tie, t(H.live.tieV, lang)],
                  [H.live.referee, '@mod_hala'],
                ] as const
              ).map(([l, v], i) => (
                <div key={i} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
                  <dt className="text-[var(--hy-ink-2)]">{t(l, lang)}</dt>
                  <dd className={i === 2 ? 'hy-num font-semibold' : 'font-medium'}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-md bg-[var(--hy-mist)] p-3 text-sm text-[var(--hy-ink-2)]">{t(H.live.report, lang)}</p>
          </Sheet>
          <div>
            <Heading>{t(H.live.other, lang)}</Heading>
            <ul className="flex flex-col gap-2">
              {MATCHES.filter((m) => m.id !== 'sf1' && m.games).map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-[10px] bg-[var(--hy-night-2)] px-4 py-3 text-sm">
                  <Crest tag={m.home} size="size-6" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{clan(m.home).name[lang]}</span>
                  <span className="rounded bg-white px-1.5 text-[var(--hy-ink)]">
                    <Score v={m.games!} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-end font-semibold">{clan(m.away).name[lang]}</span>
                  <Crest tag={m.away} size="size-6" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. Admin — the stage shrinks to a status band; work happens on paper
// ════════════════════════════════════════════════════════════════════════════

export function HybridAdmin({ lang }: P) {
  const sel = ADMIN.queue[0]!;
  const check = (ok: boolean, yes: T, no: T) => (
    <li className={`flex items-center gap-2 text-sm font-medium ${ok ? 'text-[var(--hy-pitch)]' : 'text-[var(--hy-signal)]'}`}>
      <span className={`grid size-5 place-items-center rounded-full text-white ${ok ? 'bg-[var(--hy-pitch)]' : 'bg-[var(--hy-signal)]'}`}>{ok ? <Check className="size-3" /> : <X className="size-3" />}</span>
      {t(ok ? yes : no, lang)}
    </li>
  );
  const allOk = (a: (typeof ADMIN.queue)[number]) => a.checks.name && a.checks.tag && a.checks.free;
  return (
    <Shell lang={lang} active="admin" ticker={false}>
      <section className="border-b border-[var(--hy-line)]">
        <div className={`${wrap} flex flex-col gap-6 py-8 lg:flex-row lg:items-end lg:justify-between`}>
          <h1 className={`hy-display ${lang === 'ar' ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl'}`}>{t(C.admin.title, lang)}</h1>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {(
              [
                [ADMIN.stats.pending, C.admin.pending, 'text-white'],
                [ADMIN.stats.openDisputes, C.admin.disputes, 'text-[#ff7a7f]'],
                [ADMIN.stats.liveMatches, C.admin.liveMatches, 'text-[var(--hy-pitch-bright)]'],
                [ADMIN.stats.clans, C.admin.clans, 'text-white'],
              ] as const
            ).map(([v, l, cls], i) => (
              <div key={i}>
                <dd className={`hy-num text-4xl ${cls}`}>{fmtNum(v, lang)}</dd>
                <dt className="text-xs text-[var(--hy-mute)]">{t(l, lang)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="bg-[var(--hy-mist)] text-[var(--hy-ink)]">
        <div className={`${wrap} grid gap-6 py-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]`}>
          <Sheet className="p-2 sm:p-3">
            <div className="px-3 pb-2 pt-3">
              <Heading tone="sheet" as="h2">
                {t(C.admin.queue, lang)}
              </Heading>
            </div>
            <ul>
              {ADMIN.queue.map((a, i) => (
                <li key={a.id} className={`flex items-center gap-3 rounded-md px-3 py-3 ${i === 0 ? 'bg-[var(--hy-mist)] shadow-[inset_3px_0_0_var(--hy-ink)] rtl:shadow-[inset_-3px_0_0_var(--hy-ink)]' : ''}`}>
                  <Emblem kind={a.emblem} colors={a.colors} shape="shield" className="size-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {a.name[lang]} <span className="hy-num text-xs text-[var(--hy-ink-2)]">{a.tag}</span>
                    </p>
                    <p className="truncate text-xs text-[var(--hy-ink-2)]">
                      {a.applicant[lang]} · {fmtDate(a.submitted, lang, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${allOk(a) ? 'bg-[#dcf3e9] text-[var(--hy-pitch)]' : 'bg-[#fde3e4] text-[#b30f15]'}`}>{t(allOk(a) ? H.admin.checksOk : H.admin.checksFail, lang)}</span>
                </li>
              ))}
            </ul>
          </Sheet>

          <Sheet className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Emblem kind={sel.emblem} colors={sel.colors} shape="shield" className="size-20 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-[var(--hy-ink-2)]">{t(C.admin.reviewing, lang)}</p>
                <h2 className="hy-display text-4xl">{sel.name[lang]}</h2>
                <p className="hy-num tracking-[0.2em] text-[var(--hy-ink-2)]">{sel.tag}</p>
              </div>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-[var(--hy-rule)] py-4">
              {check(sel.checks.name, C.admin.checks.name, C.admin.checks.nameTaken)}
              {check(sel.checks.tag, C.admin.checks.tag, C.admin.checks.tagTaken)}
              {check(sel.checks.free, C.admin.checks.free, C.admin.checks.busy)}
            </ul>
            <dl className="mt-5 grid gap-5 text-[15px] sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-6">
              <dt className="text-[var(--hy-ink-2)]">{t(C.admin.descriptionLabel, lang)}</dt>
              <dd className="-mt-4 leading-relaxed sm:mt-0">{t(ADMIN.description, lang)}</dd>
              <dt className="text-[var(--hy-ink-2)]">{t(C.admin.contact, lang)}</dt>
              <dd className="-mt-4 sm:mt-0">
                <a className="hy-num font-medium text-[#1356b8] underline underline-offset-4">{ADMIN.contact}</a>
              </dd>
              <dt className="text-[var(--hy-ink-2)]">{t(C.admin.applicant, lang)}</dt>
              <dd className="-mt-4 sm:mt-0">
                {sel.applicant[lang]} <span className="hy-num text-[var(--hy-ink-2)]">@{sel.username}</span> · {flag(sel.country)} {countryName(sel.country, lang)}
              </dd>
            </dl>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Btn kind="pitch" className="flex-1">
                {t(C.admin.approve, lang)}
              </Btn>
              <Btn kind="danger" className="flex-1">
                {t(C.admin.reject, lang)}
              </Btn>
            </div>
          </Sheet>
        </div>

        <div className={`${wrap} pb-14`}>
          <Sheet className="p-5 sm:p-6">
            <Heading tone="sheet">{t(C.admin.recent, lang)}</Heading>
            <table className="w-full text-[15px]">
              <tbody>
                {ADMIN.decisions.map((d, i) => (
                  <tr key={i} className="border-b border-[var(--hy-rule)] last:border-0">
                    <td className="py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${d.action === 'approve' ? 'bg-[#dcf3e9] text-[var(--hy-pitch)]' : 'bg-[#fde3e4] text-[#b30f15]'}`}>{t(d.action === 'approve' ? C.admin.approved : C.admin.rejected, lang)}</span>
                    </td>
                    <td className="font-semibold">{d.target[lang]}</td>
                    <td className="hy-num hidden text-[var(--hy-ink-2)] sm:table-cell">@{d.who}</td>
                    <td className="text-end text-sm text-[var(--hy-ink-2)]">{fmtDate(d.at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sheet>
        </div>
      </div>
    </Shell>
  );
}

export const HYBRID_SCREENS = ['home', 'profile', 'clan', 'tournament', 'live', 'admin'] as const;
export type HybridScreen = (typeof HYBRID_SCREENS)[number];
export const HYBRID: Record<HybridScreen, (p: P) => ReactNode> = {
  home: HybridHome,
  profile: HybridProfile,
  clan: HybridClan,
  tournament: HybridTournament,
  live: HybridLive,
  admin: HybridAdmin,
};
