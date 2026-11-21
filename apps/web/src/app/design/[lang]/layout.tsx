import '../../globals.css';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * DESIGN PREVIEW ONLY — isolated root layout for the three visual concepts.
 * Disabled in production unless DESIGN_PREVIEW=1, and never linked from the product.
 */
export const metadata = { title: 'Design preview', robots: { index: false, follow: false } };

function previewEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.DESIGN_PREVIEW === '1';
}

export default async function PreviewRoot({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!previewEnabled() || (lang !== 'ar' && lang !== 'en')) notFound();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className="!bg-none">{children}</body>
    </html>
  );
}
