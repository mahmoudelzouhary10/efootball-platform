/**
 * DESIGN PREVIEW ONLY. Realistic sample data for the three visual concepts.
 * Never imported by production routes; the preview routes are disabled unless DESIGN_PREVIEW=1.
 */

export type Lang = 'ar' | 'en';
export type L10n = { ar: string; en: string };
export type Emblem = 'star' | 'wing' | 'bolt' | 'crown' | 'ring' | 'anchor' | 'sword' | 'cedar';

export interface PClan {
  tag: string;
  name: L10n;
  country: string;
  colors: [string, string];
  emblem: Emblem;
  members: number;
  founded: string;
  record: { p: number; w: number; d: number; l: number; gf: number; ga: number };
  trophies: number;
  form: ('W' | 'D' | 'L')[];
}

export const CLANS: PClan[] = [
  { tag: 'NILE', name: { ar: 'ملوك النيل', en: 'Nile Kings' }, country: 'EG', colors: ['#1d4ed8', '#fbbf24'], emblem: 'crown', members: 38, founded: '2026-02-11', record: { p: 42, w: 31, d: 5, l: 6, gf: 118, ga: 51 }, trophies: 4, form: ['W', 'W', 'D', 'W', 'W'] },
  { tag: 'CEG', name: { ar: 'نسور القاهرة', en: 'Cairo Eagles' }, country: 'EG', colors: ['#b91c1c', '#f5f5f4'], emblem: 'wing', members: 44, founded: '2026-01-03', record: { p: 40, w: 27, d: 6, l: 7, gf: 104, ga: 60 }, trophies: 3, form: ['W', 'L', 'W', 'W', 'D'] },
  { tag: 'ATL', name: { ar: 'أسود الأطلس', en: 'Atlas Lions' }, country: 'MA', colors: ['#c1272d', '#006233'], emblem: 'star', members: 31, founded: '2026-03-20', record: { p: 36, w: 22, d: 7, l: 7, gf: 88, ga: 49 }, trophies: 2, form: ['D', 'W', 'W', 'L', 'W'] },
  { tag: 'GST', name: { ar: 'عاصفة الخليج', en: 'Gulf Storm' }, country: 'SA', colors: ['#047857', '#e5e7eb'], emblem: 'bolt', members: 47, founded: '2026-01-28', record: { p: 39, w: 23, d: 5, l: 11, gf: 92, ga: 63 }, trophies: 2, form: ['L', 'W', 'W', 'W', 'L'] },
  { tag: 'CRT', name: { ar: 'قراصنة قرطاج', en: 'Carthage Corsairs' }, country: 'TN', colors: ['#7c2d12', '#fde68a'], emblem: 'anchor', members: 26, founded: '2026-04-02', record: { p: 30, w: 16, d: 6, l: 8, gf: 61, ga: 44 }, trophies: 1, form: ['W', 'D', 'L', 'W', 'W'] },
  { tag: 'DSW', name: { ar: 'ذئاب الصحراء', en: 'Desert Wolves' }, country: 'JO', colors: ['#57534e', '#f59e0b'], emblem: 'sword', members: 29, founded: '2026-02-26', record: { p: 33, w: 15, d: 8, l: 10, gf: 58, ga: 50 }, trophies: 0, form: ['D', 'D', 'W', 'L', 'W'] },
  { tag: 'BGD', name: { ar: 'فرسان بغداد', en: 'Baghdad Knights' }, country: 'IQ', colors: ['#1e3a8a', '#e11d48'], emblem: 'ring', members: 22, founded: '2026-05-14', record: { p: 24, w: 11, d: 4, l: 9, gf: 43, ga: 40 }, trophies: 0, form: ['L', 'W', 'L', 'W', 'D'] },
  { tag: 'CDR', name: { ar: 'أرز لبنان', en: 'Cedar Force' }, country: 'LB', colors: ['#15803d', '#dc2626'], emblem: 'cedar', members: 19, founded: '2026-06-01', record: { p: 18, w: 8, d: 3, l: 7, gf: 32, ga: 30 }, trophies: 0, form: ['W', 'L', 'D', 'W', 'L'] },
];

export const clan = (tag: string) => CLANS.find((c) => c.tag === tag)!;

export interface PPlayer {
  username: string;
  name: L10n;
  country: string;
  gameId: string;
  verified: boolean;
  position: string;
  role: 'leader' | 'co_leader' | 'member';
  stats: { matches: number; wins: number; draws: number; losses: number; goals: number; conceded: number };
}

