import '../fonts.css';
import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { SiteHeader } from '@/components/site-header';
import { directionOf, routing } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/session';

export const viewport: Viewport = { themeColor: '#0e1420', width: 'device-width', initialScale: 1 };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: { default: t('appName'), template: `%s · ${t('appName')}` },
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Preload the faces that render the first headline and body text in this locale.
  const subset = locale === 'ar' ? 'arabic' : 'latin';
  for (const file of [
    `readex-pro-${subset}-700-normal`,
    `ibm-plex-sans-arabic-${subset}-400-normal`,
  ]) {
    preload(`/fonts/${file}.woff2`, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }

  const user = await getCurrentUser();
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <html lang={locale} dir={directionOf(locale)}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <SiteHeader user={user} />
          <main id="main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
