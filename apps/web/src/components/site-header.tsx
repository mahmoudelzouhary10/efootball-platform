import type { MeResponse } from '@efp/contracts';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { isStaff } from '@/lib/session';
import { LanguageSwitch } from './language-switch';
import { BottomNav, HeaderNav, type NavItem } from './nav-links';
import { buttonClass } from './ui';

function navItems(user: MeResponse | null): NavItem[] {
  const items: NavItem[] = [
    { href: '/', key: 'home' },
    { href: '/clans', key: 'clans' },
  ];
  if (user) items.push({ href: '/dashboard', key: 'dashboard' });
  else items.push({ href: '/login', key: 'login' });
  if (isStaff(user)) items.push({ href: '/admin', key: 'admin' });
  return items;
}

/** Platform mark: a small gold shield, echoing the clan crest. */
export function Mark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 36" className={className} aria-hidden>
      <path d="M16 1 31 5.5v16.6L16 35 1 22.1V5.5z" fill="var(--color-accent)" />
      <path d="M16 6.5 26 9.6v11L16 29.4 6 20.6v-11z" fill="var(--color-bg)" />
      <path d="M16 11.5 21 13v6l-5 4.4-5-4.4v-6z" fill="var(--color-accent)" />
    </svg>
  );
}

export async function SiteHeader({ user }: { user: MeResponse | null }) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const items = navItems(user);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label={t('meta.appName')} className="flex items-center gap-2.5">
              <Mark />
              <span className="hidden whitespace-nowrap font-display text-[1.05rem] font-semibold sm:inline">
                {t('meta.appName')}
              </span>
            </Link>
            <HeaderNav items={items} />
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap text-sm">
            {/* The switch reads the query string (to keep ?token= on auth links), which only
                exists client-side; the fallback keeps the header fully server-rendered. */}
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
              <Link
                href="/account"
                aria-label={t('nav.account')}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <span className="grid size-7 place-items-center rounded-full bg-surface-3 font-display text-xs font-semibold text-ink">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline" dir="ltr">
                  {user.username}
                </span>
              </Link>
            ) : (
              <Link href="/register" className={buttonClass('primary', 'sm')}>
                {t('nav.register')}
              </Link>
            )}
          </div>
        </div>
      </header>
      <BottomNav items={items} />
    </>
  );
}
