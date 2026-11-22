/* DESIGN PREVIEW ONLY — side-by-side comparison of the three Latin display candidates on real content. */
import { clan, type Lang, MATCHES, TOURNAMENT } from '../data';

const FONTS = [
  {
    id: 'barlow',
    name: 'Barlow Condensed',
    license: 'OFL-1.1 · already used in the project (@fontsource)',
    weights: '100–900',
  },
  {
    id: 'anton',
    name: 'Anton',
    license:
      'OFL-1.1 · Copyright 2020 The Anton Project Authors · file + licence in /public/design-preview/fonts',
    weights: '400 only',
  },
  {
    id: 'shoulders',
    name: 'Big Shoulders Display',
    license: 'OFL-1.1 · Google Inc. · file + licence in /public/design-preview/fonts',
    weights: '100–900 (700/800/900 shipped)',
  },
] as const;

export function TypeSpecimen({ lang }: { lang: Lang }) {
  const live = MATCHES.find((m) => m.id === 'sf1')!;
  const h = clan(live.home);
  const a = clan(live.away);
  const rows = [clan('NILE'), clan('CEG'), clan('GST')];
  return (
    <main className="bg-[var(--mn-chalk)] text-[var(--mn-ink)]">
      <header className="mx-auto max-w-[90rem] px-5 pb-6 pt-10 sm:px-8 lg:px-12">
        <p className="text-sm text-[var(--mn-ink-2)]">
          {lang === 'ar'
            ? 'مقارنة خطوط العرض — محتوى حقيقي من المنصة'
            : 'Display type comparison — real platform content'}
        </p>
        <p className="mt-1 text-sm text-[var(--mn-ink-2)]">
          {lang === 'ar'
            ? 'العربي ثابت في الثلاثة: Alexandria. المتغير هو الخط اللاتيني والأرقام الكبيرة فقط.'
            : 'Arabic stays Alexandria in all three. Only the Latin display face and the big numerals change.'}
        </p>
      </header>
      {FONTS.map((f) => (
        <section key={f.id} data-font={f.id} className="border-t-[3px] border-[var(--mn-ink)]">
          <div className="mx-auto grid max-w-[90rem] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-12">
            <div dir="ltr" className="text-start">
              <p className="text-2xl font-semibold">{f.name}</p>
              <p className="mt-2 text-sm text-[var(--mn-ink-2)]">{f.weights}</p>
              <p className="mt-2 text-xs text-[var(--mn-ink-2)]">{f.license}</p>
            </div>
            <div className="min-w-0">
              {/* 1. Live score line, both languages */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-[var(--mn-night)] px-6 py-5 text-white">
                <span className="mn-d text-5xl md:text-7xl">{h.name[lang]}</span>
                <span className="mn-n mn-big text-7xl md:text-8xl" dir="ltr">
                  {live.games![0]}–{live.games![1]}
                </span>
                <span className="mn-d text-5xl md:text-7xl">{a.name[lang]}</span>
              </div>
              {/* 2. Same line in the other language, to judge the pairing */}
              <div
                dir={lang === 'ar' ? 'ltr' : 'rtl'}
                lang={lang === 'ar' ? 'en' : 'ar'}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 border-x-[3px] border-b-[3px] border-[var(--mn-night)] px-6 py-4"
              >
                <span className="mn-d text-4xl md:text-5xl">
                  {h.name[lang === 'ar' ? 'en' : 'ar']}
                </span>
                <span className="mn-n mn-big text-5xl md:text-6xl" dir="ltr">
                  {live.games![0]}–{live.games![1]}
                </span>
                <span className="mn-d text-4xl md:text-5xl">
                  {a.name[lang === 'ar' ? 'en' : 'ar']}
                </span>
              </div>
              {/* 3. Editorial headline + poster */}
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <p className="mn-d text-6xl md:text-7xl">{TOURNAMENT.name[lang]}</p>
                <div dir={lang === 'ar' ? 'ltr' : 'rtl'} lang={lang === 'ar' ? 'en' : 'ar'}>
                  <p className="mn-d text-6xl md:text-7xl">
                    {TOURNAMENT.name[lang === 'ar' ? 'en' : 'ar']}
                  </p>
                </div>
              </div>
              {/* 4. Standings rows (data numerals stay Barlow; ranks + points use the display face) */}
              <div className="mt-8">
                {rows.map((c, i) => (
                  <div
                    key={c.tag}
                    className="grid grid-cols-[3rem_minmax(0,1fr)_3rem_4rem] items-center gap-3 border-b border-[var(--mn-rule)] py-2"
                  >
                    <span className="mn-n mn-big text-4xl">{i + 1}</span>
                    <span className="mn-h truncate text-2xl md:text-3xl">{c.name[lang]}</span>
                    <span className="mn-n text-center text-2xl">{c.record.p}</span>
                    <span className="mn-n mn-big text-end text-4xl">
                      {c.record.w * 3 + c.record.d}
                    </span>
                  </div>
                ))}
              </div>
              {/* 5. Small headings — legibility at the bottom of the scale */}
              <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
                <span className="mn-h text-lg">
                  {lang === 'ar' ? 'جدول دوري النيل' : 'Nile League table'}
                </span>
                <span className="mn-h text-lg">
                  {lang === 'ar' ? 'المواجهة الحالية 5' : 'Current game 5'}
                </span>
                <span className="mn-h text-lg" dir="ltr">
                  NILE · GST · CEG · ATL 0123456789
                </span>
              </p>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
