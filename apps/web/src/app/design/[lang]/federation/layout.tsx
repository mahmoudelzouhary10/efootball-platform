import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/800.css';
import '@fontsource/archivo/900.css';
import '@fontsource/alexandria/400.css';
import '@fontsource/alexandria/600.css';
import '@fontsource/alexandria/800.css';
import '@/design-preview/federation/federation.css';
import type { ReactNode } from 'react';

export default function FederationLayout({ children }: { children: ReactNode }) {
  return <div className="fd">{children}</div>;
}
