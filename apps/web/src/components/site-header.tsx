import type { MeResponse } from '@efp/contracts';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { LanguageSwitch } from './language-switch';

export async function SiteHeader({ user }: { user: MeResponse | null }) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  return (
    <header className="border-b border-line/60 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label={t('meta.appName')} className="flex items-center gap-2 font-bold">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink"
          >
            ⚽
          </span>
          <span className="hidden whitespace-nowrap sm:inline">{t('meta.appName')}</span>
        </Link>
        <nav className="flex items-center gap-1 whitespace-nowrap text-sm">
          {/* The switch reads the query string (to keep ?token= on auth links), which only exists
              client-side; the fallback keeps the header fully server-rendered. */}
          <Suspense
            fallback={
              <Link href="/" locale={otherLocale} className="rounded-lg px-3 py-2 text-ink-muted">
                {t('nav.language')}
              </Link>
            }
          >
            <LanguageSwitch label={t('nav.language')} />
          </Suspense>
          {user ? (
            <Link href="/account" className="rounded-lg px-3 py-2 hover:bg-surface-2">
              {user.username}
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-surface-2">
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-accent px-3 py-2 font-semibold text-accent-ink hover:brightness-110"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