/** NILE roster. The dashboard user is omar_fathy. */
export const ROSTER: PPlayer[] = [
  { username: 'ahmed_samir', name: { ar: 'أحمد سمير', en: 'Ahmed Samir' }, country: 'EG', gameId: 'EFB-2K7Q-91XA', verified: true, position: 'AMF', role: 'leader', stats: { matches: 212, wins: 149, draws: 22, losses: 41, goals: 601, conceded: 287 } },
  { username: 'omar_fathy', name: { ar: 'عمر فتحي', en: 'Omar Fathy' }, country: 'EG', gameId: 'EFB-7Q4K-21NX', verified: false, position: 'CMF', role: 'co_leader', stats: { matches: 148, wins: 97, draws: 18, losses: 33, goals: 412, conceded: 218 } },
  { username: 'hany_gk', name: { ar: 'هاني الحارس', en: 'Hany Elhares' }, country: 'EG', gameId: 'EFB-0PL3-77KD', verified: true, position: 'GK', role: 'member', stats: { matches: 131, wins: 80, draws: 19, losses: 32, goals: 301, conceded: 190 } },
  { username: 'layla_rw', name: { ar: 'ليلى بن علي', en: 'Layla Ben Ali' }, country: 'TN', gameId: 'EFB-6TT1-04MB', verified: false, position: 'RWF', role: 'member', stats: { matches: 96, wins: 60, draws: 11, losses: 25, goals: 288, conceded: 151 } },
  { username: 'sami_st', name: { ar: 'سامي خوري', en: 'Sami Khoury' }, country: 'LB', gameId: 'EFB-9MMQ-35ZE', verified: false, position: 'CF', role: 'member', stats: { matches: 88, wins: 51, draws: 9, losses: 28, goals: 270, conceded: 160 } },
  { username: 'tarek_cb', name: { ar: 'طارق منصور', en: 'Tarek Mansour' }, country: 'EG', gameId: 'EFB-3XC2-62LP', verified: false, position: 'CB', role: 'member', stats: { matches: 74, wins: 41, draws: 12, losses: 21, goals: 188, conceded: 131 } },
];

export const ME = ROSTER[1]!;

export const ACHIEVEMENTS: { title: L10n; place: 1 | 2 | 3; date: string }[] = [
  { title: { ar: 'كأس الكلانات العربية — الموسم 2', en: 'Arab Clans Cup — Season 2' }, place: 1, date: '2026-09-12' },
  { title: { ar: 'دوري النيل الأسبوعي — أكتوبر', en: 'Nile Weekly League — October' }, place: 2, date: '2026-10-30' },
  { title: { ar: 'بطولة رمضان الفردية', en: 'Ramadan Solo Championship' }, place: 3, date: '2026-03-28' },
];

export type MatchStatus = 'live' | 'finished' | 'scheduled';

export interface PMatch {
  id: string;
  home: string;
  away: string;
  score?: [number, number];
  /** Clan matches: individual games won by each side. */
  games?: [number, number];
  status: MatchStatus;
  minute?: string;
  time: string;
  round: L10n;
}

export const TOURNAMENT = {
  name: { ar: 'كأس الكلانات العربية', en: 'Arab Clans Cup' },
  season: { ar: 'الموسم الثالث', en: 'Season 3' },
  organizer: { ar: 'اتحاد الكلانات المصرية', en: 'Egyptian Federation of Clans' },
  format: { ar: 'مجموعات ثم أدوار إقصائية — مواجهات كلانات 5 ضد 5', en: 'Groups then knockout — 5v5 clan matches' },
  dates: { ar: '14 نوفمبر – 6 ديسمبر', en: 'Nov 14 – Dec 6' },
  participants: 8,
  status: 'live' as const,
  groups: [
    { name: { ar: 'المجموعة أ', en: 'Group A' }, rows: [
      { tag: 'NILE', p: 3, w: 3, d: 0, l: 0, gd: 9, pts: 9 },
      { tag: 'ATL', p: 3, w: 1, d: 1, l: 1, gd: 1, pts: 4 },
      { tag: 'CRT', p: 3, w: 1, d: 0, l: 2, gd: -3, pts: 3 },
      { tag: 'BGD', p: 3, w: 0, d: 1, l: 2, gd: -7, pts: 1 },
    ] },
    { name: { ar: 'المجموعة ب', en: 'Group B' }, rows: [
      { tag: 'CEG', p: 3, w: 2, d: 1, l: 0, gd: 6, pts: 7 },
      { tag: 'GST', p: 3, w: 2, d: 0, l: 1, gd: 3, pts: 6 },
      { tag: 'DSW', p: 3, w: 1, d: 1, l: 1, gd: -1, pts: 4 },
      { tag: 'CDR', p: 3, w: 0, d: 0, l: 3, gd: -8, pts: 0 },
    ] },
  ],
  bracket: {
    semis: [
      { id: 'sf1', home: 'NILE', away: 'GST', games: [2, 1] as [number, number], status: 'live' as MatchStatus, minute: "71'" },
      { id: 'sf2', home: 'CEG', away: 'ATL', games: [3, 1] as [number, number], status: 'finished' as MatchStatus },
    ],
    final: { id: 'f', home: 'CEG', away: null as string | null, status: 'scheduled' as MatchStatus, time: '2026-12-06T19:00:00Z' },
  },
};

