import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Lang } from '@/design-preview/data';
import { MATCHNIGHT, MATCHNIGHT_SCREENS, type MatchnightScreen } from '@/design-preview/matchnight/screens';

export function generateStaticParams() {
  return ['ar', 'en'].flatMap((lang) => MATCHNIGHT_SCREENS.map((screen) => ({ lang, screen })));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang; screen: MatchnightScreen }>;
  searchParams: Promise<{ clean?: string }>;
}) {
  const [{ lang, screen }, { clean }] = await Promise.all([params, searchParams]);
  const View = MATCHNIGHT[screen];
  if (!View) notFound();
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  return (
    <>
      <View lang={lang} />
      {!clean && (
        <div dir="ltr" className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center gap-1 bg-black/90 px-3 py-1.5 font-mono text-[11px] text-white">
          <span className="me-2 text-amber-300">Design preview — Matchnight — sample data</span>
          {MATCHNIGHT_SCREENS.map((s) => (
            <Link key={s} href={`/design/${lang}/matchnight/${s}`} className={`rounded px-2 py-1 hover:bg-white/15 ${s === screen ? 'bg-white/20' : ''}`}>
              {s}
            </Link>
          ))}
          <Link href={`/design/${other}/matchnight/${screen}`} className="rounded px-2 py-1 hover:bg-white/15">
            {other.toUpperCase()}
          </Link>
        </div>
      )}
    </>
  );
}
