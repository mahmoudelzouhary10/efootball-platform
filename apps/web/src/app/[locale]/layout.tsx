import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { directionOf, routing } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/session';

export const viewport: Viewport = { themeColor: '#0f131c', width: 'device-width', initialScale: 1 };

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
