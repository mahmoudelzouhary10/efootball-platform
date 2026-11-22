/* DESIGN PREVIEW ONLY — MATCHNIGHT: editorial by day (chalk), broadcast by night (live). */
import { ArrowLeft, ArrowRight, Menu, Trophy, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { C, fmtDate } from '../copy';
import { CLANS, clan, LIVE_GAMES, type Lang, MATCHES, ROSTER, TOURNAMENT, winRate } from '../data';
import { Emblem } from '../emblem';
import { OPPONENTS, TOP_PLAYERS } from '../hybrid/extra';
import { RevealWhenOffscreen } from './reveal';
import type { PPlayer } from '../data';

type P = { lang: Lang };
/** What the persistent bug shows. Derived from real match state: a live match the user can follow,
 *  else the user's own next match within 24h, else nothing. */
export type BugState = 'live' | 'upcoming' | 'none';
export type ViewProps = P & { state?: 'live' | 'upcoming'; bug?: BugState; menu?: boolean };
type T = { ar: string; en: string };
const t = (n: T, lang: Lang) => n[lang];
const LIVE = MATCHES.find((m) => m.id === 'sf1')!;
const pts = (r: { w: number; d: number }) => r.w * 3 + r.d;
const pname = (u: string, lang: Lang) =>
  ROSTER.find((r) => r.username === u)?.name[lang] ?? OPPONENTS[u]?.[lang] ?? u;
const Arrow = ({ lang, className = 'size-5' }: P & { className?: string }) =>
  lang === 'ar' ? <ArrowLeft className={className} /> : <ArrowRight className={className} />;

const M = {
  nav: {
    matches: { ar: 'المباريات', en: 'Matches' },
    competitions: { ar: 'البطولات', en: 'Competitions' },
    clans: { ar: 'الكلانات', en: 'Clans' },
    players: { ar: 'اللاعبون', en: 'Players' },
    menu: { ar: 'القائمة', en: 'Menu' },
    home: { ar: 'الرئيسية', en: 'Home' },
  },
  tonight: { ar: 'الليلة', en: 'Tonight' },
  games: { ar: 'مواجهات فردية', en: 'games won' },
  enter: { ar: 'ادخل مركز المباراة', en: 'Enter the match centre' },
  game: { ar: 'المواجهة', en: 'Game' },
  inPlay: { ar: 'تُلعب الآن', en: 'In play' },
  results: { ar: 'نتائج الأمس', en: 'Last night' },
  road: { ar: 'الطريق إلى النهائي', en: 'The road to the final' },
  final: { ar: 'النهائي', en: 'The final' },
  table: { ar: 'جدول دوري النيل', en: 'Nile League table' },
  tableNote: {
    ar: 'الأربعة الأوائل إلى الأدوار الإقصائية',
    en: 'Top four go through to the knockouts',
  },
  rank: { ar: 'تصنيف اللاعبين', en: 'Player rankings' },
  rankNote: {
    ar: 'حسب نسبة الفوز — لاعبون موثّقون، 50 مباراة على الأقل',
    en: 'By win rate — verified players, 50+ matches',
  },
  rankFirst: { ar: 'في الصدارة', en: 'Top of the rankings' },
  fullRank: { ar: 'التصنيف كاملًا', en: 'Full rankings' },
  awaiting: { ar: 'بانتظار النتيجة', en: 'Awaiting result' },
  pending: { ar: 'تُلعب', en: 'Playing' },
  progress: { ar: 'مواجهات مؤكدة', en: 'games confirmed' },
  vsNow: {
    ar: 'تُلعب الآن — تظهر النتيجة بعد تأكيد الطرفين',
    en: 'In play — the score appears once both sides confirm it',
  },
  kickoff: { ar: 'تبدأ خلال', en: 'Starts in' },
  days: { ar: 'يوم', en: 'd' },
  hours: { ar: 'ساعة', en: 'h' },
  mins: { ar: 'دقيقة', en: 'm' },
  form: { ar: 'آخر 5 مواجهات', en: 'Last five' },
  record: { ar: 'سجل الموسم', en: 'Season record' },
  pairings: {
    ar: 'تُعلن أزواج المواجهات عند تسجيل الحضور',
    en: 'Game pairings are published at check-in',
  },
  yourNext: { ar: 'مباراتك القادمة', en: 'Your next match' },
  account: { ar: 'حسابي', en: 'My account' },
  profile: { ar: 'ملفي', en: 'My profile' },
  myClan: { ar: 'كلاني', en: 'My clan' },
  admin: { ar: 'الإدارة', en: 'Admin' },
  language: { ar: 'English', en: 'العربية' },
  close: { ar: 'إغلاق', en: 'Close' },
  winRate: { ar: 'نسبة الفوز', en: 'win rate' },
  goals: { ar: 'هدف', en: 'goals' },
  matches: { ar: 'مباراة', en: 'matches' },
  comps: { ar: 'البطولات', en: 'Competitions' },
  open: { ar: 'التسجيل مفتوح حتى 27 نوفمبر', en: 'Registration open until Nov 27' },
  soon: { ar: 'تبدأ 5 ديسمبر', en: 'Starts Dec 5' },
  semis: { ar: 'نصف النهائي يُلعب الآن', en: 'Semi-finals in play' },
  current: { ar: 'المواجهة الحالية', en: 'Current game' },
  log: { ar: 'سجل المواجهة', en: 'Match log' },
  rules: { ar: 'القواعد', en: 'The rules' },
  r1: {
    ar: 'خمس مواجهات فردية بين لاعبي الكلانين.',
    en: 'Five individual games between the two clans.',
  },
  r2: {
    ar: 'يفوز الكلان صاحب العدد الأكبر من المواجهات.',
    en: 'The clan that wins more games wins the tie.',
  },
  r3: {
    ar: 'تعادل في الإقصائيات؟ مباراة حاسمة بين القائدين.',
    en: 'Level in a knockout? A decider between the two leaders.',
  },
  aggregate: { ar: 'مجموع الأهداف', en: 'Aggregate goals' },
  confirmed: { ar: 'نتيجة مؤكدة من الطرفين', en: 'Confirmed by both sides' },
  leads: { ar: 'يتقدم', en: 'lead' },
  level: { ar: 'تعادل', en: 'level' },
  needs: {
    ar: 'التعادل في المواجهة الخامسة يكفي ملوك النيل',
    en: 'A draw in game five is enough for Nile Kings',
  },
  referee: { ar: 'الحكم', en: 'Referee' },
  chapters: {
    bracket: { ar: 'القوس', en: 'Bracket' },
    groups: { ar: 'المجموعات', en: 'Groups' },
    fixtures: { ar: 'المواعيد', en: 'Fixtures' },
    rules: { ar: 'القواعد', en: 'Rules' },
  },
  season: { ar: 'الموسم', en: 'Season' },
  champion: { ar: 'البطل', en: 'Champion' },
  winnerOf: { ar: 'الفائز من', en: 'Winner of' },
  advance: { ar: 'يتأهل', en: 'Through' },
  day: { ar: 'الجولة الثالثة', en: 'Matchday 3' },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// Primitives
// ════════════════════════════════════════════════════════════════════════════

function Crest({
  tag,
  className = 'size-10',
  shape = 'shield' as 'shield' | 'hex',
}: {
  tag: string;
  className?: string;
  shape?: 'shield' | 'hex';
}) {
  const c = clan(tag);
  return (
    <Emblem
      kind={c.emblem}
      colors={c.colors}
      shape={shape}
      className={`shrink-0 ${className}`}
      title={c.name.en}
    />
  );
}

/** Direction-following score: each number next to its own side. */
function Score({
  v,
  className = '',
  dash = true,
}: {
  v: [number, number];
  className?: string;
  dash?: boolean | 'bar';
}) {
  return (
    <span className={`inline-flex items-baseline gap-[0.18em] ${className}`}>
      <span className="mn-n">{v[0]}</span>
      {dash === 'bar' ? (
        <span
          className="mn-slant mx-[0.08em] inline-block h-[0.07em] w-[0.28em] self-center bg-current opacity-50"
          aria-hidden
        />
      ) : (
        dash && <span className="mn-n opacity-35">–</span>
      )}
      <span className="mn-n">{v[1]}</span>
    </span>
  );
}

function Live({ lang, className = '' }: P & { className?: string }) {
  return (
    <span
      className={`mn-slant inline-flex bg-[var(--mn-signal)] px-2.5 py-0.5 text-white ${className}`}
    >
      <span className="mn-unslant flex items-center gap-1.5 text-xs font-bold">
        <span className="mn-pulse size-1.5 rounded-full bg-white" />
        {t(C.live, lang)}
      </span>
    </span>
  );
}

/** Games in the series, one slot each; filled with the winner's colour. */
function gameWinner(g: (typeof LIVE_GAMES)[number]) {
  if (!g.score || g.state !== 'done') return null;
  return g.score[0] > g.score[1] ? 'h' : g.score[0] < g.score[1] ? 'a' : 'd';
}

const wrap = 'mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12';

// ════════════════════════════════════════════════════════════════════════════
// Chrome: masthead + live scorebug (no sidebar, no tab bar)
// ════════════════════════════════════════════════════════════════════════════

const DONE = LIVE_GAMES.filter((g) => g.state === 'done').length;
const NEXT = MATCHES.find((m) => m.id === 'l1')!;

/** Live bug: series score + how many individual games are confirmed. No invented match clock. */
function LiveBug({ lang, className = '' }: P & { className?: string }) {
  const h = clan(LIVE.home);
  const a = clan(LIVE.away);
  return (
    <a
      className={`group flex items-stretch overflow-hidden bg-[var(--mn-night)] text-white ${className}`}
      aria-label={`${t(C.live, lang)}: ${h.name[lang]} ${LIVE.games![0]}–${LIVE.games![1]} ${a.name[lang]}`}
    >
      <span className="flex items-center bg-[var(--mn-signal)] px-2.5">
        <span className="mn-pulse size-2 rounded-full bg-white" />
      </span>
      <span className="w-1.5" style={{ background: h.colors[0] }} />
      <span className="flex items-center gap-2 px-3 py-2">
        <span className="mn-h text-[15px] uppercase rtl:normal-case">{h.tag}</span>
        <span className="bg-white px-1.5 text-[var(--mn-ink)]">
          <Score v={LIVE.games!} className="text-lg" />
        </span>
        <span className="mn-h text-[15px] uppercase rtl:normal-case">{a.tag}</span>
        <span className="mn-n text-sm text-white/60">
          {DONE}/{LIVE_GAMES.length}
        </span>
      </span>
      <span className="w-1.5" style={{ background: a.colors[0] }} />
    </a>
  );
}

type NavKey = 'matches' | 'competitions' | 'clans' | 'players' | 'home';
const NAV_KEYS = ['matches', 'competitions', 'clans', 'players'] as const;

function Masthead({
  lang,
  night = false,
  active,
  liveBug = true,
}: P & { night?: boolean; active: NavKey; liveBug?: boolean }) {
  const fg = night ? 'text-white' : 'text-[var(--mn-ink)]';
  const mute = night ? 'text-[var(--mn-night-mute)]' : 'text-[var(--mn-ink-2)]';
  return (
    <header
      className={`relative z-30 ${night ? 'bg-[var(--mn-night)]' : 'bg-[var(--mn-chalk)]'} ${fg}`}
    >
      <div className={`${wrap} flex h-16 items-center gap-8 sm:h-20`}>
        <a className="flex items-center gap-2.5" aria-label={t(M.nav.home, lang)}>
          <span
            className={`mn-slant grid h-8 w-6 place-items-center ${night ? 'bg-white' : 'bg-[var(--mn-ink)]'}`}
          />
          <span className="mn-d whitespace-nowrap text-xl sm:text-[1.7rem]">
            {lang === 'ar' ? 'ساحة الكلانات' : 'Clan Arena'}
          </span>
        </a>
        {/* Sections stay visible on desktop: distinctive, but never hidden behind a menu. */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV_KEYS.map((k) => (
            <a
              key={k}
              aria-current={active === k ? 'page' : undefined}
              className={`mn-h text-lg ${active === k ? `${fg} underline decoration-[3px] underline-offset-[10px]` : mute}`}
            >
              {t(M.nav[k], lang)}
            </a>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-3 sm:gap-4">
          {liveBug && <LiveBug lang={lang} className="hidden md:flex" />}
          <a className={`hidden text-sm sm:inline ${mute}`} lang={lang === 'ar' ? 'en' : 'ar'}>
            {t(M.language, lang)}
          </a>
          {/* Labelled menu button: an icon alone is not enough for first-time users. */}
          <button
            type="button"
            className={`flex h-11 items-center gap-2 border-2 px-3 font-semibold ${night ? 'border-white/30' : 'border-[var(--mn-ink)]'}`}
            aria-haspopup="dialog"
          >
            <Menu className="size-5" />
            <span className="text-sm">{t(M.nav.menu, lang)}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Full-screen menu. Every destination, including Admin for staff, in large type. */
function MenuOverlay({ lang }: P) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(M.nav.menu, lang)}
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--mn-ink)] text-white"
    >
      <div className={`${wrap} flex h-16 items-center justify-between sm:h-20`}>
        <span className="mn-d text-2xl">{lang === 'ar' ? 'ساحة الكلانات' : 'Clan Arena'}</span>
        <button
          type="button"
          className="flex h-11 items-center gap-2 border-2 border-white/30 px-3 font-semibold"
        >
          <X className="size-5" />
          <span className="text-sm">{t(M.close, lang)}</span>
        </button>
      </div>
      <div className={`${wrap} pb-16 pt-6`}>
        <LiveBug lang={lang} className="mb-8 w-fit" />
        <nav aria-label="Main">
          <ol>
            {(['home', ...NAV_KEYS] as const).map((k) => (
              <li key={k} className="border-t border-white/15">
                <a
                  className={`mn-d flex items-center justify-between py-4 ${lang === 'ar' ? 'text-4xl' : 'text-5xl'}`}
                >
                  {t(M.nav[k], lang)}
                  <Arrow lang={lang} className="size-7 text-white/40" />
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-10 text-sm text-white/50">{t(M.account, lang)}</p>
        <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-3 text-lg font-semibold">
          <li>
            <a>{t(M.profile, lang)}</a>
          </li>
          <li>
            <a>{t(M.myClan, lang)}</a>
          </li>
          <li>
            <a>{t(M.admin, lang)}</a>
          </li>
          <li>
            <a lang={lang === 'ar' ? 'en' : 'ar'}>{t(M.language, lang)}</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Mobile: one persistent bug at the bottom, driven by real state.
 * live → the live match · upcoming → the user's next match within 24h · none → not rendered.
 * Pages reserve its height (pb) so it never covers content; it is hidden while the menu is open
 * and on the match centre itself, which has its own sticky score bar.
 */
function MobileBug({ lang, state }: P & { state: BugState }) {
  if (state === 'none') return null;
  if (state === 'upcoming') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
        <a className="flex h-14 items-stretch bg-[var(--mn-ink)] text-white">
          <span className="flex items-center bg-white/10 px-3 text-xs font-semibold">
            {t(M.yourNext, lang)}
          </span>
          <span className="flex flex-1 items-center justify-between gap-2 px-3">
            <span className="mn-h truncate text-base">{clan(NEXT.home).name[lang]}</span>
            <span className="mn-n shrink-0 bg-white px-2 text-lg text-[var(--mn-ink)]">
              {fmtDate(NEXT.time, lang, { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <span className="mn-h truncate text-base">{clan(NEXT.away).name[lang]}</span>
          </span>
        </a>
      </div>
    );
  }
  return (
    <RevealWhenOffscreen targetId="mn-live-hero">
      <div className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
        <a
          className="flex h-14 items-stretch bg-[var(--mn-night)] text-white shadow-[0_-8px_24px_rgb(0_0_0/0.25)]"
          aria-label={`${t(C.live, lang)}: ${clan(LIVE.home).name[lang]} ${LIVE.games![0]}–${LIVE.games![1]} ${clan(LIVE.away).name[lang]}`}
        >
          <span className="flex items-center bg-[var(--mn-signal)] px-3">
            <span className="mn-pulse size-2 rounded-full bg-white" />
          </span>
          <span className="w-2" style={{ background: clan(LIVE.home).colors[0] }} />
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3">
            <span className="mn-h truncate text-base">{clan(LIVE.home).name[lang]}</span>
            <span className="shrink-0 bg-white px-2 text-[var(--mn-ink)]">
              <Score v={LIVE.games!} className="text-xl" />
            </span>
            <span className="mn-h truncate text-base">{clan(LIVE.away).name[lang]}</span>
          </span>
          <span className="w-2" style={{ background: clan(LIVE.away).colors[0] }} />
          <span className="mn-n flex items-center px-3 text-sm text-white/60">
            {DONE}/{LIVE_GAMES.length}
          </span>
        </a>
      </div>
    </RevealWhenOffscreen>
  );
}

/** Bottom padding a page reserves for the bug, so the last content is never covered. */
const bugPad = (s: BugState) =>
  s === 'none' ? '' : 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0';

function Footer({ lang }: P) {
  return (
    <footer className="bg-[var(--mn-ink)] py-14 text-white">
      <div className={`${wrap} flex flex-wrap items-end justify-between gap-6`}>
        <span className="mn-d text-5xl sm:text-7xl">
          {lang === 'ar' ? 'ساحة الكلانات' : 'Clan Arena'}
        </span>
        <span className="text-sm text-white/50">© 2026</span>
      </div>
    </footer>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// The night frame — shared by Home (opening) and Match Centre (hero)
// ════════════════════════════════════════════════════════════════════════════

function NightFrame({
  lang,
  tall = false,
  state = 'live',
}: P & { tall?: boolean; state?: 'live' | 'upcoming' }) {
  const m = state === 'live' ? LIVE : NEXT;
  const h = clan(m.home);
  const a = clan(m.away);
  const style = { '--home': h.colors[0], '--away': a.colors[0] } as CSSProperties;
  const nameCls =
    lang === 'ar' ? 'text-5xl md:text-7xl xl:text-8xl' : 'text-6xl md:text-8xl xl:text-[8.5rem]';
  return (
    <section
      id={state === 'live' ? 'mn-live-hero' : undefined}
      className="mn-split mn-wipe relative overflow-hidden text-white"
      style={style}
    >
      {/* Crests as image material, cropped off the edges */}
      <Emblem
        kind={h.emblem}
        colors={['#ffffff', '#ffffff']}
        shape="bare"
        className="pointer-events-none absolute -start-[6vw] top-1/2 hidden size-[38vw] -translate-y-1/2 opacity-[0.13] md:block"
      />
      <Emblem
        kind={a.emblem}
        colors={['#ffffff', '#ffffff']}
        shape="bare"
        className="pointer-events-none absolute -end-[6vw] top-1/2 hidden size-[38vw] -translate-y-1/2 opacity-[0.13] md:block"
      />

      <div
        className={`${wrap} relative flex flex-col ${tall ? 'min-h-[82vh] py-10 md:py-14' : 'min-h-[78vh] py-8 md:py-12'}`}
      >
        <p className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/85 md:text-base">
          {state === 'live' && <Live lang={lang} />}
          {state === 'live'
            ? `${t(TOURNAMENT.name, lang)} — ${t(m.round, lang)}`
            : t(m.round, lang)}
        </p>

        <div className="grid flex-1 grid-cols-1 items-center gap-6 py-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
          <div className="self-start md:pt-6">
            <Crest tag={h.tag} className="mb-4 size-16 md:size-24" />
            <h2 className={`mn-d ${nameCls}`}>{h.name[lang]}</h2>
          </div>
          {state === 'live' ? (
            <div className="flex flex-col items-center">
              <Score
                v={LIVE.games!}
                dash="bar"
                className="mn-big text-[9rem] leading-none md:text-[13rem] xl:text-[17rem]"
              />
              <p className="-mt-2 text-sm font-semibold uppercase tracking-wide text-white/70 rtl:normal-case">
                {t(M.games, lang)}
              </p>
            </div>
          ) : (
            <Countdown lang={lang} />
          )}
          <div className="self-end text-end md:pb-6">
            <Crest tag={a.tag} className="mb-4 ms-auto size-16 md:size-24" />
            <h2 className={`mn-d ${nameCls}`}>{a.name[lang]}</h2>
          </div>
        </div>

        {state === 'live' ? (
          /* Series tracker: one slot per individual game, filled with the winner's colour once confirmed. */
          <div
            className="grid grid-cols-5 gap-1.5 bg-[var(--mn-night)] p-1.5 md:gap-2 md:p-2"
            role="list"
            aria-label={t(M.log, lang)}
          >
            {LIVE_GAMES.map((g, i) => {
              const w = gameWinner(g);
              const bg =
                w === 'h'
                  ? h.colors[0]
                  : w === 'a'
                    ? a.colors[0]
                    : w === 'd'
                      ? '#4b5568'
                      : undefined;
              const pending = g.state !== 'done';
              return (
                <div
                  key={i}
                  role="listitem"
                  className={`relative min-h-[4.25rem] px-2 py-2 md:min-h-[5.5rem] md:px-4 md:py-3 ${pending ? 'border-2 border-dashed border-white/40' : ''}`}
                  style={bg ? { background: bg } : undefined}
                >
                  <p className="mn-n text-xs text-white/70 md:text-sm">{i + 1}</p>
                  {pending ? (
                    <p className="mt-1 text-xs font-semibold leading-tight md:text-sm">
                      <span className="md:hidden">{t(M.pending, lang)}</span>
                      <span className="hidden md:inline">{t(M.awaiting, lang)}</span>
                    </p>
                  ) : (
                    <Score v={g.score!} className="text-2xl md:text-4xl" />
                  )}
                  <p className="mt-1 hidden truncate text-xs text-white/80 md:block">
                    {pname(g.home, lang).split(' ')[0]} · {pname(g.away, lang).split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="border-t border-white/20 pt-4 text-white/80">{t(M.pairings, lang)}</p>
        )}
      </div>
    </section>
  );
}

/** Countdown to the scheduled start (preview fixes "now" so screenshots are stable). */
const PREVIEW_NOW = Date.parse('2026-11-22T06:30:00Z');
function Countdown({ lang }: P) {
  const ms = Date.parse(NEXT.time) - PREVIEW_NOW;
  const d = Math.floor(ms / 864e5);
  const hr = Math.floor((ms % 864e5) / 36e5);
  const mi = Math.floor((ms % 36e5) / 6e4);
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold text-white/70">{t(M.kickoff, lang)}</p>
      <p className="flex items-end gap-3 md:gap-5">
        {(
          [
            [d, M.days],
            [hr, M.hours],
            [mi, M.mins],
          ] as const
        ).map(([v, l], i) => (
          <span key={i} className="flex flex-col items-center">
            <span className="mn-n mn-big text-[5.5rem] leading-none md:text-[8rem]">
              {String(v).padStart(2, '0')}
            </span>
            <span className="text-sm text-white/70">{t(l, lang)}</span>
          </span>
        ))}
      </p>
      <p className="mt-3 font-semibold">
        {fmtDate(NEXT.time, lang, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. HOME — "tonight's programme"
// ════════════════════════════════════════════════════════════════════════════

export function MatchnightHome({ lang, bug = 'live', menu = false }: ViewProps) {
  const table = [...CLANS].sort((a, b) => pts(b.record) - pts(a.record)).slice(0, 6);
  const yesterday = MATCHES.filter((m) => m.status === 'finished');
  const ranked = [...TOP_PLAYERS]
    .concat(
      ROSTER.filter((r) => !TOP_PLAYERS.some((x) => x.p.username === r.username)).map((p) => ({
        p,
        clan: 'NILE',
      })),
    )
    .filter((r) => r.p.verified && r.p.stats.matches >= 50)
    .sort((a, b) => winRate(b.p.stats) - winRate(a.p.stats));
  const leader = ranked[0]!;
  const chasers = ranked.slice(1, 5);
  return (
    <div className={bugPad(bug)}>
      <Masthead lang={lang} active="home" />
      <NightFrame lang={lang} />
      <div className="bg-[var(--mn-night)] text-white">
        <a className={`${wrap} flex items-center justify-between py-5 text-lg font-semibold`}>
          {t(M.enter, lang)}
          <Arrow lang={lang} className="size-6" />
        </a>
      </div>

      {/* Last night — scorelines as type, no boxes */}
      <section className={`${wrap} py-16 md:py-24`}>
        <h2 className="mn-d mb-10 text-4xl md:text-6xl">{t(M.results, lang)}</h2>
        <ul className="grid gap-x-12 gap-y-10 md:grid-cols-3">
          {yesterday.map((m) => (
            <li key={m.id} className="border-t-[3px] border-[var(--mn-ink)] pt-4">
              <p className="mb-3 text-sm text-[var(--mn-ink-2)]">
                {t(m.round, lang)} · {fmtDate(m.time, lang)}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`mn-h truncate text-2xl ${m.games![0] > m.games![1] ? '' : 'text-[var(--mn-ink-2)]'}`}
                  >
                    {clan(m.home).name[lang]}
                  </p>
                  <p
                    className={`mn-h truncate text-2xl ${m.games![1] > m.games![0] ? '' : 'text-[var(--mn-ink-2)]'}`}
                  >
                    {clan(m.away).name[lang]}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="mn-n text-[2.75rem]">{m.games![0]}</span>
                  <span className="mn-n text-[2.75rem]">{m.games![1]}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* The road to the final — asymmetric: headline + date on one side, path on the other */}
      <section className="bg-[var(--mn-chalk-2)]">
        <div
          className={`${wrap} grid gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]`}
        >
          <div>
            <p className="font-semibold text-[var(--mn-ink-2)]">{t(TOURNAMENT.name, lang)}</p>
            <h2
              className={`mn-d mt-3 ${lang === 'ar' ? 'text-5xl md:text-7xl' : 'text-6xl md:text-8xl'}`}
            >
              {t(M.road, lang)}
            </h2>
            <p className="mt-8 flex items-end gap-4">
              <span className="mn-n text-[7rem] md:text-[10rem]">06</span>
              <span className="pb-3 text-xl font-semibold">
                {fmtDate(TOURNAMENT.bracket.final.time, lang, { month: 'long' })}
              </span>
            </p>
          </div>
          <MiniBracket lang={lang} />
        </div>
      </section>

      {/* Standings as a broadcast table graphic */}
      <section className={`${wrap} py-16 md:py-24`}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="mn-d text-4xl md:text-6xl">{t(M.table, lang)}</h2>
          <p className="text-[var(--mn-ink-2)]">{t(M.tableNote, lang)}</p>
        </div>
        <Standings
          lang={lang}
          rows={table.map((c) => ({
            tag: c.tag,
            p: c.record.p,
            gd: c.record.gf - c.record.ga,
            pts: pts(c.record),
            form: c.form,
          }))}
          cut={4}
        />
      </section>

      {/* Rankings — the leader gets the stage, the chasers are a ranked list (derived from real stats) */}
      <section className="relative overflow-hidden bg-[var(--mn-ink)] text-white">
        <div
          className="absolute inset-y-0 end-0 hidden w-[38%] lg:block"
          style={{
            background: clan(leader.clan).colors[0],
            clipPath:
              lang === 'ar'
                ? 'polygon(0 0, 88% 0, 100% 100%, 0 100%)'
                : 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div
          className={`${wrap} relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_auto]`}
        >
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-semibold text-white/70">{t(M.rank, lang)}</p>
              <p className="text-sm text-white/50">{t(M.rankNote, lang)}</p>
            </div>
            <div className="mt-6 flex items-start gap-5">
              <span className="mn-n mn-big text-[6rem] leading-none text-[var(--mn-gold)] md:text-[8rem]">
                1
              </span>
              <div className="min-w-0 pt-2">
                <p className="text-sm font-semibold text-white/60">{t(M.rankFirst, lang)}</p>
                <h2
                  className={`mn-d mt-1 ${lang === 'ar' ? 'text-5xl md:text-7xl' : 'text-6xl md:text-8xl'}`}
                >
                  {leader.p.name[lang]}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-white/75">
                  <Crest tag={leader.clan} className="size-6" /> {clan(leader.clan).name[lang]} ·{' '}
                  <span className="mn-n">{leader.p.position}</span>
                </p>
              </div>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
              {(
                [
                  [`${winRate(leader.p.stats)}%`, M.winRate],
                  [leader.p.stats.matches, M.matches],
                  [leader.p.stats.goals, M.goals],
                ] as const
              ).map(([v, l], i) => (
                <div key={i}>
                  <dd className="mn-n text-5xl md:text-6xl">{v}</dd>
                  <dt className="mt-1 text-white/70">{t(l, lang)}</dt>
                </div>
              ))}
            </dl>
            <ol className="mt-10 max-w-xl" start={2}>
              {chasers.map((r, i) => (
                <li
                  key={r.p.username}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/15 py-3"
                >
                  <span className="mn-n text-2xl text-white/50">{i + 2}</span>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Crest tag={r.clan} className="size-6" />
                    <span className="mn-h truncate text-xl">{r.p.name[lang]}</span>
                  </span>
                  <span className="mn-n text-2xl">{winRate(r.p.stats)}%</span>
                </li>
              ))}
            </ol>
            <a className="mt-6 inline-flex items-center gap-2 font-semibold underline underline-offset-4">
              {t(M.fullRank, lang)} <Arrow lang={lang} />
            </a>
          </div>
          <PlayerCard lang={lang} p={leader.p} tag={leader.clan} />
        </div>
      </section>

      {/* Competitions — editorial index, not tiles */}
      <section className={`${wrap} py-16 md:py-24`}>
        <h2 className="mn-d mb-8 text-4xl md:text-6xl">{t(M.comps, lang)}</h2>
        <ol>
          {(
            [
              [TOURNAMENT.name, M.semis, 'live'],
              [{ ar: 'دوري النيل الأسبوعي', en: 'Nile Weekly League' }, M.open, 'open'],
              [{ ar: 'كأس الخليج السوبر', en: 'Gulf Super Cup' }, M.soon, 'soon'],
            ] as const
          ).map(([name, note, s], i) => (
            <li
              key={i}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t-[3px] border-[var(--mn-ink)] py-6 last:border-b-[3px]"
            >
              <div className="min-w-0">
                <p
                  className={`mn-d truncate ${lang === 'ar' ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl'}`}
                >
                  {name[lang]}
                </p>
                <p className="mt-2 text-[var(--mn-ink-2)]">{t(note, lang)}</p>
              </div>
              <span className="flex items-center gap-4">
                {s === 'live' && <Live lang={lang} />}
                {s === 'open' && (
                  <span className="bg-[var(--mn-pitch)] px-2.5 py-0.5 text-xs font-bold text-white">
                    {lang === 'ar' ? 'مفتوح' : 'Open'}
                  </span>
                )}
                <Arrow lang={lang} className="size-7" />
              </span>
            </li>
          ))}
        </ol>
      </section>
      <Footer lang={lang} />
      {menu ? <MenuOverlay lang={lang} /> : <MobileBug lang={lang} state={bug} />}
    </div>
  );
}

function MiniBracket({ lang }: P) {
  const [sf1, sf2] = TOURNAMENT.bracket.semis;
  const tie = (m: typeof sf1) => (
    <div
      className={`${m!.status === 'live' ? 'bg-[var(--mn-night)] text-white' : 'border-t-[3px] border-[var(--mn-ink)]'} px-4 py-3`}
    >
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={m!.status === 'live' ? 'text-white/60' : 'text-[var(--mn-ink-2)]'}>
          {t(C.tour.semi, lang)}
        </span>
        {m!.status === 'live' && <Live lang={lang} />}
      </div>
      {[
        [m!.home, m!.games[0]],
        [m!.away, m!.games[1]],
      ].map(([tag, g], i) => (
        <div key={i} className="flex items-center gap-3 py-1">
          <Crest tag={tag as string} className="size-7" />
          <span className="mn-h min-w-0 flex-1 truncate text-xl">
            {clan(tag as string).name[lang]}
          </span>
          <span className="mn-n text-3xl">{g as number}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        {tie(sf1)}
        {tie(sf2)}
      </div>
      <div className="relative bg-[var(--mn-ink)] p-6 text-white">
        <div className="mn-gold absolute inset-x-0 top-0 h-1.5" />
        <Trophy className="size-10 text-[var(--mn-gold)]" />
        <p className="mn-d mt-4 text-4xl">{t(M.final, lang)}</p>
        <div className="mt-5 flex items-center gap-3">
          <Crest tag="CEG" className="size-9" />
          <span className="mn-h text-xl">{clan('CEG').name[lang]}</span>
        </div>
        <p className="my-2 text-white/50">{t(C.vs, lang)}</p>
        <div className="flex items-center gap-3 text-white/70">
          <span className="flex -space-x-2 rtl:space-x-reverse">
            <Crest tag="NILE" className="size-9" />
            <Crest tag="GST" className="size-9" />
          </span>
          <span className="text-sm">
            {t(M.winnerOf, lang)} {clan('NILE').name[lang]} / {clan('GST').name[lang]}
          </span>
        </div>
      </div>
    </div>
  );
}

function Standings({
  lang,
  rows,
  cut,
}: P & {
  rows: { tag: string; p: number; gd: number; pts: number; form?: ('W' | 'D' | 'L')[] }[];
  cut: number;
}) {
  const hasForm = rows.some((r) => r.form);
  const cols = hasForm
    ? 'md:grid-cols-[4rem_minmax(0,1fr)_4rem_4.5rem_8rem_5rem]'
    : 'md:grid-cols-[4rem_minmax(0,1fr)_4rem_4.5rem_5rem]';
  return (
    <div>
      <div
        className={`grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem_3.25rem] items-end gap-2 md:gap-3 border-b-[3px] border-[var(--mn-ink)] pb-2 text-xs text-[var(--mn-ink-2)] ${cols}`}
      >
        <span>#</span>
        <span>{t(C.nav.clans, lang)}</span>
        <span className="text-center">{t(C.clan.played, lang)}</span>
        <span className="hidden text-center md:block">{t(C.clan.gd, lang)}</span>
        {hasForm && <span className="hidden md:block">{t(C.clan.form, lang)}</span>}
        <span className="text-end">{t(C.clan.pts, lang)}</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.tag}
          className={`grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem_3.25rem] items-center gap-2 py-3 md:gap-3 ${cols} ${i === cut - 1 ? 'border-b-[3px] border-dashed border-[var(--mn-pitch)]' : 'border-b border-[var(--mn-rule)]'}`}
        >
          <span className="mn-n text-3xl md:text-5xl">{i + 1}</span>
          <span className="flex min-w-0 items-center gap-3">
            <span
              className="mn-kit hidden h-10 w-5 shrink-0 sm:block"
              style={{ background: clan(r.tag).colors[0] }}
            />
            <Crest tag={r.tag} className="size-8 md:size-9" />
            <span className="mn-h truncate text-lg md:text-3xl">{clan(r.tag).name[lang]}</span>
          </span>
          <span className="mn-n text-center text-2xl">{r.p}</span>
          <span className="mn-n hidden text-center text-2xl md:block">
            {r.gd > 0 ? `+${r.gd}` : r.gd}
          </span>
          {hasForm && (
            <span className="hidden gap-1 md:flex">
              {r.form?.map((f, j) => (
                <span
                  key={j}
                  className={`mn-n grid size-6 place-items-center text-sm text-white ${f === 'W' ? 'bg-[var(--mn-pitch)]' : f === 'D' ? 'bg-[#9aa1ab]' : 'bg-[var(--mn-signal)]'}`}
                >
                  {f}
                </span>
              ))}
            </span>
          )}
          <span className="mn-n text-end text-3xl md:text-5xl">{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Player identity mark. A real uploaded image always wins; otherwise a typographic monogram:
 * the name's first letter, set huge in the clan's colour, with the position as a tag.
 */
function Monogram({
  p,
  tag,
  lang,
  image,
  className = '',
}: P & { p: PPlayer; tag: string; image?: string; className?: string }) {
  const c = clan(tag);
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- preview only; production uses the existing avatar component
      <img src={image} alt={p.name[lang]} className={`aspect-square object-cover ${className}`} />
    );
  }
  const letter = [...p.name[lang].trim()][0] ?? '?';
  return (
    <div
      className={`relative grid aspect-square place-items-center overflow-hidden ${className}`}
      style={{ background: c.colors[0] }}
      role="img"
      aria-label={p.name[lang]}
    >
      <span
        className="mn-d select-none text-[7rem] leading-none text-white/95"
        style={{ color: c.colors[1] }}
      >
        {letter}
      </span>
      <span className="mn-n absolute bottom-2 end-2 bg-[var(--mn-ink)] px-1.5 text-sm text-white">
        {p.position}
      </span>
    </div>
  );
}

function PlayerCard({ lang, p, tag, image }: P & { p: PPlayer; tag: string; image?: string }) {
  const c = clan(tag);
  return (
    <div className="mn-cut mn-gold mx-auto w-60 p-[3px] md:w-72">
      <div className="mn-cut relative overflow-hidden bg-[var(--mn-night)] text-white">
        <Monogram p={p} tag={tag} lang={lang} image={image} className="w-full" />
        <div className="flex items-end justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="mn-h truncate text-2xl">{p.name[lang]}</p>
            <p className="truncate text-sm text-white/60">{c.name[lang]}</p>
          </div>
          <div className="text-end">
            <p className="mn-n mn-big text-5xl">{Math.round(winRate(p.stats))}</p>
            <p className="text-xs text-white/60">{t(M.winRate, lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. MATCH CENTRE — the broadcast (live state)
// ════════════════════════════════════════════════════════════════════════════

const LOG_TIMES = ['19:18', '19:41', '20:03', '20:27'];

function MiniMono({ name, color, ink }: { name: string; color: string; ink: string }) {
  return (
    <span
      className="mn-d grid size-16 shrink-0 place-items-center text-5xl md:size-20 md:text-6xl"
      style={{ background: color, color: ink }}
      aria-hidden
    >
      {[...name.trim()][0]}
    </span>
  );
}

export function MatchnightLive({ lang, state = 'live' }: ViewProps) {
  const m = state === 'live' ? LIVE : NEXT;
  const h = clan(m.home);
  const a = clan(m.away);
  const cur = LIVE_GAMES[4]!;
  const curHome = ROSTER.find((r) => r.username === cur.home)!;
  let hs = 0;
  let aw = 0;
  return (
    <div className="mn-night min-h-dvh">
      <Masthead lang={lang} night active="matches" liveBug={false} />
      {/* Mobile: the score stays reachable at the top while scrolling — the bottom bug is not used here. */}
      <div className="sticky top-0 z-20 flex h-12 items-stretch border-b border-[var(--mn-night-line)] bg-[var(--mn-night)] md:hidden">
        <span className="w-1.5" style={{ background: h.colors[0] }} />
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-4">
          <span className="mn-h truncate">{h.name[lang]}</span>
          {state === 'live' ? (
            <span className="shrink-0 bg-white px-2 text-[var(--mn-ink)]">
              <Score v={LIVE.games!} className="text-lg" />
            </span>
          ) : (
            <span className="mn-n shrink-0 bg-white px-2 text-lg text-[var(--mn-ink)]">
              {fmtDate(NEXT.time, lang, { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
          <span className="mn-h truncate">{a.name[lang]}</span>
        </span>
        <span className="w-1.5" style={{ background: a.colors[0] }} />
      </div>
      <NightFrame lang={lang} tall state={state} />

      {state === 'live' ? (
        <>
          {/* Current game: player vs player. The score is not shown until both sides confirm it. */}
          <section className="border-b border-[var(--mn-night-line)]">
            <div className={`${wrap} py-14 md:py-20`}>
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <Live lang={lang} />
                <h2 className="mn-h text-2xl md:text-3xl">
                  {t(M.current, lang)} <span className="mn-n">5</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-10">
                <div className="flex items-center gap-4">
                  <MiniMono name={curHome.name[lang]} color={h.colors[0]} ink={h.colors[1]} />
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--mn-night-mute)]">{h.name[lang]}</p>
                    <p
                      className={`mn-d ${lang === 'ar' ? 'text-4xl md:text-6xl' : 'text-5xl md:text-7xl'}`}
                    >
                      {curHome.name[lang]}
                    </p>
                    <p className="mt-1 text-white/70">
                      <span className="mn-n">{curHome.position}</span> ·{' '}
                      <span className="mn-n">{winRate(curHome.stats)}%</span> {t(M.winRate, lang)}
                    </p>
                  </div>
                </div>
                <div className="mn-slant justify-self-center bg-white px-6 py-1 md:px-8">
                  <span className="mn-unslant mn-d block text-5xl text-[var(--mn-ink)] md:text-6xl">
                    {t(C.vs, lang)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-4 text-end">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--mn-night-mute)]">{a.name[lang]}</p>
                    <p
                      className={`mn-d ${lang === 'ar' ? 'text-4xl md:text-6xl' : 'text-5xl md:text-7xl'}`}
                    >
                      {pname(cur.away, lang)}
                    </p>
                  </div>
                  <MiniMono name={pname(cur.away, lang)} color={a.colors[0]} ink={a.colors[1]} />
                </div>
              </div>
              <div className="mt-10 flex flex-col gap-2 border-t border-[var(--mn-night-line)] pt-6">
                <p className="text-xl font-semibold">{t(M.needs, lang)}</p>
                <p className="text-[var(--mn-night-mute)]">{t(M.vsNow, lang)}</p>
              </div>
            </div>
          </section>

          <section
            className={`${wrap} grid gap-16 py-14 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`}
          >
            <div>
              <h2 className="mn-d mb-8 text-4xl md:text-5xl">{t(M.log, lang)}</h2>
              <ol className="flex flex-col">
                {LIVE_GAMES.filter((g) => g.state === 'done').map((g, i) => {
                  const w = gameWinner(g);
                  if (w === 'h') hs++;
                  if (w === 'a') aw++;
                  const running: [number, number] = [hs, aw];
                  const col = w === 'h' ? h.colors[0] : w === 'a' ? a.colors[0] : '#4b5568';
                  return (
                    <li
                      key={i}
                      className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 border-t border-[var(--mn-night-line)] py-5"
                    >
                      <span className="mn-n text-lg text-[var(--mn-night-mute)]">
                        {LOG_TIMES[i]}
                      </span>
                      <div className="min-w-0">
                        <p className="mn-h flex flex-wrap items-baseline gap-x-2 text-xl md:text-2xl">
                          <span className={w === 'h' ? '' : 'text-white/55'}>
                            {pname(g.home, lang)}
                          </span>
                          <Score v={g.score!} className="text-2xl md:text-3xl" />
                          <span className={w === 'a' ? '' : 'text-white/55'}>
                            {pname(g.away, lang)}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-[var(--mn-night-mute)]">
                          {t(M.game, lang)} <span className="mn-n">{i + 1}</span> ·{' '}
                          {t(M.confirmed, lang)}
                        </p>
                      </div>
                      <span className="flex items-center gap-2">
                        <span className="h-8 w-2" style={{ background: col }} />
                        <Score v={running} className="text-3xl" />
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-6 text-[var(--mn-night-mute)]">
                {t(M.aggregate, lang)} <Score v={LIVE.score!} className="text-xl text-white" />
              </p>
            </div>
            <div>
              <h2 className="mn-d mb-8 text-4xl md:text-5xl">{t(M.rules, lang)}</h2>
              <ol className="flex flex-col gap-8">
                {[M.r1, M.r2, M.r3].map((r, i) => (
                  <li key={i} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
                    <span className="mn-n text-5xl text-white/30">{i + 1}</span>
                    <p className="pt-1 text-xl leading-snug">{t(r, lang)}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-10 border-t border-[var(--mn-night-line)] pt-5 text-[var(--mn-night-mute)]">
                {t(M.referee, lang)} <span className="mn-n text-lg text-white">@mod_hala</span>
              </p>
            </div>
          </section>
        </>
      ) : (
        <section
          className={`${wrap} grid gap-16 py-14 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`}
        >
          {/* Upcoming: the two clans' real season record and form, face to face */}
          <div>
            <h2 className="mn-d mb-8 text-4xl md:text-5xl">{t(M.record, lang)}</h2>
            {([h, a] as const).map((c) => (
              <div
                key={c.tag}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[var(--mn-night-line)] py-5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="h-10 w-2 shrink-0" style={{ background: c.colors[0] }} />
                  <Crest tag={c.tag} className="size-9" />
                  <span className="mn-h truncate text-2xl md:text-3xl">{c.name[lang]}</span>
                </span>
                <span className="flex items-center gap-5">
                  <span className="mn-n text-2xl">
                    {c.record.w}-{c.record.d}-{c.record.l}
                  </span>
                  <span className="hidden gap-1 sm:flex" aria-label={t(M.form, lang)}>
                    {c.form.map((f, j) => (
                      <span
                        key={j}
                        className={`mn-n grid size-6 place-items-center text-sm text-white ${f === 'W' ? 'bg-[var(--mn-pitch)]' : f === 'D' ? 'bg-[#4b5568]' : 'bg-[var(--mn-signal)]'}`}
                      >
                        {f}
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div>
            <h2 className="mn-d mb-8 text-4xl md:text-5xl">{t(M.rules, lang)}</h2>
            <ol className="flex flex-col gap-8">
              {[M.r1, M.r2, M.r3].map((r, i) => (
                <li key={i} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
                  <span className="mn-n text-5xl text-white/30">{i + 1}</span>
                  <p className="pt-1 text-xl leading-snug">{t(r, lang)}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 border-t border-[var(--mn-night-line)] pt-5 text-[var(--mn-night-mute)]">
              {t(M.referee, lang)} <span className="mn-n text-lg text-white">@mod_hala</span>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. TOURNAMENT — the poster and the bracket
// ════════════════════════════════════════════════════════════════════════════

export function MatchnightTournament({ lang, bug = 'live', menu = false }: ViewProps) {
  const [sf1, sf2] = TOURNAMENT.bracket.semis;
  const fixtures = MATCHES.filter((m) => m.id === 'g6' || m.id === 'g7');
  return (
    <div className={bugPad(bug)}>
      <Masthead lang={lang} active="competitions" />

      {/* Poster */}
      <section className="relative overflow-hidden bg-[var(--mn-ink)] text-white">
        <span
          className="mn-n pointer-events-none absolute -bottom-[0.2em] end-[-0.05em] text-[48vw] leading-none text-white/[0.06] md:text-[34vw]"
          aria-hidden
        >
          03
        </span>
        <div
          className={`${wrap} relative flex min-h-[70vh] flex-col justify-between gap-10 py-10 md:py-16`}
        >
          <div className="flex flex-wrap items-center gap-3 font-semibold text-white/80">
            <Live lang={lang} />
            {t(TOURNAMENT.organizer, lang)}
          </div>
          <div>
            <div
              className="mn-gold mb-6 grid size-16 place-items-center text-[var(--mn-ink)] md:size-20"
              style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
            >
              <Trophy className="size-8 md:size-9" />
            </div>
            <h1
              className={`mn-d max-w-5xl ${lang === 'ar' ? 'text-6xl md:text-8xl xl:text-9xl' : 'text-7xl md:text-[9rem] xl:text-[11rem]'}`}
            >
              {t(TOURNAMENT.name, lang)}
            </h1>
            <p className="mt-4 text-xl text-white/80 md:text-2xl">
              {t(M.season, lang)} <span className="mn-n">3</span> · {t(TOURNAMENT.dates, lang)} ·{' '}
              <span className="mn-n">{TOURNAMENT.participants}</span> {t(C.nav.clans, lang)}
            </p>
            <p className="mt-2 max-w-2xl text-white/60">{t(TOURNAMENT.format, lang)}</p>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <nav className="mn-scroll sticky top-0 z-20 overflow-x-auto border-b-[3px] border-[var(--mn-ink)] bg-[var(--mn-chalk)]">
        <div className={`${wrap} flex gap-8 md:gap-12`}>
          {(['bracket', 'groups', 'fixtures', 'rules'] as const).map((k, i) => (
            <a
              key={k}
              className={`mn-d shrink-0 py-4 text-3xl md:text-4xl ${i === 0 ? '' : 'text-[var(--mn-ink-2)]/60'}`}
            >
              {t(M.chapters[k], lang)}
            </a>
          ))}
        </div>
      </nav>

      {/* Bracket as the hero: semis → final poster → champion */}
      <section className={`${wrap} py-14 md:py-20`}>
        <div className="mn-scroll -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_minmax(0,0.6fr)] md:items-center md:gap-0 md:overflow-visible md:px-0">
          {/* round: semis */}
          <div className="flex w-[85vw] shrink-0 snap-start flex-col gap-10 md:w-auto">
            <p className="text-sm font-semibold text-[var(--mn-ink-2)]">{t(C.tour.semi, lang)}</p>
            {[sf1!, sf2!].map((m) => {
              const live = m.status === 'live';
              return (
                <div
                  key={m.id}
                  className={
                    live
                      ? 'mn-wipe bg-[var(--mn-night)] p-5 text-white'
                      : 'border-t-[3px] border-[var(--mn-ink)] pt-4'
                  }
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className={live ? 'text-white/60' : 'text-[var(--mn-ink-2)]'}>
                      {live ? '' : t(C.finished, lang)}
                    </span>
                    {live && <Live lang={lang} />}
                  </div>
                  {(
                    [
                      [m.home, m.games[0], m.games[0] > m.games[1]],
                      [m.away, m.games[1], m.games[1] > m.games[0]],
                    ] as const
                  ).map(([tag, g, lead]) => (
                    <div key={tag} className="flex items-center gap-4 py-1.5">
                      <span
                        className="mn-kit h-9 w-4 shrink-0"
                        style={{ background: clan(tag).colors[0] }}
                      />
                      <Crest tag={tag} className="size-9" />
                      <span
                        className={`mn-h min-w-0 flex-1 truncate text-2xl md:text-3xl ${lead ? '' : live ? 'text-white/55' : 'text-[var(--mn-ink-2)]'}`}
                      >
                        {clan(tag).name[lang]}
                      </span>
                      <span className="mn-n text-5xl">{g}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {/* connector */}
          <div className="relative hidden h-[70%] md:block" aria-hidden>
            <div className="absolute inset-y-0 start-0 w-1/2 border-y-[3px] border-e-[3px] border-[var(--mn-ink)]" />
            <div className="absolute start-1/2 top-1/2 h-[3px] w-1/2 bg-[var(--mn-ink)]" />
          </div>
          {/* final poster */}
          <div className="w-[85vw] shrink-0 snap-start md:w-auto">
            <p className="mb-4 text-sm font-semibold text-[var(--mn-ink-2)] md:hidden">
              {t(C.tour.final, lang)}
            </p>
            <div className="relative overflow-hidden bg-[var(--mn-ink)] p-6 text-white md:p-8">
              <div className="mn-gold absolute inset-x-0 top-0 h-2" />
              <p className="mn-d text-5xl md:text-6xl">{t(M.final, lang)}</p>
              <p className="mt-4 flex items-end gap-3">
                <span className="mn-n text-8xl">06</span>
                <span className="pb-2 text-lg">
                  {fmtDate(TOURNAMENT.bracket.final.time, lang, { month: 'long' })}
                </span>
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-white/15 pt-5">
                <Crest tag="CEG" className="size-10" />
                <span className="mn-h text-2xl">{clan('CEG').name[lang]}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-white/65">
                <span className="grid size-10 place-items-center border-2 border-dashed border-white/30 text-lg">
                  ?
                </span>
                <span>
                  {t(M.winnerOf, lang)} {clan('NILE').name[lang]} / {clan('GST').name[lang]}
                </span>
              </div>
            </div>
          </div>
          {/* champion */}
          <div className="flex w-[60vw] shrink-0 snap-start flex-col items-center justify-center gap-3 md:w-auto">
            <Trophy className="size-24 text-[var(--mn-gold)] md:size-28" strokeWidth={1.25} />
            <p className="mn-d text-3xl">{t(M.champion, lang)}</p>
            <p className="text-[var(--mn-ink-2)]">{t(C.tour.tbd, lang)}</p>
          </div>
        </div>
      </section>

      {/* Groups — broadcast standings */}
      <section className="bg-[var(--mn-chalk-2)]">
        <div className={`${wrap} grid gap-16 py-14 md:py-20 xl:grid-cols-2`}>
          {TOURNAMENT.groups.map((g) => (
            <div key={g.name.en}>
              <h2 className="mn-d mb-6 text-4xl md:text-5xl">{g.name[lang]}</h2>
              <Standings
                lang={lang}
                rows={g.rows.map((r) => ({ tag: r.tag, p: r.p, gd: r.gd, pts: r.pts }))}
                cut={2}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Fixtures by day */}
      <section
        className={`${wrap} grid gap-10 py-14 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16 md:py-20`}
      >
        <div>
          <p className="mn-n text-[7rem] md:text-[9rem]">18</p>
          <p className="text-xl font-semibold">
            {fmtDate('2026-11-18T18:00:00Z', lang, { month: 'long' })}
          </p>
          <p className="text-[var(--mn-ink-2)]">{t(M.day, lang)}</p>
        </div>
        <ul>
          {fixtures.map((m) => (
            <li
              key={m.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-t-[3px] border-[var(--mn-ink)] py-6"
            >
              <span className="flex min-w-0 items-center justify-end gap-3">
                <span className="mn-h truncate text-2xl md:text-3xl">
                  {clan(m.home).name[lang]}
                </span>
                <Crest tag={m.home} className="size-9" />
              </span>
              <span className="bg-[var(--mn-ink)] px-3 text-white">
                <Score v={m.games!} className="text-4xl" />
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <Crest tag={m.away} className="size-9" />
                <span className="mn-h truncate text-2xl md:text-3xl">
                  {clan(m.away).name[lang]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <Footer lang={lang} />
      {menu ? <MenuOverlay lang={lang} /> : <MobileBug lang={lang} state={bug} />}
    </div>
  );
}

export const MATCHNIGHT_SCREENS = ['home', 'live', 'tournament'] as const;
export type MatchnightScreen = (typeof MATCHNIGHT_SCREENS)[number];
export const MATCHNIGHT: Record<MatchnightScreen, (p: ViewProps) => ReactNode> = {
  home: MatchnightHome,
  live: MatchnightLive,
  tournament: MatchnightTournament,
};
