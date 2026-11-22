/**
 * DESIGN PREVIEW ONLY — Matchnight sample data.
 * A realistic full tournament (16 clans: 4 groups → quarter-finals → semi-finals → final),
 * including long Arabic clan names, and a live clan match whose individual games are in
 * three different result states. Nothing here is fabricated beyond what the PRD will store:
 * no match clock, no in-play scores, no per-minute events.
 */
import { CLANS, clan as baseClan, type L10n, MATCHES, type PClan } from '../data';

const rec = (p: number, w: number, d: number, gf: number, ga: number) => ({
  p,
  w,
  d,
  l: p - w - d,
  gf,
  ga,
});

export const EXTRA_CLANS: PClan[] = [
  {
    tag: 'NST',
    name: { ar: 'نجوم الشمال للرياضات الإلكترونية', en: 'Northern Stars Esports' },
    country: 'EG',
    colors: ['#1e293b', '#38bdf8'],
    emblem: 'star',
    members: 41,
    founded: '2026-01-19',
    record: rec(37, 22, 6, 90, 58),
    trophies: 1,
    form: ['W', 'W', 'L', 'D', 'W'],
  },
  {
    tag: 'GPY',
    name: { ar: 'فراعنة الجيزة للألعاب الإلكترونية', en: 'Giza Pharaohs Gaming' },
    country: 'EG',
    colors: ['#a16207', '#1c1917'],
    emblem: 'crown',
    members: 35,
    founded: '2026-02-02',
    record: rec(34, 20, 5, 81, 55),
    trophies: 1,
    form: ['W', 'L', 'W', 'W', 'D'],
  },
  {
    tag: 'RYF',
    name: { ar: 'صقور الرياض', en: 'Riyadh Falcons' },
    country: 'SA',
    colors: ['#0f766e', '#facc15'],
    emblem: 'wing',
    members: 30,
    founded: '2026-03-03',
    record: rec(29, 16, 5, 64, 47),
    trophies: 0,
    form: ['D', 'W', 'W', 'L', 'W'],
  },
  {
    tag: 'ORN',
    name: { ar: 'أمواج وهران', en: 'Oran Waves' },
    country: 'DZ',
    colors: ['#0369a1', '#f8fafc'],
    emblem: 'anchor',
    members: 27,
    founded: '2026-03-15',
    record: rec(28, 14, 6, 57, 46),
    trophies: 0,
    form: ['W', 'D', 'L', 'W', 'L'],
  },
  {
    tag: 'ALP',
    name: { ar: 'قلعة حلب', en: 'Aleppo Citadel' },
    country: 'SY',
    colors: ['#7f1d1d', '#fcd34d'],
    emblem: 'sword',
    members: 24,
    founded: '2026-04-11',
    record: rec(25, 11, 4, 44, 43),
    trophies: 0,
    form: ['L', 'W', 'D', 'L', 'W'],
  },
  {
    tag: 'AMN',
    name: { ar: 'عقبان عمّان', en: 'Amman Eagles' },
    country: 'JO',
    colors: ['#14532d', '#f8fafc'],
    emblem: 'bolt',
    members: 21,
    founded: '2026-05-08',
    record: rec(22, 9, 5, 37, 38),
    trophies: 0,
    form: ['D', 'L', 'W', 'L', 'D'],
  },
  {
    tag: 'KWT',
    name: { ar: 'الأزرق الكويتي', en: 'Kuwait Blues' },
    country: 'KW',
    colors: ['#1d4ed8', '#e5e7eb'],
    emblem: 'ring',
    members: 26,
    founded: '2026-04-20',
    record: rec(24, 10, 6, 41, 39),
    trophies: 0,
    form: ['W', 'L', 'D', 'D', 'W'],
  },
  {
    tag: 'MCT',
    name: { ar: 'أسود مسقط', en: 'Muscat Lions' },
    country: 'OM',
    colors: ['#991b1b', '#f8fafc'],
    emblem: 'star',
    members: 18,
    founded: '2026-06-12',
    record: rec(19, 7, 3, 29, 33),
    trophies: 0,
    form: ['L', 'L', 'W', 'D', 'L'],
  },
];

export const clan = (tag: string): PClan => EXTRA_CLANS.find((c) => c.tag === tag) ?? baseClan(tag);
export const ALL_CLANS = [...CLANS, ...EXTRA_CLANS];

// ── The live clan match: Nile Kings v Gulf Storm, semi-final ──────────────────

/** Result states of an individual game, exactly as the product will track them. */
export type GameStatus = 'confirmed' | 'submitted' | 'awaiting';
export interface LiveGame {
  n: number;
  home: string;
  away: string;
  status: GameStatus;
  /** Present once at least one side has submitted. Only 'confirmed' scores are official. */
  score?: [number, number];
  /** Which clan submitted a result the other side has not confirmed yet. */
  submittedBy?: string;
  /** Time of the last state change (submission or confirmation). */
  at?: string;
}

export const LIVE_GAMES: LiveGame[] = [
  { n: 1, home: 'ahmed_samir', away: 'faisal_o', status: 'confirmed', score: [3, 1], at: '19:18' },
  { n: 2, home: 'omar_fathy', away: 'nawaf_k', status: 'confirmed', score: [2, 2], at: '19:41' },
  { n: 3, home: 'hany_gk', away: 'saud_m', status: 'confirmed', score: [1, 3], at: '20:03' },
  {
    n: 4,
    home: 'layla_rw',
    away: 'ziyad_a',
    status: 'submitted',
    score: [3, 0],
    submittedBy: 'NILE',
    at: '20:27',
  },
  { n: 5, home: 'sami_st', away: 'majed_t', status: 'awaiting' },
];

