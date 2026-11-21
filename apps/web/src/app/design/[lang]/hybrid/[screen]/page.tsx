import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Lang } from '@/design-preview/data';
import { H } from '@/design-preview/hybrid/extra';
import { HYBRID, HYBRID_SCREENS, type HybridScreen } from '@/design-preview/hybrid/screens';

export function generateStaticParams() {
  return ['ar', 'en'].flatMap((lang) => HYBRID_SCREENS.map((screen) => ({ lang, screen })));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang; screen: HybridScreen }>;
  searchParams: Promise<{ clean?: string }>;
}) {
  const [{ lang, screen }, { clean }] = await Promise.all([params, searchParams]);
  const View = HYBRID[screen];
  if (!View) notFound();
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  return (
    <>
      <View lang={lang} />
      {!clean && (
        <div dir="ltr" className="fixed inset-x-0 bottom-0 z-[100] flex flex-wrap items-center gap-1 border-t border-white/20 bg-black/90 px-3 py-2 font-mono text-[11px] text-white md:bottom-auto md:top-0">
          <span className="me-2 text-amber-300">Design preview — Hybrid — sample data</span>
          {HYBRID_SCREENS.map((s) => (
            <Link key={s} href={`/design/${lang}/hybrid/${s}`} className={`rounded px-2 py-1 hover:bg-white/15 ${s === screen ? 'bg-white/20' : ''}`}>
              {H.screens[s].en}
            </Link>
          ))}
          <Link href={`/design/${other}/hybrid/${screen}`} className="rounded px-2 py-1 hover:bg-white/15">
            {other.toUpperCase()}
          </Link>
        </div>
      )}
    </>
  );
}
