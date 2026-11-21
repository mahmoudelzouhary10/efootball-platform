/* DESIGN PREVIEW ONLY — Concept B: Federation (light, editorial, official). */
import { ArrowUpRight, Check, Clock, Menu, Search, ShieldCheck, Trophy, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { C, countryName, flag, fmtDate, fmtNum } from '../copy';
import { ACHIEVEMENTS, ADMIN, CLANS, clan, LIVE_GAMES, type Lang, MATCHES, ME, type PClan, ROSTER, TOURNAMENT, winRate } from '../data';
import { Emblem, initials } from '../emblem';

type P = { lang: Lang };
const t = <T extends { ar: string; en: string }>(n: T, lang: Lang) => n[lang];
const pts = (c: PClan) => c.record.w * 3 + c.record.d;

// ── chrome ──────────────────────────────────────────────────────────────────

const SECTIONS = ['home', 'competitions', 'clans', 'players', 'dashboard', 'admin'] as const;

export function FederationShell({ lang, active, children }: P & { active: (typeof SECTIONS)[number]; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-[var(--fd-paper)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Emblem kind="star" colors={['#0b6e4f', '#ffffff']} shape="circle" className="size-9" />
            <span className="fd-display text-xl">{t(C.brand, lang)}</span>
          </div>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <a key={s} className={`rounded-full px-3.5 py-1.5 text-[15px] ${active === s ? 'bg-[var(--fd-ink)] font-semibold text-white' : 'text-[var(--fd-ink-2)] hover:bg-[var(--fd-mist)]'}`}>
                {t(C.nav[s], lang)}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-full text-[var(--fd-mute)] hover:bg-[var(--fd-mist)]"><Search className="size-5" /></span>
            <span className="hidden text-sm text-[var(--fd-mute)] sm:inline">{lang === 'ar' ? 'English' : 'العربية'}</span>
            <span className="grid size-10 place-items-center rounded-full bg-[var(--fd-green)] text-sm font-semibold text-white">{initials(ME.name[lang])}</span>
            <span className="grid size-10 place-items-center rounded-full lg:hidden"><Menu className="size-5" /></span>
          </div>
        </div>
        {/* Mobile: section tabs scroll horizontally, like a sports news app */}
        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--fd-line)] px-3 py-2 lg:hidden">
          {SECTIONS.map((s) => (
            <a key={s} className={`shrink-0 rounded-full px-3 py-1 text-sm ${active === s ? 'bg-[var(--fd-ink)] text-white' : 'text-[var(--fd-ink-2)]'}`}>{t(C.nav[s], lang)}</a>
          ))}
        </nav>
        <div className="h-1 bg-[linear-gradient(90deg,var(--fd-green)_0_70%,var(--fd-coral)_70%_85%,var(--fd-gold)_85%)]" />
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-[var(--fd-line)] bg-[var(--fd-mist)]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-[var(--fd-mute)]">© 2026 {t(C.brand, lang)}</div>
      </footer>
    </div>
  );
}

function Crest({ tag, size = 'size-9' }: { tag: string; size?: string }) {
  const c = clan(tag);
  return <Emblem kind={c.emblem} colors={c.colors} shape="circle" className={`${size} shrink-0`} title={c.name.en} />;
}

/** Team name with its colour bar: the federation's way of giving every clan identity. */
function TeamName({ tag, lang, className = '' }: P & { tag: string; className?: string }) {
  const c = clan(tag);
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <Crest tag={tag} size="size-7" />
      <span className="truncate font-semibold">{c.name[lang]}</span>
    </span>
  );
}

function Heading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 className="fd-display text-[1.7rem] sm:text-3xl">{children}</h2>
      {action}
    </div>
  );
}

function Score({ v, className = '' }: { v: [number, number]; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="fd-num">{v[0]}</span>
      <span className="fd-num text-[0.7em] opacity-50">:</span>
      <span className="fd-num">{v[1]}</span>
    </span>
  );
}

function LiveTag({ lang }: P) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--fd-coral)] px-2.5 py-0.5 text-xs font-semibold text-white">
      <span className="fd-blink size-1.5 rounded-full bg-white" />
      {t(C.live, lang)}
    </span>
  );
}