export const MATCHES: PMatch[] = [
  { id: 'sf1', home: 'NILE', away: 'GST', games: [2, 1], score: [11, 8], status: 'live', minute: "71'", time: '2026-11-21T19:00:00Z', round: { ar: 'نصف النهائي', en: 'Semi-final' } },
  { id: 'sf2', home: 'CEG', away: 'ATL', games: [3, 1], score: [12, 6], status: 'finished', time: '2026-11-20T19:00:00Z', round: { ar: 'نصف النهائي', en: 'Semi-final' } },
  { id: 'g6', home: 'NILE', away: 'BGD', games: [5, 0], score: [17, 4], status: 'finished', time: '2026-11-18T18:00:00Z', round: { ar: 'الجولة 3', en: 'Matchday 3' } },
  { id: 'g7', home: 'GST', away: 'DSW', games: [3, 2], score: [10, 9], status: 'finished', time: '2026-11-18T20:00:00Z', round: { ar: 'الجولة 3', en: 'Matchday 3' } },
  { id: 'f', home: 'CEG', away: 'TBD', status: 'scheduled', time: '2026-12-06T19:00:00Z', round: { ar: 'النهائي', en: 'Final' } },
  { id: 'l1', home: 'NILE', away: 'ATL', status: 'scheduled', time: '2026-11-24T19:30:00Z', round: { ar: 'دوري النيل — الأسبوع 6', en: 'Nile League — Week 6' } },
];

/** The live clan match broken into its five individual games. */
export const LIVE_GAMES: { home: string; away: string; score: [number, number] | null; state: 'done' | 'live' | 'next' }[] = [
  { home: 'ahmed_samir', away: 'faisal_o', score: [3, 1], state: 'done' },
  { home: 'omar_fathy', away: 'nawaf_k', score: [2, 2], state: 'done' },
  { home: 'hany_gk', away: 'saud_m', score: [1, 3], state: 'done' },
  { home: 'layla_rw', away: 'ziyad_a', score: [3, 0], state: 'done' },
  { home: 'sami_st', away: 'majed_t', score: [2, 2], state: 'live' },
];

export const ADMIN = {
  stats: { pending: 7, users: 4812, players: 3967, clans: 126, openDisputes: 3, liveMatches: 12 },
  queue: [
    { id: 'a1', name: { ar: 'فرسان بغداد', en: 'Baghdad Knights' }, tag: 'BGD2', applicant: { ar: 'زياد كمال', en: 'Ziad Kamal' }, username: 'ziad_k', country: 'IQ', submitted: '2026-11-19T09:12:00Z', colors: ['#1e3a8a', '#e11d48'] as [string, string], emblem: 'ring' as Emblem, checks: { name: true, tag: true, free: true } },
    { id: 'a2', name: { ar: 'صقور الرياض', en: 'Riyadh Falcons' }, tag: 'RYF', applicant: { ar: 'نواف القحطاني', en: 'Nawaf Alqahtani' }, username: 'nawaf_q', country: 'SA', submitted: '2026-11-20T14:40:00Z', colors: ['#0f766e', '#facc15'] as [string, string], emblem: 'wing' as Emblem, checks: { name: true, tag: true, free: true } },
    { id: 'a3', name: { ar: 'نسور القاهرة', en: 'Cairo Eagles' }, tag: 'CEG', applicant: { ar: 'كريم حداد', en: 'Karim Haddad' }, username: 'karim_h', country: 'JO', submitted: '2026-11-21T06:05:00Z', colors: ['#b91c1c', '#111827'] as [string, string], emblem: 'wing' as Emblem, checks: { name: false, tag: false, free: true } },
    { id: 'a4', name: { ar: 'أمواج وهران', en: 'Oran Waves' }, tag: 'ORN', applicant: { ar: 'ياسين بلعيد', en: 'Yacine Belaid' }, username: 'yacine_b', country: 'DZ', submitted: '2026-11-21T07:48:00Z', colors: ['#0369a1', '#f8fafc'] as [string, string], emblem: 'anchor' as Emblem, checks: { name: true, tag: true, free: false } },
  ],
  description: {
    ar: 'كلان عراقي جديد يجمع لاعبي بغداد والبصرة. نلعب يوميًا من التاسعة مساءً ونستعد للمشاركة في كأس الكلانات العربية.',
    en: 'A new Iraqi clan bringing together players from Baghdad and Basra. We play nightly from 9pm and are preparing for the Arab Clans Cup.',
  },
  contact: 'https://discord.gg/baghdad-knights',
  decisions: [
    { who: 'site_admin', action: 'approve' as const, target: { ar: 'قراصنة قرطاج', en: 'Carthage Corsairs' }, at: '2026-11-20T22:10:00Z' },
    { who: 'mod_hala', action: 'reject' as const, target: { ar: 'Team Ultra', en: 'Team Ultra' }, at: '2026-11-20T18:31:00Z' },
    { who: 'site_admin', action: 'approve' as const, target: { ar: 'أرز لبنان', en: 'Cedar Force' }, at: '2026-11-19T11:02:00Z' },
  ],
};

export const winRate = (s: { matches: number; wins: number }) => Math.round((s.wins / s.matches) * 1000) / 10;