const confirmed = LIVE_GAMES.filter((g) => g.status === 'confirmed');
/** Official clan score: individual games won, counting confirmed games only. */
export const OFFICIAL: [number, number] = [
  confirmed.filter((g) => g.score![0] > g.score![1]).length,
  confirmed.filter((g) => g.score![1] > g.score![0]).length,
];
export const OFFICIAL_GOALS: [number, number] = [
  confirmed.reduce((s, g) => s + g.score![0], 0),
  confirmed.reduce((s, g) => s + g.score![1], 0),
];
export const CONFIRMED_COUNT = confirmed.length;

const sf1 = MATCHES.find((m) => m.id === 'sf1')!;
export const LIVE = { ...sf1, games: OFFICIAL, score: OFFICIAL_GOALS };
export const NEXT = MATCHES.find((m) => m.id === 'l1')!;

// ── Full tournament: Arab Clans Cup, season 3 ─────────────────────────────────

export const CUP = {
  name: { ar: 'كأس الكلانات العربية', en: 'Arab Clans Cup' } as L10n,
  organizer: { ar: 'اتحاد الكلانات المصرية', en: 'Egyptian Federation of Clans' } as L10n,
  dates: { ar: '14 نوفمبر – 6 ديسمبر', en: 'Nov 14 – Dec 6' } as L10n,
  format: {
    ar: '4 مجموعات ثم أدوار إقصائية — مواجهات كلانات 5 ضد 5',
    en: '4 groups then knockout — 5v5 clan matches',
  } as L10n,
  season: 3,
  participants: 16,
  finalTime: '2026-12-06T19:00:00Z',
};

type Row = { tag: string; p: number; w: number; d: number; l: number; gd: number; pts: number };
const row = (tag: string, w: number, d: number, l: number, gd: number): Row => ({
  tag,
  p: w + d + l,
  w,
  d,
  l,
  gd,
  pts: w * 3 + d,
});

export const GROUPS: { name: L10n; rows: Row[] }[] = [
  {
    name: { ar: 'المجموعة أ', en: 'Group A' },
    rows: [
      row('NILE', 3, 0, 0, 9),
      row('ATL', 1, 1, 1, 1),
      row('CRT', 1, 0, 2, -3),
      row('BGD', 0, 1, 2, -7),
    ],
  },
  {
    name: { ar: 'المجموعة ب', en: 'Group B' },
    rows: [
      row('CEG', 2, 1, 0, 6),
      row('GST', 2, 0, 1, 3),
      row('DSW', 1, 1, 1, -1),
      row('CDR', 0, 0, 3, -8),
    ],
  },
  {
    name: { ar: 'المجموعة ج', en: 'Group C' },
    rows: [
      row('NST', 2, 1, 0, 5),
      row('RYF', 2, 0, 1, 2),
      row('KWT', 1, 1, 1, 0),
      row('MCT', 0, 0, 3, -7),
    ],
  },
  {
    name: { ar: 'المجموعة د', en: 'Group D' },
    rows: [
      row('GPY', 2, 1, 0, 4),
      row('ORN', 1, 2, 0, 2),
      row('ALP', 1, 0, 2, -2),
      row('AMN', 0, 1, 2, -4),
    ],
  },
];

export interface Tie {
  id: string;
  home: string | null;
  away: string | null;
  /** Individual games won. Absent until played. */
  games?: [number, number];
  status: 'finished' | 'live' | 'scheduled';
  /** Level after the games: decided by a decider game between the two leaders (knockout rule). */
  decider?: string;
  time?: string;
  feed?: [string, string];
}

export const ROUNDS: { key: 'qf' | 'sf' | 'f'; name: L10n; ties: Tie[] }[] = [
  {
    key: 'qf',
    name: { ar: 'ربع النهائي', en: 'Quarter-finals' },
    ties: [
      { id: 'qf1', home: 'NILE', away: 'ORN', games: [4, 1], status: 'finished' },
      { id: 'qf2', home: 'NST', away: 'GST', games: [2, 3], status: 'finished' },
      { id: 'qf3', home: 'CEG', away: 'RYF', games: [2, 2], status: 'finished', decider: 'CEG' },
      { id: 'qf4', home: 'GPY', away: 'ATL', games: [2, 3], status: 'finished' },
    ],
  },
  {
    key: 'sf',
    name: { ar: 'نصف النهائي', en: 'Semi-finals' },
    ties: [
      { id: 'sf1', home: 'NILE', away: 'GST', games: OFFICIAL, status: 'live' },
      { id: 'sf2', home: 'CEG', away: 'ATL', games: [3, 1], status: 'finished' },
    ],
  },
  {
    key: 'f',
    name: { ar: 'النهائي', en: 'Final' },
    ties: [
      {
        id: 'f',
        home: 'CEG',
        away: null,
        status: 'scheduled',
        time: CUP.finalTime,
        feed: ['NILE', 'GST'],
      },
    ],
  },
];

/** Winner of a finished tie, including a decider. */
export function tieWinner(t: Tie): string | null {
  if (t.status !== 'finished' || !t.games) return null;
  if (t.games[0] === t.games[1]) return t.decider ?? null;
  return t.games[0] > t.games[1] ? t.home : t.away;
}
