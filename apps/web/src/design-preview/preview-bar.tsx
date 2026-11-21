import Link from 'next/link';
import { C } from './copy';
import type { Lang } from './data';

export const CONCEPTS = [
  { id: 'broadcast', label: 'A — Matchday Broadcast' },
  { id: 'federation', label: 'B — Federation' },
  { id: 'cardpack', label: 'C — Card Pack' },
] as const;
export const SCREENS = ['home', 'dashboard', 'clan', 'tournament', 'admin'] as const;
export type Concept = (typeof CONCEPTS)[number]['id'];
export type Screen = (typeof SCREENS)[number];

/** Neutral review chrome, deliberately unstyled by any concept. Hidden with ?clean=1 for screenshots. */
export function PreviewBar({ lang, concept, screen }: { lang: Lang; concept: Concept; screen: Screen }) {
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  const link = 'rounded px-2 py-1 hover:bg-white/15';
  return (
    <div
      dir="ltr"
      className="fixed inset-x-0 bottom-0 z-[100] flex flex-wrap items-center gap-1 border-t border-white/20 bg-black/90 px-3 py-2 font-mono text-[11px] text-white backdrop-blur md:bottom-auto md:top-0 md:border-b md:border-t-0"
    >
      <span className="me-2 text-amber-300">{C.preview.label.en}</span>
      {CONCEPTS.map((c) => (
        <Link key={c.id} href={`/design/${lang}/${c.id}/${screen}`} className={`${link} ${c.id === concept ? 'bg-white/20' : ''}`}>
          {c.label}
        </Link>
      ))}
      <span className="mx-2 opacity-40">|</span>
      {SCREENS.map((s) => (
        <Link key={s} href={`/design/${lang}/${concept}/${s}`} className={`${link} ${s === screen ? 'bg-white/20' : ''}`}>
          {C.preview.screens[s].en}
        </Link>
      ))}
      <span className="mx-2 opacity-40">|</span>
      <Link href={`/design/${other}/${concept}/${screen}`} className={link}>
        {other.toUpperCase()}
      </Link>
    </div>
  );
}
