/*
 * DESIGN PREVIEW ONLY — MATCHNIGHT: Admin ("operations room").
 * Deliberately NOT a broadcast: chalk and ink, dense tables, one decision at a time.
 * Same type, numerals and colour roles as the rest of the platform. Same functions as Phase 2:
 * clan application queue with live checks → approve (creates clan) / reject with a required reason.
 */
import { ArrowLeft, ArrowRight, Check, ExternalLink, X } from 'lucide-react';
import { C, countryName, flag, fmtDate, fmtNum } from '../copy';
import { ADMIN, type Lang } from '../data';
import { Emblem } from '../emblem';
import { PREVIEW_NOW, t, type ViewProps, wrap } from './screens';

type P = { lang: Lang };
type Q = (typeof ADMIN.queue)[number];

const A = {
  room: { ar: 'غرفة العمليات', en: 'Operations' },
  backToSite: { ar: 'العودة إلى الموقع', en: 'Back to site' },
  tabs: {
    overview: { ar: 'نظرة عامة', en: 'Overview' },
    queue: { ar: 'طلبات الكلانات', en: 'Clan applications' },
  },
  title: { ar: 'طلبات الكلانات', en: 'Clan applications' },
  pending: { ar: 'بانتظار المراجعة', en: 'awaiting review' },
  oldest: { ar: 'أقدم طلب منذ', en: 'oldest waiting' },
  clans: { ar: 'كلان معتمد', en: 'approved clans' },
  players: { ar: 'ملف لاعب', en: 'player profiles' },
  colClan: { ar: 'الكلان', en: 'Clan' },
  colApplicant: { ar: 'مقدّم الطلب', en: 'Applicant' },
  colWaiting: { ar: 'ينتظر', en: 'Waiting' },
  colChecks: { ar: 'الفحوص', en: 'Checks' },
  ok: { ar: 'سليمة', en: 'Passed' },
  attention: { ar: 'تحتاج مراجعة', en: 'Needs review' },
  reviewing: { ar: 'قيد المراجعة', en: 'Reviewing' },
  of: { ar: 'من', en: 'of' },
  reason: {
    ar: 'سبب الرفض (إلزامي عند الرفض — يصل لمقدّم الطلب)',
    en: 'Rejection reason (required to reject — sent to the applicant)',
  },
  reasonPh: {
    ar: 'مثال: الاسم مستخدم لكلان معتمد. اختر اسمًا آخر وأعد التقديم.',
    en: 'e.g. The name belongs to an approved clan. Choose another and apply again.',
  },
  approve: { ar: 'الموافقة وإنشاء الكلان', en: 'Approve and create clan' },
  reject: { ar: 'رفض مع السبب', en: 'Reject with reason' },
  approveNote: {
    ar: 'يُنشأ الكلان ويصبح مقدّم الطلب قائدًا في خطوة واحدة.',
    en: 'Creates the clan and makes the applicant its leader in one step.',
  },
  next: { ar: 'الطلب التالي', en: 'Next application' },
  recent: { ar: 'آخر القرارات', en: 'Recent decisions' },
  h: { ar: 'ساعة', en: 'h' },
  d: { ar: 'يوم', en: 'd' },
} as const;

/** Waiting time as number + unit pairs; numbers stay Latin and isolated, units follow the language. */
function Waiting({ iso, lang, className = '' }: P & { iso: string; className?: string }) {
  const h = Math.max(0, Math.round((PREVIEW_NOW - Date.parse(iso)) / 36e5));
  const parts: [number, { ar: string; en: string }][] =
    h >= 24
      ? [
          [Math.floor(h / 24), A.d],
          [h % 24, A.h],
        ]
      : [[h, A.h]];
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      {parts.map(([n, u], i) => (
        <span key={i} className="inline-flex items-baseline gap-0.5">
          <span className="mn-n">{n}</span>
          <span className="text-[0.6em] font-semibold">{t(u, lang)}</span>
        </span>
      ))}
    </span>
  );
}
const allOk = (q: Q) => q.checks.name && q.checks.tag && q.checks.free;

