/** DESIGN PREVIEW ONLY. Extra sample data used by the hybrid direction. */
import type { L10n, PPlayer } from '../data';
import { ROSTER } from '../data';

/** Gulf Storm line-up in the live semi-final (away side of LIVE_GAMES). */
export const OPPONENTS: Record<string, L10n> = {
  faisal_o: { ar: 'فيصل العتيبي', en: 'Faisal Alotaibi' },
  nawaf_k: { ar: 'نواف خالد', en: 'Nawaf Khaled' },
  saud_m: { ar: 'سعود المطيري', en: 'Saud Almutairi' },
  ziyad_a: { ar: 'زياد العمري', en: 'Ziyad Alomari' },
  majed_t: { ar: 'ماجد التميمي', en: 'Majed Altamimi' },
};

const faisal: PPlayer = { username: 'faisal_o', name: OPPONENTS.faisal_o!, country: 'SA', gameId: 'EFB-1ZQ8-55RT', verified: true, position: 'CF', role: 'leader', stats: { matches: 187, wins: 128, draws: 20, losses: 39, goals: 544, conceded: 260 } };
const youssef: PPlayer = { username: 'youssef_n', name: { ar: 'يوسف نبيل', en: 'Youssef Nabil' }, country: 'EG', gameId: 'EFB-4HH2-08QS', verified: true, position: 'LWF', role: 'member', stats: { matches: 164, wins: 109, draws: 17, losses: 38, goals: 470, conceded: 240 } };

export const TOP_PLAYERS: { p: PPlayer; clan: string }[] = [
  { p: ROSTER[0]!, clan: 'NILE' },
  { p: faisal, clan: 'GST' },
  { p: youssef, clan: 'CEG' },
  { p: ROSTER[1]!, clan: 'NILE' },
];

export const COMPETITIONS = [
  { id: 'acc', name: { ar: 'كأس الكلانات العربية', en: 'Arab Clans Cup' }, kind: { ar: 'بطولة إقصائية', en: 'Knockout cup' }, state: 'live' as const, detail: { ar: 'نصف النهائي يُلعب الآن', en: 'Semi-finals in play' }, teams: 8 },
  { id: 'nwl', name: { ar: 'دوري النيل الأسبوعي', en: 'Nile Weekly League' }, kind: { ar: 'دوري', en: 'League' }, state: 'open' as const, detail: { ar: 'التسجيل مفتوح حتى 27 نوفمبر', en: 'Registration open until Nov 27' }, teams: 12 },
  { id: 'gsc', name: { ar: 'كأس الخليج السوبر', en: 'Gulf Super Cup' }, kind: { ar: 'مجموعات + إقصائيات', en: 'Groups + knockout' }, state: 'soon' as const, detail: { ar: 'يبدأ 5 ديسمبر', en: 'Starts Dec 5' }, teams: 16 },
];

/** Omar's recent individual games (player-level results). */
export const MY_RESULTS: { opp: L10n; oppClan: string; score: [number, number]; comp: L10n; date: string }[] = [
  { opp: OPPONENTS.nawaf_k!, oppClan: 'GST', score: [2, 2], comp: { ar: 'كأس الكلانات — نصف النهائي', en: 'Clans Cup — semi-final' }, date: '2026-11-21T19:20:00Z' },
  { opp: { ar: 'حيدر سلمان', en: 'Haider Salman' }, oppClan: 'BGD', score: [4, 1], comp: { ar: 'كأس الكلانات — الجولة 3', en: 'Clans Cup — matchday 3' }, date: '2026-11-18T18:10:00Z' },
  { opp: { ar: 'أنس الإدريسي', en: 'Anas Idrissi' }, oppClan: 'ATL', score: [1, 2], comp: { ar: 'كأس الكلانات — الجولة 2', en: 'Clans Cup — matchday 2' }, date: '2026-11-16T18:40:00Z' },
  { opp: { ar: 'سليم الطرابلسي', en: 'Salim Trabelsi' }, oppClan: 'CRT', score: [3, 0], comp: { ar: 'كأس الكلانات — الجولة 1', en: 'Clans Cup — matchday 1' }, date: '2026-11-14T19:00:00Z' },
  { opp: { ar: 'مالك حدّاد', en: 'Malek Haddad' }, oppClan: 'DSW', score: [3, 2], comp: { ar: 'دوري النيل — الأسبوع 5', en: 'Nile League — week 5' }, date: '2026-11-10T20:00:00Z' },
];

