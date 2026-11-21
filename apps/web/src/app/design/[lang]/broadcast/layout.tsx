import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/noto-kufi-arabic/400.css';
import '@fontsource/noto-kufi-arabic/600.css';
import '@fontsource/noto-kufi-arabic/800.css';
import '@/design-preview/broadcast/broadcast.css';
import type { ReactNode } from 'react';

export default function BroadcastLayout({ children }: { children: ReactNode }) {
  return <div className="bc">{children}</div>;
}
