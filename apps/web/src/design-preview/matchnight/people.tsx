/* DESIGN PREVIEW ONLY — MATCHNIGHT: Player profile ("player introduction") and Clan page ("the kit + team sheet"). */
import { BadgeCheck, ExternalLink, Pencil, Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { C, countryName, flag, fmtDate } from '../copy';
import { ACHIEVEMENTS, type Lang, MATCHES, ME, type PPlayer, ROSTER, winRate } from '../data';
import { Emblem } from '../emblem';
import { MY_RESULTS } from '../hybrid/extra';
import { clan, OFFICIAL } from './data';
import {
  Arrow,
  bugPad,
  Crest,
  Footer,
  Masthead,
  MenuOverlay,
  MobileBug,
  Monogram,
  PlayerCard,
  Score,
  t,
  type ViewProps,
  wrap,
} from './screens';

type P = { lang: Lang };

const Q = {
  player: { ar: 'لاعب', en: 'Player' },
  editProfile: { ar: 'تعديل الملف', en: 'Edit profile' },
  viewClan: { ar: 'صفحة الكلان', en: 'Clan page' },
  gameId: { ar: 'معرّف اللعبة', en: 'Game ID' },
  pending: { ar: 'بانتظار التوثيق', en: 'Awaiting verification' },
  pendingNote: {
    ar: 'يراجع المشرفون المعرّف يدويًا. لا يُعتمد ذاتيًا، ولا يظهر علامة التوثيق قبل المراجعة.',
    en: 'Moderators check the ID manually. It is never self-verified and shows no verified mark before review.',
  },
  winRate: { ar: 'نسبة الفوز', en: 'Win rate' },
  matches: { ar: 'مباراة', en: 'matches' },
  position: { ar: 'المركز', en: 'Position' },
  season: { ar: 'أرقام الموسم', en: 'The season in numbers' },
  wins: { ar: 'فوز', en: 'Wins' },
  draws: { ar: 'تعادل', en: 'Draws' },
  losses: { ar: 'خسارة', en: 'Losses' },
  goals: { ar: 'أهداف', en: 'Goals' },
  conceded: { ar: 'استقبل', en: 'Conceded' },
  played: { ar: 'مباريات', en: 'Matches' },
  recent: { ar: 'آخر المباريات', en: 'Recent games' },
  vs: { ar: 'ضد', en: 'v' },
  career: { ar: 'المسيرة', en: 'Career' },
  res: { W: { ar: 'فوز', en: 'W' }, D: { ar: 'تعادل', en: 'D' }, L: { ar: 'خسارة', en: 'L' } },
  // clan
  join: { ar: 'اطلب الانضمام', en: 'Ask to join' },
  contact: { ar: 'تواصل', en: 'Contact' },
  founded: { ar: 'تأسس', en: 'Founded' },
  members: { ar: 'عضو', en: 'members' },
  seasonRecord: { ar: 'سجل الموسم', en: 'Season record' },
  pts: { ar: 'نقطة', en: 'pts' },
  sheet: { ar: 'ورقة التشكيلة', en: 'Team sheet' },
  leadership: { ar: 'القيادة', en: 'Leadership' },
  squad: { ar: 'اللاعبون', en: 'Players' },
  verifiedMark: { ar: 'معرّف لعبة موثّق', en: 'Verified game ID' },
  cabinet: { ar: 'خزانة الألقاب', en: 'Trophy cabinet' },
  results: { ar: 'نتائج الكلان', en: 'Clan results' },
  about: { ar: 'عن الكلان', en: 'About' },
  form: { ar: 'آخر 5', en: 'Last five' },
  capacity: { ar: 'من 50', en: 'of 50' },
} as const;

const places = (lang: Lang, p: 1 | 2 | 3) => C.dash.places[lang][p];
const MEDAL = ['', 'mn-gold', 'mn-silver', 'mn-bronze'] as const;

/** Honour medal; its size follows the place — a title is bigger than a podium. */
function Medal({ place }: { place: 1 | 2 | 3 }) {
  const size =
    place === 1 ? 'size-24 md:size-28' : place === 2 ? 'size-16 md:size-20' : 'size-14 md:size-16';
  return (
    <span
      className={`${MEDAL[place]} grid ${size} shrink-0 place-items-center text-[var(--mn-ink)]`}
      style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
    >
      <Trophy className="size-1/2" strokeWidth={1.75} />
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PLAYER PROFILE — "player introduction"
// ════════════════════════════════════════════════════════════════════════════

export function MatchnightProfile({ lang, bug = 'live', menu = false }: ViewProps) {
  const p = ME;
  const c = clan('NILE');
  const s = p.stats;
  const seg = (n: number) => `${(n / s.matches) * 100}%`;
  return (
    <div className={bugPad(bug)}>
      <Masthead lang={lang} active="players" />

      {/* Hero: the name is the image; the clan colour owns the end of the frame. */}
      <section className="relative overflow-hidden border-b-[3px] border-[var(--mn-ink)]">
        <div
          className="absolute inset-y-0 end-0 hidden w-[36%] lg:block"
          style={{
            background: c.colors[0],
            clipPath:
              lang === 'ar'
                ? 'polygon(0 0, 82% 0, 100% 100%, 0 100%)'
                : 'polygon(18% 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div
          className={`${wrap} relative grid items-center gap-10 py-10 md:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16`}
        >
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 text-[var(--mn-ink-2)]">
              <span className="mn-n text-lg">@{p.username}</span>
              <span>·</span>
              <span>{t(Q.player, lang)}</span>
            </p>
            <h1
              className={`mn-d mt-2 ${lang === 'ar' ? 'text-6xl md:text-8xl' : 'text-7xl md:text-9xl xl:text-[10rem]'}`}
            >
              {p.name[lang]}
            </h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-lg">
              <a className="flex items-center gap-2 font-semibold underline decoration-2 underline-offset-4">
                <Crest tag="NILE" className="size-7" /> {c.name[lang]}
              </a>
              <span>{t(C.clan.roles[p.role], lang)}</span>
              <span>
                {flag(p.country)} {countryName(p.country, lang)}
              </span>
            </p>

            {/* Two numbers, editorial size — not a KPI row */}
            <dl className="mt-10 flex flex-wrap items-end gap-x-14 gap-y-6">
              <div>
                <dd className="mn-n mn-big text-8xl md:text-[9rem]">
                  {winRate(s)}
                  <span className="text-[0.45em]">%</span>
                </dd>
                <dt className="mt-1 text-[var(--mn-ink-2)]">{t(Q.winRate, lang)}</dt>
              </div>
              <div>
                <dd className="mn-n mn-big text-7xl md:text-8xl">{p.position}</dd>
                <dt className="mt-1 text-[var(--mn-ink-2)]">{t(Q.position, lang)}</dt>
              </div>
            </dl>

            {/* Game ID — its own honest state */}
            <div className="mt-10 flex max-w-2xl flex-wrap items-center gap-x-5 gap-y-3 border-y-[3px] border-[var(--mn-ink)] py-4">
              <div>
                <p className="text-sm text-[var(--mn-ink-2)]">{t(Q.gameId, lang)}</p>
                <p className="mn-n text-2xl tracking-wider">{p.gameId}</p>
              </div>
              <span className="border-2 border-dashed border-[#a86b00] px-2.5 py-1 text-sm font-semibold text-[#7a4d00]">
                {t(Q.pending, lang)}
              </span>
              <p className="basis-full text-sm text-[var(--mn-ink-2)]">{t(Q.pendingNote, lang)}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a className="inline-flex h-12 items-center gap-2 bg-[var(--mn-ink)] px-5 font-semibold text-white">
                <Pencil className="size-4" /> {t(Q.editProfile, lang)}
              </a>
              <a className="inline-flex h-12 items-center gap-2 border-2 border-[var(--mn-ink)] px-5 font-semibold">
                {t(Q.viewClan, lang)} <Arrow lang={lang} />
              </a>
            </div>
          </div>
          <div className="lg:pe-6">
            <PlayerCard lang={lang} p={p} tag="NILE" />
          </div>
        </div>
      </section>

      {/* The season in numbers: rules between numbers, no boxes */}
      <section className={`${wrap} py-14 md:py-20`}>
        <h2 className="mn-d mb-8 text-4xl md:text-6xl">{t(Q.season, lang)}</h2>
        <dl className="grid grid-cols-3 gap-y-8 md:grid-cols-6">
          {(
            [
              [s.matches, Q.played],
              [s.wins, Q.wins],
              [s.draws, Q.draws],
              [s.losses, Q.losses],
              [s.goals, Q.goals],
              [s.conceded, Q.conceded],
            ] as const
          ).map(([v, l], i) => (
            <div key={i} className="border-s-[3px] border-[var(--mn-ink)] ps-4">
              <dd className="mn-n text-5xl md:text-6xl">{v}</dd>
              <dt className="mt-1 text-[var(--mn-ink-2)]">{t(l, lang)}</dt>
            </div>
          ))}
        </dl>
        <div
          className="mt-10 flex h-4"
          role="img"
          aria-label={`${s.wins} / ${s.draws} / ${s.losses}`}
        >
          <span style={{ width: seg(s.wins) }} className="bg-[var(--mn-pitch)]" />
          <span style={{ width: seg(s.draws) }} className="bg-[#9aa1ab]" />
          <span style={{ width: seg(s.losses) }} className="bg-[var(--mn-signal)]" />
        </div>
      </section>

      {/* Recent games — a results strip, not a feed */}
      <section className="bg-[var(--mn-chalk-2)]">
        <div className={`${wrap} py-14 md:py-20`}>
          <h2 className="mn-d mb-8 text-4xl md:text-6xl">{t(Q.recent, lang)}</h2>
          <ol>
            {MY_RESULTS.map((r, i) => {
              const res = r.score[0] > r.score[1] ? 'W' : r.score[0] < r.score[1] ? 'L' : 'D';
              return (
                <li
                  key={i}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-t-[3px] border-[var(--mn-ink)] py-4 md:grid-cols-[3rem_9rem_minmax(0,1fr)_auto] md:gap-6"
                >
                  <span
                    className={`mn-n grid size-10 place-items-center text-lg text-white ${res === 'W' ? 'bg-[var(--mn-pitch)]' : res === 'L' ? 'bg-[var(--mn-signal)]' : 'bg-[#6b7280]'}`}
                    aria-label={t(Q.res[res], lang)}
                  >
                    {res}
                  </span>
                  <span className="hidden text-sm text-[var(--mn-ink-2)] md:block">
                    {fmtDate(r.date, lang, { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="min-w-0">
                    <p className="mn-h flex items-center gap-2 break-words text-2xl md:text-3xl">
                      <span className="text-[var(--mn-ink-2)]">{t(Q.vs, lang)}</span>
                      <Crest tag={r.oppClan} className="size-7" />
                      <span className="break-words">{r.opp[lang]}</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-[var(--mn-ink-2)]">
                      {r.comp[lang]}
                      <span className="md:hidden">
                        {' '}
                        · {fmtDate(r.date, lang, { day: 'numeric', month: 'short' })}
                      </span>
                    </p>
                  </div>
                  <Score v={r.score} className="text-4xl md:text-5xl" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Career — medals sized by place */}
      <section className={`${wrap} py-14 md:py-20`}>
        <h2 className="mn-d mb-10 text-4xl md:text-6xl">{t(Q.career, lang)}</h2>
        <ol className="flex flex-col gap-8 md:flex-row md:items-end md:gap-14">
          {[...ACHIEVEMENTS]
            .sort((a, b) => a.place - b.place)
            .map((a) => (
              <li key={a.date} className="flex items-center gap-5 md:flex-col md:items-start">
                <Medal place={a.place} />
                <div>
                  <p className="mn-h text-2xl">{a.title[lang]}</p>
                  <p className="text-[var(--mn-ink-2)]">
                    {places(lang, a.place)} ·{' '}
                    {fmtDate(a.date, lang, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </li>
            ))}
        </ol>
      </section>

      <Footer lang={lang} />
      {menu ? <MenuOverlay lang={lang} /> : <MobileBug lang={lang} state={bug} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CLAN PAGE — "the kit and the team sheet"
// ════════════════════════════════════════════════════════════════════════════

function RoleMark({ role, lang }: P & { role: PPlayer['role'] }) {
  if (role === 'member') return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold ${role === 'leader' ? 'mn-gold text-[var(--mn-ink)]' : 'bg-[var(--mn-ink)] text-white'}`}
    >
      <span className="mn-n text-sm">{role === 'leader' ? 'C' : 'VC'}</span>
      {t(C.clan.roles[role], lang)}
    </span>
  );
}

export function MatchnightClan({ lang, bug = 'live', menu = false }: ViewProps) {
  const c = clan('NILE');
  const r = c.record;
  const leaders = ROSTER.filter((p) => p.role !== 'member').sort((a) =>
    a.role === 'leader' ? -1 : 1,
  );
  const squad = ROSTER.filter((p) => p.role === 'member');
  const results = MATCHES.filter((m) => m.home === 'NILE' || m.away === 'NILE');
  const kit = { '--c1': c.colors[0], '--c2': c.colors[1] } as CSSProperties;
  return (
    <div className={bugPad(bug)}>
      <Masthead lang={lang} active="clans" />

      {/* The kit: solid clan colours, a 12° band, the crest cropped off the edge */}
      <section className="relative overflow-hidden bg-[var(--c1)] text-white" style={kit}>
        <div
          className="absolute inset-y-0 end-[8%] hidden w-[14%] bg-[var(--c2)] md:block"
          style={{ transform: `skewX(${lang === 'ar' ? 12 : -12}deg)` }}
        />
        {/* On mobile the band becomes a kit stripe along the bottom, so it never sits under text. */}
        <div className="absolute inset-x-0 bottom-0 h-2 bg-[var(--c2)] md:hidden" />
        <Emblem
          kind={c.emblem}
          colors={['#ffffff', '#ffffff']}
          shape="bare"
          className="pointer-events-none absolute -end-[8vw] top-1/2 size-[70vw] -translate-y-1/2 opacity-[0.12] md:size-[42vw]"
        />
        <div className={`${wrap} relative py-10 md:py-16`}>
          <div className="flex items-center gap-4">
            <Crest tag="NILE" className="size-16 md:size-24" />
            <span className="mn-n text-2xl tracking-[0.25em] text-white/85 md:text-3xl">
              {c.tag}
            </span>
          </div>
          <h1
            className={`mn-d mt-5 ${lang === 'ar' ? 'text-7xl md:text-9xl' : 'text-8xl md:text-[11rem]'}`}
          >
            {c.name[lang]}
          </h1>
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-lg text-white/90">
            <span>
              {flag(c.country)} {countryName(c.country, lang)}
            </span>
            <span>
              {t(Q.founded, lang)} {fmtDate(c.founded, lang, { month: 'long', year: 'numeric' })}
            </span>
            <span>
              <span className="mn-n">{c.members}</span> {t(Q.capacity, lang).replace('50', '')}
              <span className="mn-n">50</span> {t(Q.members, lang)}
            </span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="inline-flex h-12 items-center bg-white px-6 font-semibold text-[var(--mn-ink)]">
              {t(Q.join, lang)}
            </a>
            <a className="inline-flex h-12 items-center gap-2 border-2 border-white/70 px-5 font-semibold">
              {t(Q.contact, lang)} <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Season record: one big line */}
      <section className="border-b-[3px] border-[var(--mn-ink)]">
        <div
          className={`${wrap} flex flex-wrap items-end justify-between gap-x-10 gap-y-6 py-8 md:py-10`}
        >
          <div>
            <p className="mb-2 text-[var(--mn-ink-2)]">{t(Q.seasonRecord, lang)}</p>
            <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
              {(
                [
                  [r.p, C.clan.played],
                  [r.w, C.clan.won],
                  [r.d, C.clan.drawn],
                  [r.l, C.clan.lost],
                  [`+${r.gf - r.ga}`, C.clan.gd],
                ] as const
              ).map(([v, l], i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <dd className="mn-n text-5xl md:text-6xl">{v}</dd>
                  <dt className="text-[var(--mn-ink-2)]">{t(l, lang)}</dt>
                </div>
              ))}
              <div className="flex items-baseline gap-2">
                <dd className="mn-n mn-big text-6xl md:text-7xl">{r.w * 3 + r.d}</dd>
                <dt className="text-[var(--mn-ink-2)]">{t(Q.pts, lang)}</dt>
              </div>
            </dl>
          </div>
          <div>
            <p className="mb-2 text-sm text-[var(--mn-ink-2)]">{t(Q.form, lang)}</p>
            <span className="flex gap-1">
              {c.form.map((f, j) => (
                <span
                  key={j}
                  className={`mn-n grid size-9 place-items-center text-lg text-white ${f === 'W' ? 'bg-[var(--mn-pitch)]' : f === 'D' ? 'bg-[#6b7280]' : 'bg-[var(--mn-signal)]'}`}
                >
                  {f}
                </span>
              ))}
            </span>
          </div>
        </div>
      </section>

      {/* Team sheet */}
      <section className={`${wrap} py-14 md:py-20`}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="mn-d text-4xl md:text-6xl">{t(Q.sheet, lang)}</h2>
          <p className="flex items-center gap-1.5 text-sm text-[var(--mn-ink-2)]">
            <BadgeCheck className="size-4 text-[var(--mn-pitch)]" /> {t(Q.verifiedMark, lang)}
          </p>
        </div>

        <p className="mb-4 text-sm font-semibold text-[var(--mn-ink-2)]">{t(Q.leadership, lang)}</p>
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {leaders.map((p) => (
            <div
              key={p.username}
              className="flex items-center gap-5 border-t-[3px] border-[var(--mn-ink)] pt-5"
            >
              <Monogram p={p} tag="NILE" lang={lang} className="w-24 shrink-0 md:w-32" />
              <div className="min-w-0">
                <RoleMark role={p.role} lang={lang} />
                <p
                  className={`mn-d mt-2 ${lang === 'ar' ? 'text-4xl md:text-5xl' : 'text-5xl md:text-6xl'}`}
                >
                  {p.name[lang]}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[var(--mn-ink-2)]">
                  <span className="mn-n text-lg text-[var(--mn-ink)]">{p.position}</span>·
                  <span className="mn-n">{winRate(p.stats)}%</span>
                  {p.verified && (
                    <BadgeCheck
                      className="size-4 text-[var(--mn-pitch)]"
                      aria-label={t(Q.verifiedMark, lang)}
                    />
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-2 mt-12 text-sm font-semibold text-[var(--mn-ink-2)]">
          {t(Q.squad, lang)}
        </p>
        <ol>
          {squad.map((p) => (
            <li
              key={p.username}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 border-t border-[var(--mn-rule)] py-3 md:grid-cols-[4.5rem_minmax(0,1fr)_6rem_6rem]"
            >
              <span className="mn-n text-2xl md:text-3xl">{p.position}</span>
              <span className="mn-h flex min-w-0 items-center gap-2 text-2xl md:text-3xl">
                <span className="break-words">{p.name[lang]}</span>
                {p.verified && (
                  <BadgeCheck
                    className="size-5 shrink-0 text-[var(--mn-pitch)]"
                    aria-label={t(Q.verifiedMark, lang)}
                  />
                )}
              </span>
              <span className="mn-n text-end text-2xl">{winRate(p.stats)}%</span>
              <span className="hidden text-end text-[var(--mn-ink-2)] md:block">
                <span className="mn-n">{p.stats.matches}</span> {t(Q.matches, lang)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Trophy cabinet */}
      <section className="bg-[var(--mn-ink)] text-white">
        <div className={`${wrap} py-14 md:py-20`}>
          <h2 className="mn-d mb-10 text-4xl md:text-6xl">{t(Q.cabinet, lang)}</h2>
          <ol className="flex flex-col gap-8 md:flex-row md:items-end md:gap-16">
            {[...ACHIEVEMENTS]
              .sort((a, b) => a.place - b.place)
              .map((a) => (
                <li key={a.date} className="flex items-center gap-5 md:flex-col md:items-start">
                  <Medal place={a.place} />
                  <div>
                    <p className="mn-h text-2xl">{a.title[lang]}</p>
                    <p className="text-white/60">
                      {places(lang, a.place)} ·{' '}
                      {fmtDate(a.date, lang, { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </li>
              ))}
          </ol>
        </div>
      </section>

      {/* Results + about */}
      <section
        className={`${wrap} grid gap-14 py-14 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`}
      >
        <div>
          <h2 className="mn-d mb-8 text-4xl md:text-5xl">{t(Q.results, lang)}</h2>
          <ul>
            {results.map((m) => {
              const away = m.away === 'TBD' ? null : clan(m.away);
              return (
                <li
                  key={m.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-t-[3px] border-[var(--mn-ink)] py-4 md:gap-5"
                >
                  <span className="flex min-w-0 items-center justify-end gap-2.5">
                    <span className="mn-h break-words text-xl md:text-2xl">
                      {clan(m.home).name[lang]}
                    </span>
                    <Crest tag={m.home} className="size-8" />
                  </span>
                  <span className="text-center">
                    {m.games ? (
                      <span
                        className={`inline-block px-2.5 ${m.status === 'live' ? 'bg-[var(--mn-night)] text-white' : 'bg-[var(--mn-ink)] text-white'}`}
                      >
                        <Score v={m.id === 'sf1' ? OFFICIAL : m.games} className="text-3xl" />
                      </span>
                    ) : (
                      <span className="mn-n inline-block border-2 border-[var(--mn-ink)] px-2 text-2xl">
                        {fmtDate(m.time, lang, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-[var(--mn-ink-2)]">
                      {m.status === 'live'
                        ? t(C.live, lang)
                        : fmtDate(m.time, lang, { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2.5">
                    {away && <Crest tag={m.away} className="size-8" />}
                    <span className="mn-h break-words text-xl md:text-2xl">
                      {away ? away.name[lang] : t(C.tour.tbd, lang)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2 className="mn-d mb-8 text-4xl md:text-5xl">{t(Q.about, lang)}</h2>
          <p className="text-xl leading-relaxed">{t(C.clan.description, lang)}</p>
        </div>
      </section>

      <Footer lang={lang} />
      {menu ? <MenuOverlay lang={lang} /> : <MobileBug lang={lang} state={bug} />}
    </div>
  );
}