/** Hybrid-only copy. */
export const H = {
  nav: { live: { ar: 'مباشر', en: 'Live' }, me: { ar: 'ملفي', en: 'Me' } },
  home: {
    featured: { ar: 'المباراة الأبرز الآن', en: 'Featured live match' },
    watch: { ar: 'افتح مركز المباراة', en: 'Open match centre' },
    league: { ar: 'دوري النيل — الترتيب', en: 'Nile League — table' },
    fullTable: { ar: 'الجدول كاملًا', en: 'Full table' },
    topPlayers: { ar: 'نجوم الشهر', en: 'Players of the month' },
    competitions: { ar: 'البطولات', en: 'Competitions' },
    open: { ar: 'التسجيل مفتوح', en: 'Registration open' },
    soon: { ar: 'قريبًا', en: 'Coming soon' },
    teams: { ar: 'كلان', en: 'clans' },
  },
  profile: {
    viewClan: { ar: 'صفحة الكلان', en: 'View clan' },
    share: { ar: 'مشاركة الملف', en: 'Share profile' },
    pending: { ar: 'بانتظار التوثيق', en: 'Awaiting verification' },
    pendingNote: { ar: 'يراجع المشرفون معرّف اللعبة يدويًا قبل اعتماده.', en: 'Moderators check the game ID manually before it counts.' },
    stats: { ar: 'الإحصائيات', en: 'Statistics' },
    draws: { ar: 'تعادل', en: 'Draws' },
    losses: { ar: 'خسارة', en: 'Losses' },
    wins: { ar: 'فوز', en: 'Wins' },
    rating: { ar: 'نسبة الفوز تحدد إطار الكارت', en: 'Win rate sets the card frame' },
    results: { ar: 'آخر المباريات', en: 'Recent games' },
    joined: { ar: 'انضم إلى', en: 'Joined' },
  },
  card: { mp: { ar: 'مباراة', en: 'MP' }, w: { ar: 'فوز', en: 'W' }, gf: { ar: 'هدف', en: 'GF' } },
  clan: { results: { ar: 'نتائج الكلان', en: 'Clan results' }, leadership: { ar: 'القيادة', en: 'Leadership' }, squad: { ar: 'اللاعبون', en: 'Players' } },
  tour: {
    champion: { ar: 'البطل', en: 'Champion' },
    winner: { ar: 'الفائز من', en: 'Winner of' },
    fixtures: { ar: 'مواعيد ونتائج', en: 'Fixtures and results' },
    status: { ar: 'جارية', en: 'In progress' },
  },
  live: {
    games: { ar: 'مباريات فردية', en: 'games won' },
    goals: { ar: 'مجموع الأهداف', en: 'Aggregate goals' },
    boards: { ar: 'المواجهات الفردية', en: 'Individual games' },
    board: { ar: 'مواجهة', en: 'Game' },
    playing: { ar: 'تُلعب الآن', en: 'In play' },
    done: { ar: 'انتهت', en: 'Final' },
    rules: { ar: 'قواعد المواجهة', en: 'Match rules' },
    format: { ar: 'النظام', en: 'Format' },
    formatV: { ar: '5 مباريات فردية، الفائز بأكثر عدد مباريات', en: '5 individual games; most games won wins' },
    tie: { ar: 'عند التعادل', en: 'If tied' },
    tieV: { ar: 'مباراة حاسمة بين قائدي الكلانين (أدوار إقصائية)', en: 'Decider game between the two leaders (knockout)' },
    referee: { ar: 'الحكم', en: 'Referee' },
    report: { ar: 'النتائج تُسجّل من الطرفين وتُعتمد بعد التطابق', en: 'Both sides report; results confirm when they match' },
    other: { ar: 'مباريات أخرى', en: 'Other matches' },
    needs: { ar: 'التعادل في المواجهة الخامسة يؤهل ملوك النيل', en: 'A draw in game 5 takes Nile Kings through' },
  },
  admin: {
    workspace: { ar: 'مساحة العمل', en: 'Workspace' },
    waiting: { ar: 'ينتظر', en: 'Waiting' },
    status: { ar: 'الحالة', en: 'Status' },
    checksOk: { ar: 'الفحوصات سليمة', en: 'Checks passed' },
    checksFail: { ar: 'يحتاج انتباه', en: 'Needs attention' },
  },
  screens: {
    home: { ar: 'الرئيسية', en: 'Home' },
    profile: { ar: 'ملف اللاعب', en: 'Player profile' },
    clan: { ar: 'الكلان', en: 'Clan' },
    tournament: { ar: 'البطولة', en: 'Tournament' },
    live: { ar: 'مركز المباراة', en: 'Live match' },
    admin: { ar: 'الإدارة', en: 'Admin' },
  },
} as const;
