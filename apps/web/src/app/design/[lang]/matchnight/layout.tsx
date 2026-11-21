import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import '@fontsource/alexandria/400.css';
import '@fontsource/alexandria/600.css';
import '@fontsource/alexandria/700.css';
import '@fontsource/alexandria/800.css';
import '@/design-preview/matchnight/matchnight.css';
import type { ReactNode } from 'react';

export default function MatchnightLayout({ children }: { children: ReactNode }) {
  return <div className="mn">{children}</div>;
}
