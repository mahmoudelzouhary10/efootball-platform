import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Lang } from '@/design-preview/data';
import {
  MATCHNIGHT,
  MATCHNIGHT_SCREENS,
  type MatchnightScreen,
} from '@/design-preview/matchnight/registry';
import type { BugState } from '@/design-preview/matchnight/screens';

export function generateStaticParams() {
  return ['ar', 'en'].flatMap((lang) => MATCHNIGHT_SCREENS.map((screen) => ({ lang, screen })));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang; screen: MatchnightScreen }>;
  searchParams: Promise<{
    clean?: string;
    font?: string;
    state?: string;
    bug?: string;
    menu?: string;
    long?: string;
    round?: string;
  }>;
}) {
  const [{ lang, screen }, q] = await Promise.all([params, searchParams]);
  const { clean } = q;
  // Preview switches: Latin display face, match state, what the mobile bug shows, menu open.
  const font = q.font === 'anton' || q.font === 'barlow' ? q.font : 'shoulders';
  const state = q.state === 'upcoming' ? 'upcoming' : 'live';
  const bug: BugState = q.bug === 'upcoming' || q.bug === 'none' ? q.bug : 'live';
  const View = MATCHNIGHT[screen];
  if (!View) notFound();
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  return (
    <>
      <div data-font={font}>
        <View
          lang={lang}
          state={state}
          bug={bug}
          menu={q.menu === '1'}
          long={q.long === '1'}
          round={q.round === 'qf' || q.round === 'sf' || q.round === 'f' ? q.round : undefined}
        />
      </div>
      {!clean && (
        <div
          dir="ltr"
          className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center gap-1 bg-black/90 px-3 py-1.5 font-mono text-[11px] text-white"
        >
          <span className="me-2 text-amber-300">Design preview — Matchnight — sample data</span>
          {MATCHNIGHT_SCREENS.map((s) => (
            <Link
              key={s}
              href={`/design/${lang}/matchnight/${s}`}
              className={`rounded px-2 py-1 hover:bg-white/15 ${s === screen ? 'bg-white/20' : ''}`}
            >
              {s}
            </Link>
          ))}
          <Link
            href={`/design/${other}/matchnight/${screen}`}
            className="rounded px-2 py-1 hover:bg-white/15"
          >
            {other.toUpperCase()}
          </Link>
        </div>
      )}
    </>
  );
}
