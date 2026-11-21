import '@fontsource/changa/400.css';
import '@fontsource/changa/600.css';
import '@fontsource/changa/800.css';
import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import '@/design-preview/cardpack/cardpack.css';
import type { ReactNode } from 'react';

export default function CardPackLayout({ children }: { children: ReactNode }) {
  return <div className="cp">{children}</div>;
}