/** Fixture row: home · score · away, symmetric around the centre, reading-direction aware. */
function Fixture({ lang, m, emphasise }: P & { m: (typeof MATCHES)[number]; emphasise?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-3 ${emphasise ? 'text-lg' : ''}`}>
      <span className="flex justify-end"><TeamName lang={lang} tag={m.home} className="flex-row-reverse text-end" /></span>
      <span className={`min-w-20 rounded-md px-2 py-1 text-center font-extrabold ${m.status === 'live' ? 'bg-[var(--fd-coral)] text-white' : m.status === 'finished' ? 'bg-[var(--fd-ink)] text-white' : 'bg-[var(--fd-mist)]'}`}>
        {m.games ? <Score v={m.games} /> : <span className="fd-num text-sm font-semibold">{fmtDate(m.time, lang, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>}
      </span>
      {m.away === 'TBD' ? <span className="text-[var(--fd-mute)]">{t(C.tour.tbd, lang)}</span> : <TeamName lang={lang} tag={m.away} />}
    </div>
  );
}

function Form({ form }: { form: PClan['form'] }) {
  const c = { W: 'bg-[var(--fd-green)] text-white', D: 'bg-[var(--fd-mist-2)] text-[var(--fd-ink)]', L: 'bg-[var(--fd-coral)] text-white' };
  return (
    <span className="flex gap-1">
      {form.map((f, i) => (
        <span key={i} className={`fd-num grid size-6 place-items-center rounded-full text-[11px] font-bold ${c[f]}`}>{f}</span>
      ))}
    </span>
  );
}

// ── 1. Home ─────────────────────────────────────────────────────────────────

export function FederationHome({ lang }: P) {
  const live = MATCHES[0]!;
  const table = [...CLANS].sort((a, b) => pts(b) - pts(a));
  return (
    <FederationShell lang={lang} active="home">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 lg:pt-14">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--fd-mist)] px-3 py-1 text-sm font-semibold text-[var(--fd-green)]">
            <ShieldCheck className="size-4" />
            {t(C.home.kicker, lang)}
          </span>
          <h1 className={`fd-display ${lang === 'ar' ? 'text-[2.4rem] sm:text-5xl lg:text-[3.6rem]' : 'text-5xl sm:text-6xl lg:text-[4.6rem]'}`}>{t(C.home.title, lang)}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--fd-ink-2)]">{t(C.home.subtitle, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="rounded-full bg-[var(--fd-green)] px-6 py-3 font-semibold text-white">{t(C.home.ctaJoin, lang)}</a>
            <a className="rounded-full border-2 border-[var(--fd-ink)] px-6 py-2.5 font-semibold">{t(C.home.ctaWatch, lang)}</a>
          </div>
        </div>

        {/* Featured match: the front page of the matchday */}
        <div className="fd-pitch relative overflow-hidden rounded-[1.75rem] p-6 text-white sm:p-8">
          <div className="flex items-center justify-between text-sm text-white/80">
            <span>{t(TOURNAMENT.name, lang)} · {t(live.round, lang)}</span>
            <LiveTag lang={lang} />
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            {[live.home, null, live.away].map((tag, i) =>
              tag ? (
                <div key={i} className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-white p-2"><Crest tag={tag} size="size-16 sm:size-20" /></span>
                  <span className="fd-display text-xl sm:text-2xl">{clan(tag).name[lang]}</span>
                </div>
              ) : (
                <div key={i}>
                  <Score v={live.games!} className="fd-display text-6xl sm:text-7xl" />
                  <p className="fd-num mt-1 text-sm text-white/70">{live.minute}</p>
                </div>
              ),
            )}
          </div>
          <div className="mt-8 grid grid-cols-5 gap-1.5">
            {LIVE_GAMES.map((g, i) => (
              <div key={i} className={`rounded-lg py-2 text-center ${g.state === 'live' ? 'bg-white text-[var(--fd-green-deep)]' : 'bg-black/20'}`}>
                <p className="text-[10px] opacity-70">{t(C.tour.board, lang)} {i + 1}</p>
                <p className="font-bold">{g.score ? <Score v={g.score} /> : '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <dl className="mx-auto mt-10 grid max-w-7xl grid-cols-3 divide-x divide-[var(--fd-line)] border-y border-[var(--fd-line)] px-4 rtl:divide-x-reverse sm:px-6">
        {[[126, C.home.stats.clans], [3967, C.home.stats.players], [1284, C.home.stats.matches]].map(([n, l], i) => (
          <div key={i} className="px-4 py-5 first:ps-0">
            <dd className="fd-display text-3xl sm:text-5xl">{fmtNum(n as number, lang)}</dd>
            <dt className="text-sm text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
          </div>
        ))}
      </dl>

      <div className="mx-auto mt-14 grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section>
          <Heading action={<a className="flex items-center gap-1 text-sm font-semibold text-[var(--fd-green)]">{t(C.nav.clans, lang)}<ArrowUpRight className="size-4 rtl:-scale-x-100" /></a>}>{t(C.home.topClans, lang)}</Heading>
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b-2 border-[var(--fd-ink)] text-xs text-[var(--fd-mute)]">
                <th className="w-8 py-2 text-start font-semibold">#</th>
                <th className="text-start font-semibold" />
                <th className="hidden w-10 text-center font-semibold sm:table-cell">{t(C.clan.played, lang)}</th>
                <th className="hidden w-10 text-center font-semibold sm:table-cell">{t(C.clan.won, lang)}</th>
                <th className="hidden text-center font-semibold md:table-cell">{t(C.clan.form, lang)}</th>
                <th className="w-12 text-end font-semibold">{t(C.clan.pts, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {table.map((c, i) => (
                <tr key={c.tag} className="border-b border-[var(--fd-line)]">
                  <td className={`fd-num py-3 font-bold ${i < 4 ? 'text-[var(--fd-green)]' : 'text-[var(--fd-mute)]'}`}>{i + 1}</td>
                  <td><TeamName lang={lang} tag={c.tag} /></td>
                  <td className="fd-num hidden text-center sm:table-cell">{c.record.p}</td>
                  <td className="fd-num hidden text-center sm:table-cell">{c.record.w}</td>
                  <td className="hidden md:table-cell"><span className="flex justify-center"><Form form={c.form} /></span></td>
                  <td className="fd-num text-end text-lg font-extrabold">{pts(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <Heading>{t(C.home.upcoming, lang)}</Heading>
          <div className="divide-y divide-[var(--fd-line)] border-y border-[var(--fd-line)]">
            {MATCHES.map((m) => (
              <div key={m.id}>
                <p className="flex items-center justify-between pt-3 text-xs text-[var(--fd-mute)]">
                  <span>{t(m.round, lang)}</span>
                  {m.status === 'live' ? <LiveTag lang={lang} /> : <span>{fmtDate(m.time, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
                </p>
                <Fixture lang={lang} m={m} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </FederationShell>
  );
}

// ── 2. Player dashboard ─────────────────────────────────────────────────────

export function FederationDashboard({ lang }: P) {
  const s = ME.stats;
  const my = clan('NILE');
  const next = MATCHES.find((m) => m.id === 'l1')!;
  return (
    <FederationShell lang={lang} active="dashboard">
      {/* Athlete page header */}
      <section className="border-b border-[var(--fd-line)] bg-[var(--fd-mist)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
          <div className="relative">
            <div className="grid size-32 place-items-center rounded-[2rem] text-5xl font-bold text-white sm:size-40" style={{ background: `linear-gradient(160deg, ${my.colors[0]}, #0f1e19)` }}>
              <span className="fd-display">{initials(ME.name[lang])}</span>
            </div>
            <span className="absolute -bottom-3 start-4 rounded-full bg-white p-1 shadow"><Crest tag="NILE" size="size-10" /></span>
          </div>
          <div>
            <p className="text-[var(--fd-mute)]">{t(C.dash.hello, lang)}</p>
            <h1 className="fd-display mt-1 text-5xl sm:text-6xl">{ME.name[lang]}</h1>
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[
                [C.dash.position, <span key="p" className="fd-num font-bold">{ME.position}</span>],
                [C.nav.clans, <span key="c" className="font-semibold">{my.name[lang]} · {t(C.clan.roles.co_leader, lang)}</span>],
                [C.dash.gameId, <span key="g" className="flex items-center gap-2"><span className="fd-num font-bold">{ME.gameId}</span><span className="rounded-full border border-[var(--fd-line)] bg-white px-2 text-xs text-[var(--fd-mute)]">{t(C.dash.unverified, lang)}</span></span>],
                [{ ar: 'الدولة', en: 'Country' }, <span key="n">{flag(ME.country)} {countryName(ME.country, lang)}</span>],
              ].map(([l, v], i) => (
                <div key={i}>
                  <dt className="text-xs text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
                  <dd className="mt-0.5">{v as ReactNode}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-12">
          <section>
            <Heading>{t(C.dash.record, lang)}</Heading>
            <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
              {[[s.matches, C.dash.matches], [`${winRate(s)}%`, C.dash.winRate], [s.goals, C.dash.goals], [s.conceded, C.dash.conceded]].map(([v, l], i) => (
                <div key={i} className="min-w-0 border-s-2 border-[var(--fd-line)] ps-4 first:border-[var(--fd-green)]">
                  <dd className="fd-display text-4xl xl:text-5xl"><span className="fd-num">{v as string}</span></dd>
                  <dt className="mt-1 text-sm text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex h-3 overflow-hidden rounded-full">
              <span className="bg-[var(--fd-green)]" style={{ width: `${(s.wins / s.matches) * 100}%` }} />
              <span className="bg-[var(--fd-mist-2)]" style={{ width: `${(s.draws / s.matches) * 100}%` }} />
              <span className="flex-1 bg-[var(--fd-coral)]" />
            </div>
            <p className="mt-2 flex justify-between text-xs text-[var(--fd-mute)]"><span className="fd-num">W {s.wins}</span><span className="fd-num">D {s.draws}</span><span className="fd-num">L {s.losses}</span></p>
          </section>

          <section>
            <Heading>{t(C.dash.recent, lang)}</Heading>
            <div className="divide-y divide-[var(--fd-line)] border-y border-[var(--fd-line)]">
              {MATCHES.filter((m) => m.status !== 'scheduled').map((m) => (
                <div key={m.id}>
                  <p className="pt-3 text-xs text-[var(--fd-mute)]">{t(m.round, lang)}</p>
                  <Fixture lang={lang} m={m} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-8">
          <section className="fd-pitch rounded-[1.5rem] p-6 text-white">
            <p className="text-sm text-white/80">{t(C.dash.nextMatch, lang)}</p>
            <p className="fd-num mt-1 text-sm">{fmtDate(next.time, lang, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
              <div className="flex flex-col items-center gap-2"><span className="rounded-full bg-white p-1.5"><Crest tag={next.home} size="size-12" /></span><span className="fd-display">{clan(next.home).name[lang]}</span></div>
              <span className="fd-display text-2xl text-white/70">{t(C.vs, lang)}</span>
              <div className="flex flex-col items-center gap-2"><span className="rounded-full bg-white p-1.5"><Crest tag={next.away} size="size-12" /></span><span className="fd-display">{clan(next.away).name[lang]}</span></div>
            </div>
            <a className="mt-6 block rounded-full bg-white py-3 text-center font-semibold text-[var(--fd-green-deep)]">{t(C.dash.reportResult, lang)}</a>
          </section>

          <section className="rounded-[1.5rem] border-2 border-[var(--fd-ink)] p-5">
            <p className="text-sm font-semibold text-[var(--fd-coral)]">{t(C.dash.invitations, lang)}</p>
            <div className="mt-3 flex items-center gap-3"><Crest tag="CRT" size="size-12" /><p className="font-semibold">{t(C.dash.inviteText, lang)}</p></div>
            <div className="mt-4 flex gap-2">
              <a className="flex-1 rounded-full bg-[var(--fd-ink)] py-2.5 text-center font-semibold text-white">{t(C.dash.accept, lang)}</a>
              <a className="flex-1 rounded-full bg-[var(--fd-mist)] py-2.5 text-center font-semibold">{t(C.dash.decline, lang)}</a>
            </div>
          </section>

          <section>
            <Heading>{t(C.dash.achievements, lang)}</Heading>
            <ol className="relative flex flex-col gap-5 border-s-2 border-[var(--fd-line)] ps-6">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.date} className="relative">
                  <span className={`absolute -start-[2.15rem] top-0.5 grid size-6 place-items-center rounded-full ${a.place === 1 ? 'bg-[var(--fd-gold)] text-white' : 'bg-[var(--fd-mist-2)]'}`}><Trophy className="size-3.5" /></span>
                  <p className="font-semibold">{a.title[lang]}</p>
                  <p className="text-sm text-[var(--fd-mute)]">{C.dash.places[lang][a.place]} · {fmtDate(a.date, lang, { month: 'long', year: 'numeric' })}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </FederationShell>
  );
}

// ── 3. Clan profile ─────────────────────────────────────────────────────────

export function FederationClan({ lang }: P) {
  const c = clan('NILE');
  const r = c.record;
  return (
    <FederationShell lang={lang} active="clans">
      {/* Kit band: the clan's two colours run across the top of its page */}
      <div className="flex h-3"><span className="flex-[3]" style={{ background: c.colors[0] }} /><span className="flex-1" style={{ background: c.colors[1] }} /></div>
      <section className="border-b border-[var(--fd-line)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
          <span className="rounded-full p-2 ring-4" style={{ ['--tw-ring-color' as string]: `${c.colors[0]}33` }}><Crest tag={c.tag} size="size-28 sm:size-36" /></span>
          <div className="min-w-0 flex-1">
            <p className="fd-num text-sm font-bold tracking-[0.3em] text-[var(--fd-mute)]">{c.tag}</p>
            <h1 className="fd-display mt-1 text-5xl sm:text-7xl">{c.name[lang]}</h1>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[var(--fd-ink-2)]">
              <span>{flag(c.country)} {countryName(c.country, lang)}</span>
              <span>{t(C.clan.founded, lang)} {fmtDate(c.founded, lang, { month: 'long', year: 'numeric' })}</span>
              <span>{c.members} {t(C.clan.members, lang)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <a className="rounded-full bg-[var(--fd-ink)] px-6 py-3 font-semibold text-white">{t(C.clan.join, lang)}</a>
            <a className="rounded-full bg-[var(--fd-mist)] px-5 py-3 font-semibold">{t(C.clan.contact, lang)}</a>
          </div>
        </div>
        <dl className="mx-auto grid max-w-7xl grid-cols-3 border-t border-[var(--fd-line)] px-4 sm:grid-cols-6 sm:px-6">
          {[[r.p, C.clan.played], [r.w, C.clan.won], [r.d, C.clan.drawn], [r.l, C.clan.lost], [`${Math.round((r.w / r.p) * 100)}%`, C.clan.winRate], [c.trophies, C.clan.trophies]].map(([v, l], i) => (
            <div key={i} className="py-5">
              <dd className="fd-display text-4xl">{v as string}</dd>
              <dt className="text-sm text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section>
          <Heading action={<Form form={c.form} />}>{t(C.clan.roster, lang)}</Heading>
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b-2 border-[var(--fd-ink)] text-xs text-[var(--fd-mute)]">
                <th className="py-2 text-start font-semibold" />
                <th className="w-14 text-center font-semibold">{t(C.dash.position, lang)}</th>
                <th className="hidden w-20 text-center font-semibold sm:table-cell">{t(C.dash.matches, lang)}</th>
                <th className="w-16 text-end font-semibold">{t(C.clan.winRate, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {ROSTER.map((p) => (
                <tr key={p.username} className="border-b border-[var(--fd-line)]">
                  <td className="py-3">
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--fd-mist)] font-bold">{initials(p.name[lang])}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-semibold">
                          {p.name[lang]} <span className="text-sm">{flag(p.country)}</span>
                          {p.role !== 'member' && <span className={`rounded-full px-2 text-xs ${p.role === 'leader' ? 'bg-[var(--fd-gold)] text-white' : 'bg-[var(--fd-mist-2)]'}`}>{t(C.clan.roles[p.role], lang)}</span>}
                        </span>
                        <span className="fd-num block text-xs text-[var(--fd-mute)]">@{p.username}</span>
                      </span>
                    </span>
                  </td>
                  <td className="fd-num text-center font-bold">{p.position}</td>
                  <td className="fd-num hidden text-center sm:table-cell">{p.stats.matches}</td>
                  <td className="fd-num text-end font-bold">{winRate(p.stats)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="flex flex-col gap-10">
          <section>
            <Heading>{t(C.clan.about, lang)}</Heading>
            <p className="text-lg leading-relaxed text-[var(--fd-ink-2)]">{t(C.clan.description, lang)}</p>
          </section>
          <section>
            <Heading>{t(C.clan.history, lang)}</Heading>
            <ul className="divide-y divide-[var(--fd-line)] border-y border-[var(--fd-line)]">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.date} className="flex items-center gap-3 py-3">
                  <Trophy className={`size-6 shrink-0 ${a.place === 1 ? 'text-[var(--fd-gold)]' : 'text-[var(--fd-mute)]'}`} />
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{a.title[lang]}</span><span className="text-sm text-[var(--fd-mute)]">{fmtDate(a.date, lang, { month: 'long', year: 'numeric' })}</span></span>
                  <span className="text-sm font-semibold">{C.dash.places[lang][a.place]}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </FederationShell>
  );
}

// ── 4. Tournament ───────────────────────────────────────────────────────────

export function FederationTournament({ lang }: P) {
  const semis = TOURNAMENT.bracket.semis;
  return (
    <FederationShell lang={lang} active="competitions">
      <section className="fd-grid border-b border-[var(--fd-line)] bg-[var(--fd-mist)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <span className="grid size-24 shrink-0 place-items-center rounded-[1.75rem] bg-[var(--fd-ink)] text-[var(--fd-gold)]"><Trophy className="size-12" strokeWidth={1.5} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><LiveTag lang={lang} /><span className="text-sm text-[var(--fd-mute)]">{t(TOURNAMENT.season, lang)}</span></div>
              <h1 className="fd-display mt-2 text-5xl sm:text-6xl">{t(TOURNAMENT.name, lang)}</h1>
            </div>
          </div>
          <dl className="mt-8 grid gap-6 sm:grid-cols-4">
            {[[C.tour.organizer, t(TOURNAMENT.organizer, lang)], [C.tour.format, t(TOURNAMENT.format, lang)], [C.tour.dates, t(TOURNAMENT.dates, lang)], [C.tour.participants, String(TOURNAMENT.participants)]].map(([l, v], i) => (
              <div key={i} className="border-t-2 border-[var(--fd-ink)] pt-2">
                <dt className="text-xs text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
                <dd className="mt-1 font-semibold">{v as string}</dd>
              </div>
            ))}
          </dl>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 sm:px-6">
          {[C.tour.overview, C.tour.bracket, C.tour.groups, C.tour.fixtures].map((x, i) => (
            <a key={i} className={`shrink-0 border-b-[3px] pb-3 font-semibold ${i === 0 ? 'border-[var(--fd-green)] text-[var(--fd-ink)]' : 'border-transparent text-[var(--fd-mute)]'}`}>{t(x, lang)}</a>
          ))}
        </nav>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <section>
          <Heading>{t(C.tour.bracket, lang)}</Heading>
          {/* Bracket drawn with connector lines; flows from start to end in either direction */}
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,0.9fr)] md:gap-0">
            <div className="flex flex-col gap-6">
              {semis.map((m) => (
                <div key={m.id} className="rounded-2xl border border-[var(--fd-line)] bg-white p-4 shadow-[0_1px_0_var(--fd-line)]">
                  <div className="mb-1 flex items-center justify-between text-xs text-[var(--fd-mute)]"><span>{t(C.tour.semi, lang)}</span>{m.status === 'live' ? <LiveTag lang={lang} /> : <span>{t(C.finished, lang)}</span>}</div>
                  {[m.home, m.away].map((tag, i) => (
                    <div key={tag} className={`flex items-center justify-between py-1.5 ${m.games[i]! > m.games[1 - i]! ? 'font-bold' : 'text-[var(--fd-mute)]'}`}>
                      <TeamName lang={lang} tag={tag} />
                      <span className="fd-num text-xl">{m.games[i]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div aria-hidden className="relative hidden h-[60%] md:block">
              <span className="absolute inset-y-0 start-0 w-1/2 rounded-e-xl border-y-2 border-e-2 border-[var(--fd-line)]" />
              <span className="absolute end-0 top-1/2 h-0.5 w-1/2 bg-[var(--fd-line)]" />
            </div>
            <div className="fd-pitch rounded-[1.75rem] p-6 text-white">
              <p className="flex items-center gap-2 text-sm text-white/80"><Trophy className="size-4" />{t(C.tour.final, lang)}</p>
              <p className="fd-num mt-1 text-sm">{fmtDate(TOURNAMENT.bracket.final.time, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3"><span className="rounded-full bg-white p-1"><Crest tag="CEG" /></span><span className="fd-display text-xl">{clan('CEG').name[lang]}</span></div>
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/40 p-3 text-white/80"><span className="grid size-11 place-items-center rounded-full border border-dashed border-white/50">?</span><span>NILE / GST</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section>
            <Heading action={<span className="text-sm text-[var(--fd-mute)]">{t(C.tour.qualify, lang)}</span>}>{t(C.tour.groups, lang)}</Heading>
            <div className="flex flex-col gap-8">
              {TOURNAMENT.groups.map((g) => (
                <table key={g.name.en} className="w-full text-[15px]">
                  <caption className="fd-display mb-2 text-start text-lg">{g.name[lang]}</caption>
                  <thead>
                    <tr className="border-b-2 border-[var(--fd-ink)] text-xs text-[var(--fd-mute)]">
                      <th className="w-7 py-2 text-start">#</th><th className="text-start" />
                      {[C.clan.played, C.clan.won, C.clan.drawn, C.clan.lost, C.clan.gd, C.clan.pts].map((h, i) => <th key={i} className="w-10 text-center font-semibold">{t(h, lang)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr key={r.tag} className="border-b border-[var(--fd-line)]">
                        <td className="py-2.5"><span className={`fd-num grid size-6 place-items-center rounded-full text-xs font-bold ${i < 2 ? 'bg-[var(--fd-green)] text-white' : 'bg-[var(--fd-mist)]'}`}>{i + 1}</span></td>
                        <td><TeamName lang={lang} tag={r.tag} /></td>
                        {[r.p, r.w, r.d, r.l, r.gd > 0 ? `+${r.gd}` : r.gd].map((v, j) => <td key={j} className="fd-num text-center">{v}</td>)}
                        <td className="fd-num text-center font-extrabold">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </section>
          <section>
            <Heading>{t(C.tour.fixtures, lang)}</Heading>
            <div className="divide-y divide-[var(--fd-line)] border-y border-[var(--fd-line)]">
              {MATCHES.slice(0, 5).map((m) => (
                <div key={m.id}>
                  <p className="flex items-center gap-1.5 pt-3 text-xs text-[var(--fd-mute)]"><Clock className="size-3.5" />{fmtDate(m.time, lang, { weekday: 'short', day: 'numeric', month: 'short' })} · {t(m.round, lang)}</p>
                  <Fixture lang={lang} m={m} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </FederationShell>
  );
}

// ── 5. Admin ────────────────────────────────────────────────────────────────

export function FederationAdmin({ lang }: P) {
  const sel = ADMIN.queue[0]!;
  const check = (v: boolean, yes: { ar: string; en: string }, no: { ar: string; en: string }) => (
    <li className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${v ? 'bg-[#e6f3ee] text-[var(--fd-green-deep)]' : 'bg-[#fde9e5] text-[#a3301a]'}`}>
      {v ? <Check className="size-4" /> : <X className="size-4" />}
      {t(v ? yes : no, lang)}
    </li>
  );
  return (
    <FederationShell lang={lang} active="admin">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="fd-display text-4xl sm:text-5xl">{t(C.admin.title, lang)}</h1>
          <p className="text-sm text-[var(--fd-mute)]">{fmtNum(ADMIN.stats.users, lang)} {t(C.admin.users, lang)} · {ADMIN.stats.clans} {t(C.admin.clans, lang)}</p>
        </div>
        <dl className="mt-8 grid grid-cols-3 divide-x divide-[var(--fd-line)] rounded-2xl border border-[var(--fd-line)] rtl:divide-x-reverse">
          {[[ADMIN.stats.pending, C.admin.pending, 'text-[var(--fd-green)]'], [ADMIN.stats.openDisputes, C.admin.disputes, 'text-[var(--fd-coral)]'], [ADMIN.stats.liveMatches, C.admin.liveMatches, '']].map(([v, l, cls], i) => (
            <div key={i} className="p-5">
              <dd className={`fd-display text-4xl sm:text-5xl ${cls}`}>{v as number}</dd>
              <dt className="mt-1 text-sm text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <section>
            <Heading>{t(C.admin.queue, lang)}</Heading>
            <ul className="divide-y divide-[var(--fd-line)] border-y border-[var(--fd-line)]">
              {ADMIN.queue.map((a, i) => (
                <li key={a.id} className={`flex items-center gap-3 px-3 py-3 ${i === 0 ? 'rounded-xl bg-[var(--fd-mist)]' : ''}`}>
                  <Emblem kind={a.emblem} colors={a.colors} shape="circle" className="size-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.name[lang]} <span className="fd-num text-sm text-[var(--fd-mute)]">{a.tag}</span></p>
                    <p className="truncate text-sm text-[var(--fd-mute)]">{a.applicant[lang]} · {fmtDate(a.submitted, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {(!a.checks.name || !a.checks.free) && <span className="rounded-full bg-[#fde9e5] px-2 py-0.5 text-xs font-semibold text-[#a3301a]">!</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.75rem] border border-[var(--fd-line)] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Emblem kind={sel.emblem} colors={sel.colors} shape="circle" className="size-24 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--fd-mute)]">{t(C.admin.reviewing, lang)}</p>
                <h2 className="fd-display text-4xl">{sel.name[lang]}</h2>
                <p className="fd-num font-bold tracking-[0.25em] text-[var(--fd-mute)]">{sel.tag}</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {check(sel.checks.name, C.admin.checks.name, C.admin.checks.nameTaken)}
              {check(sel.checks.tag, C.admin.checks.tag, C.admin.checks.tagTaken)}
              {check(sel.checks.free, C.admin.checks.free, C.admin.checks.busy)}
            </ul>
            <dl className="mt-6 divide-y divide-[var(--fd-line)] border-y border-[var(--fd-line)] text-[15px]">
              {[[C.admin.descriptionLabel, t(ADMIN.description, lang)], [C.admin.contact, <span key="c" className="fd-num text-[var(--fd-green)] underline">{ADMIN.contact}</span>], [C.admin.applicant, <span key="a">{sel.applicant[lang]} <span className="fd-num text-[var(--fd-mute)]">@{sel.username}</span> · {flag(sel.country)} {countryName(sel.country, lang)}</span>]].map(([l, v], i) => (
                <div key={i} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-sm text-[var(--fd-mute)]">{t(l as { ar: string; en: string }, lang)}</dt>
                  <dd className="leading-relaxed">{v as ReactNode}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <a className="flex-1 rounded-full bg-[var(--fd-green)] py-3 text-center font-semibold text-white">{t(C.admin.approve, lang)}</a>
              <a className="flex-1 rounded-full border-2 border-[var(--fd-coral)] py-2.5 text-center font-semibold text-[var(--fd-coral)]">{t(C.admin.reject, lang)}</a>
            </div>
          </section>
        </div>

        <section className="mt-12">
          <Heading>{t(C.admin.recent, lang)}</Heading>
          <table className="w-full text-[15px]">
            <tbody>
              {ADMIN.decisions.map((d, i) => (
                <tr key={i} className="border-b border-[var(--fd-line)]">
                  <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.action === 'approve' ? 'bg-[#e6f3ee] text-[var(--fd-green-deep)]' : 'bg-[#fde9e5] text-[#a3301a]'}`}>{t(d.action === 'approve' ? C.admin.approved : C.admin.rejected, lang)}</span></td>
                  <td className="font-semibold">{d.target[lang]}</td>
                  <td className="fd-num text-[var(--fd-mute)]">@{d.who}</td>
                  <td className="text-end text-sm text-[var(--fd-mute)]">{fmtDate(d.at, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </FederationShell>
  );
}

export const FEDERATION = {
  home: FederationHome,
  dashboard: FederationDashboard,
  clan: FederationClan,
  tournament: FederationTournament,
  admin: FederationAdmin,
};
