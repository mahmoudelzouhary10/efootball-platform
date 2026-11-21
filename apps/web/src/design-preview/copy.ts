import type { Lang } from './data';

/** DESIGN PREVIEW ONLY. Shared copy so the three concepts differ in design, not in words. */
const COPY = {
  brand: { ar: 'ساحة الكلانات', en: 'Clan Arena' },
  nav: {
    home: { ar: 'الرئيسية', en: 'Home' },
    competitions: { ar: 'البطولات', en: 'Competitions' },
    clans: { ar: 'الكلانات', en: 'Clans' },
    players: { ar: 'اللاعبون', en: 'Players' },
    dashboard: { ar: 'لوحتي', en: 'My hub' },
    admin: { ar: 'الإدارة', en: 'Admin' },
  },
  live: { ar: 'مباشر', en: 'Live' },
  finished: { ar: 'انتهت', en: 'Full time' },
  scheduled: { ar: 'قادمة', en: 'Upcoming' },
  vs: { ar: 'ضد', en: 'vs' },
  home: {
    kicker: { ar: 'الموسم الثالث جارٍ الآن', en: 'Season 3 is underway' },
    title: { ar: 'ساحة المنافسة لكلانات إي فوتبول العربية', en: 'Where Arab eFootball clans compete' },
    subtitle: {
      ar: 'ملف لاعب موثّق الهوية، كلانات معتمدة، بطولات ودوريات بنتائج تُحسم داخل المنصة.',
      en: 'Player identities, approved clans, and tournaments and leagues with results settled on the platform.',
    },
    ctaJoin: { ar: 'أنشئ ملفك', en: 'Create your profile' },
    ctaWatch: { ar: 'تابع المباريات', en: 'Follow the matches' },
    liveNow: { ar: 'يُلعب الآن', en: 'Playing now' },
    topClans: { ar: 'ترتيب الكلانات', en: 'Clan standings' },
    upcoming: { ar: 'المباريات القادمة', en: 'Upcoming fixtures' },
    competitions: { ar: 'البطولات المفتوحة', en: 'Open competitions' },
    stats: { clans: { ar: 'كلان معتمد', en: 'approved clans' }, players: { ar: 'لاعب', en: 'players' }, matches: { ar: 'مباراة هذا الشهر', en: 'matches this month' } },
  },
  dash: {
    hello: { ar: 'مساء الخير يا عمر', en: 'Good evening, Omar' },
    nextMatch: { ar: 'مباراتك القادمة', en: 'Your next match' },
    record: { ar: 'السجل', en: 'Record' },
    winRate: { ar: 'نسبة الفوز', en: 'Win rate' },
    goals: { ar: 'أهداف', en: 'Goals' },
    matches: { ar: 'مباريات', en: 'Matches' },
    conceded: { ar: 'استقبل', en: 'Conceded' },
    achievements: { ar: 'الإنجازات', en: 'Honours' },
    recent: { ar: 'آخر النتائج', en: 'Recent results' },
    myClan: { ar: 'كلاني', en: 'My clan' },
    invitations: { ar: 'دعوة جديدة', en: 'New invitation' },
    accept: { ar: 'قبول', en: 'Accept' },
    decline: { ar: 'رفض', en: 'Decline' },
    reportResult: { ar: 'سجّل النتيجة', en: 'Report result' },
    gameId: { ar: 'معرّف اللعبة', en: 'Game ID' },
    unverified: { ar: 'غير موثّق', en: 'Not verified' },
    verified: { ar: 'موثّق', en: 'Verified' },
    position: { ar: 'المركز', en: 'Position' },
    places: { ar: ['', 'البطل', 'الوصيف', 'المركز الثالث'], en: ['', 'Champion', 'Runner-up', 'Third place'] },
    inviteText: { ar: 'تدعوك «قراصنة قرطاج» للانضمام', en: 'Carthage Corsairs invited you to join' },
  },
  clan: {
    founded: { ar: 'تأسس', en: 'Founded' },
    members: { ar: 'عضو', en: 'members' },
    trophies: { ar: 'ألقاب', en: 'Titles' },
    played: { ar: 'لعب', en: 'P' },
    won: { ar: 'فوز', en: 'W' },
    drawn: { ar: 'تعادل', en: 'D' },
    lost: { ar: 'خسارة', en: 'L' },
    gd: { ar: 'فارق', en: 'GD' },
    pts: { ar: 'نقاط', en: 'Pts' },
    form: { ar: 'آخر 5', en: 'Form' },
    roster: { ar: 'التشكيلة', en: 'Roster' },
    history: { ar: 'سجل المنافسات', en: 'Competition history' },
    about: { ar: 'عن الكلان', en: 'About' },
    join: { ar: 'اطلب الانضمام', en: 'Ask to join' },
    contact: { ar: 'تواصل', en: 'Contact' },
    description: {
      ar: 'كلان مصري تنافسي منذ أيام PES. تدريب يومي، مواجهات أسبوعية، وحضور ثابت في أدوار خروج المغلوب.',
      en: 'Competitive Egyptian clan since the PES days. Daily training, weekly scrims, and a fixture in the knockout rounds.',
    },
    roles: { leader: { ar: 'القائد', en: 'Leader' }, co_leader: { ar: 'نائب القائد', en: 'Co-leader' }, member: { ar: 'عضو', en: 'Member' } },
    winRate: { ar: 'نسبة الفوز', en: 'Win rate' },
  },
  tour: {
    organizer: { ar: 'المنظم', en: 'Organizer' },
    format: { ar: 'النظام', en: 'Format' },
    dates: { ar: 'المواعيد', en: 'Dates' },
    participants: { ar: 'المشاركون', en: 'Teams' },
    overview: { ar: 'نظرة عامة', en: 'Overview' },
    bracket: { ar: 'الأدوار الإقصائية', en: 'Knockout' },
    groups: { ar: 'المجموعات', en: 'Groups' },
    fixtures: { ar: 'المباريات', en: 'Fixtures' },
    semi: { ar: 'نصف النهائي', en: 'Semi-finals' },
    final: { ar: 'النهائي', en: 'Final' },
    tbd: { ar: 'يُحدد لاحقًا', en: 'TBD' },
    games: { ar: 'مباريات فردية', en: 'games' },
    liveMatch: { ar: 'المباراة الجارية', en: 'Live match' },
    board: { ar: 'اللوحة', en: 'Board' },
    qualify: { ar: 'يتأهل الأول والثاني', en: 'Top two advance' },
  },
  admin: {
    title: { ar: 'مركز الإدارة', en: 'Control room' },
    pending: { ar: 'طلبات بانتظار المراجعة', en: 'Applications awaiting review' },
    disputes: { ar: 'نزاعات مفتوحة', en: 'Open disputes' },
    liveMatches: { ar: 'مباريات جارية', en: 'Live matches' },
    users: { ar: 'حساب', en: 'accounts' },
    clans: { ar: 'كلان نشط', en: 'active clans' },
    queue: { ar: 'طابور طلبات الكلانات', en: 'Clan application queue' },
    reviewing: { ar: 'قيد المراجعة', en: 'Reviewing' },
    approve: { ar: 'الموافقة وإنشاء الكلان', en: 'Approve and create clan' },
    reject: { ar: 'رفض مع ذكر السبب', en: 'Reject with reason' },
    checks: { name: { ar: 'الاسم متاح', en: 'Name available' }, nameTaken: { ar: 'الاسم مستخدم', en: 'Name taken' }, tag: { ar: 'الرمز متاح', en: 'Tag available' }, tagTaken: { ar: 'الرمز مستخدم', en: 'Tag taken' }, free: { ar: 'ليس في كلان', en: 'Not in a clan' }, busy: { ar: 'عضو في كلان', en: 'Already in a clan' } },
    criteria: { ar: 'معايير المراجعة', en: 'Review criteria' },
    name: { ar: 'الاسم', en: 'Name' },
    tag: { ar: 'الرمز', en: 'Tag' },
    logo: { ar: 'الشعار', en: 'Logo' },
    descriptionLabel: { ar: 'الوصف', en: 'Description' },
    contact: { ar: 'رابط التواصل', en: 'Contact link' },
    applicant: { ar: 'مقدّم الطلب', en: 'Applicant' },
    recent: { ar: 'آخر القرارات', en: 'Recent decisions' },
    approved: { ar: 'وافق على', en: 'approved' },
    rejected: { ar: 'رفض', en: 'rejected' },
    waiting: { ar: 'ينتظر منذ', en: 'Waiting' },
  },
  preview: {
    label: { ar: 'معاينة تصميم — بيانات تجريبية', en: 'Design preview — sample data' },
    screens: {
      home: { ar: 'الرئيسية', en: 'Home' },
      dashboard: { ar: 'لوحة اللاعب', en: 'Player hub' },
      clan: { ar: 'صفحة الكلان', en: 'Clan' },
      tournament: { ar: 'البطولة', en: 'Tournament' },
      admin: { ar: 'الإدارة', en: 'Admin' },
    },
  },
} as const;

type Tree = typeof COPY;

/** Resolve a {ar, en} leaf for the current language. */
export function tr<T extends { ar: unknown; en: unknown }>(node: T, lang: Lang): T['ar'] | T['en'] {
  return node[lang];
}

export const C: Tree = COPY;

export function fmtDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { timeZone: 'Africa/Cairo', ...opts }).format(new Date(iso));
}

export function fmtNum(n: number, lang: Lang, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', opts).format(n);
}

export function countryName(code: string, lang: Lang) {
  return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
}

export function flag(code: string) {
  return [...code].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}