function ToolHeader({ lang }: P) {
  return (
    <header className="border-b-[3px] border-[var(--mn-ink)] bg-[var(--mn-chalk)]">
      <div className={`${wrap} flex h-16 items-center gap-6`}>
        <span className="flex items-center gap-2.5">
          <span className="mn-slant inline-block h-7 w-5 bg-[var(--mn-ink)]" />
          <span className="mn-d whitespace-nowrap text-xl">
            {lang === 'ar' ? 'ساحة الكلانات' : 'Clan Arena'}
          </span>
        </span>
        <span className="hidden border-s-2 border-[var(--mn-ink)] ps-4 font-semibold sm:inline">
          {t(A.room, lang)}
        </span>
        <a className="ms-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold underline underline-offset-4">
          {lang === 'ar' ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
          {t(A.backToSite, lang)}
        </a>
      </div>
      <nav className={`${wrap} flex gap-6`} aria-label={t(A.room, lang)}>
        {(['overview', 'queue'] as const).map((k) => (
          <a
            key={k}
            aria-current={k === 'queue' ? 'page' : undefined}
            className={`-mb-[3px] border-b-[3px] py-3 font-semibold ${k === 'queue' ? 'border-[var(--mn-ink)]' : 'border-transparent text-[var(--mn-ink-2)]'}`}
          >
            {t(A.tabs[k], lang)}
            {k === 'queue' && (
              <span className="mn-n ms-2 bg-[var(--mn-ink)] px-1.5 text-sm text-white">
                {ADMIN.stats.pending}
              </span>
            )}
          </a>
        ))}
      </nav>
    </header>
  );
}

function CheckLine({
  ok,
  yes,
  no,
  lang,
}: P & { ok: boolean; yes: { ar: string; en: string }; no: { ar: string; en: string } }) {
  return (
    <li
      className={`flex items-center gap-2 font-semibold ${ok ? 'text-[var(--mn-pitch)]' : 'text-[var(--mn-signal)]'}`}
    >
      <span
        className={`grid size-5 place-items-center text-white ${ok ? 'bg-[var(--mn-pitch)]' : 'bg-[var(--mn-signal)]'}`}
      >
        {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </span>
      {t(ok ? yes : no, lang)}
    </li>
  );
}

export function MatchnightAdmin({ lang }: ViewProps) {
  const sel = ADMIN.queue[0]!;
  const oldest = [...ADMIN.queue].sort(
    (a, b) => Date.parse(a.submitted) - Date.parse(b.submitted),
  )[0]!;
  return (
    <div className="min-h-dvh">
      <ToolHeader lang={lang} />

      <div className={`${wrap} py-8`}>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h1 className="mn-h text-4xl md:text-5xl">{t(A.title, lang)}</h1>
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {(
              [
                [fmtNum(ADMIN.stats.pending, lang), A.pending],
                [<Waiting key="w" iso={oldest.submitted} lang={lang} />, A.oldest],
                [fmtNum(ADMIN.stats.clans, lang), A.clans],
                [fmtNum(ADMIN.stats.players, lang), A.players],
              ] as const
            ).map(([v, l], i) => (
              <div key={i} className="flex items-baseline gap-2">
                <dd className="text-3xl">
                  {typeof v === 'string' ? <span className="mn-n">{v}</span> : v}
                </dd>
                <dt className="text-sm text-[var(--mn-ink-2)]">{t(l, lang)}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Queue — dense, scannable, oldest first */}
          <section aria-label={t(A.title, lang)}>
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b-[3px] border-[var(--mn-ink)] text-start text-xs text-[var(--mn-ink-2)]">
                  <th className="py-2 text-start font-semibold">{t(A.colClan, lang)}</th>
                  <th className="hidden text-start font-semibold sm:table-cell">
                    {t(A.colApplicant, lang)}
                  </th>
                  <th className="text-start font-semibold">{t(A.colWaiting, lang)}</th>
                  <th className="text-end font-semibold">{t(A.colChecks, lang)}</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN.queue.map((q) => {
                  const active = q.id === sel.id;
                  return (
                    <tr
                      key={q.id}
                      className={`border-b border-[var(--mn-rule)] ${active ? 'bg-white shadow-[inset_4px_0_0_var(--mn-ink)] rtl:shadow-[inset_-4px_0_0_var(--mn-ink)]' : ''}`}
                    >
                      <td className="py-3 ps-3">
                        <span className="flex items-center gap-2.5">
                          <Emblem
                            kind={q.emblem}
                            colors={q.colors}
                            shape="shield"
                            className="size-8 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold">{q.name[lang]}</span>
                            <span className="mn-n text-sm text-[var(--mn-ink-2)]">{q.tag}</span>
                          </span>
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">{q.applicant[lang]}</td>
                      <td className="text-lg">
                        <Waiting iso={q.submitted} lang={lang} />
                      </td>
                      <td className="pe-3 text-end">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-bold ${allOk(q) ? 'bg-[#dcefe6] text-[var(--mn-pitch)]' : 'bg-[#fde2e3] text-[#a80f15]'}`}
                        >
                          {t(allOk(q) ? A.ok : A.attention, lang)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Review — one decision at a time */}
          <section
            className="border-t-[3px] border-[var(--mn-ink)] bg-white p-5 md:p-7"
            aria-label={t(A.reviewing, lang)}
          >
            <p className="text-sm text-[var(--mn-ink-2)]">
              {t(A.reviewing, lang)} · <span className="mn-n">1</span> {t(A.of, lang)}{' '}
              <span className="mn-n">{ADMIN.queue.length}</span>
            </p>
            <div className="mt-3 flex items-center gap-4">
              <Emblem
                kind={sel.emblem}
                colors={sel.colors}
                shape="shield"
                className="size-16 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="mn-h text-3xl md:text-4xl">{sel.name[lang]}</h2>
                <p className="mn-n text-lg tracking-[0.2em] text-[var(--mn-ink-2)]">{sel.tag}</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-[var(--mn-rule)] py-3 text-sm">
              <CheckLine
                lang={lang}
                ok={sel.checks.name}
                yes={C.admin.checks.name}
                no={C.admin.checks.nameTaken}
              />
              <CheckLine
                lang={lang}
                ok={sel.checks.tag}
                yes={C.admin.checks.tag}
                no={C.admin.checks.tagTaken}
              />
              <CheckLine
                lang={lang}
                ok={sel.checks.free}
                yes={C.admin.checks.free}
                no={C.admin.checks.busy}
              />
            </ul>
            <dl className="mt-5 grid gap-x-6 gap-y-4 text-[15px] sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="text-[var(--mn-ink-2)]">{t(C.admin.descriptionLabel, lang)}</dt>
              <dd className="leading-relaxed">{t(ADMIN.description, lang)}</dd>
              <dt className="text-[var(--mn-ink-2)]">{t(C.admin.contact, lang)}</dt>
              <dd>
                <a
                  className="inline-flex items-center gap-1.5 font-semibold text-[#0b57d0] underline underline-offset-4"
                  dir="ltr"
                >
                  {ADMIN.contact.replace('https://', '')} <ExternalLink className="size-3.5" />
                </a>
              </dd>
              <dt className="text-[var(--mn-ink-2)]">{t(C.admin.applicant, lang)}</dt>
              <dd>
                {sel.applicant[lang]}{' '}
                <span className="mn-n text-[var(--mn-ink-2)]">@{sel.username}</span> ·{' '}
                {flag(sel.country)} {countryName(sel.country, lang)}
              </dd>
            </dl>

            <label className="mt-6 block text-sm font-semibold" htmlFor="reason">
              {t(A.reason, lang)}
            </label>
            <textarea
              id="reason"
              rows={3}
              placeholder={t(A.reasonPh, lang)}
              className="mt-2 w-full resize-y border-2 border-[var(--mn-ink)] bg-[var(--mn-chalk)] p-3 text-[15px] placeholder:text-[var(--mn-ink-2)]/70"
            />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="h-12 flex-1 bg-[var(--mn-pitch)] px-5 font-semibold text-white"
              >
                {t(A.approve, lang)}
              </button>
              <button
                type="button"
                className="h-12 flex-1 border-2 border-[var(--mn-signal)] px-5 font-semibold text-[var(--mn-signal)]"
              >
                {t(A.reject, lang)}
              </button>
            </div>
            <p className="mt-3 text-sm text-[var(--mn-ink-2)]">{t(A.approveNote, lang)}</p>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="mn-h mb-3 text-2xl">{t(A.recent, lang)}</h2>
          <table className="w-full text-[15px]">
            <tbody>
              {ADMIN.decisions.map((d, i) => (
                <tr key={i} className="border-t border-[var(--mn-rule)]">
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold ${d.action === 'approve' ? 'bg-[#dcefe6] text-[var(--mn-pitch)]' : 'bg-[#fde2e3] text-[#a80f15]'}`}
                    >
                      {t(d.action === 'approve' ? C.admin.approved : C.admin.rejected, lang)}
                    </span>
                  </td>
                  <td className="font-semibold">{d.target[lang]}</td>
                  <td className="mn-n hidden text-[var(--mn-ink-2)] sm:table-cell">@{d.who}</td>
                  <td className="text-end text-sm text-[var(--mn-ink-2)]">
                    {fmtDate(d.at, lang, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
