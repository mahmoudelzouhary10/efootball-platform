'use client';

import { Gauge, Home, LayoutDashboard, LogIn, Shield, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cx } from './ui';

export interface NavItem {
  href: '/' | '/clans' | '/dashboard' | '/admin' | '/login';
  key: 'home' | 'clans' | 'dashboard' | 'admin' | 'login';
}

const ICONS: Record<NavItem['key'], LucideIcon> = {
  home: Home,
  clans: Shield,
  dashboard: LayoutDashboard,
  admin: Gauge,
  login: LogIn,
};

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop: inline links in the header. */
export function HeaderNav({ items }: { items: NavItem[] }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative rounded-lg px-3 py-2 text-sm transition',
                active ? 'text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              {t(item.key)}
              {active && (
                <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile: a thumb-reachable bottom tab bar, designed for one-handed use. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  return (
    <nav
      aria-label={t('mobileNav')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          const active = isActive(pathname, item.href);
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] transition',
                  active ? 'text-accent' : 'text-ink-muted',
                )}
              >
                <Icon className="size-5" aria-hidden strokeWidth={active ? 2.25 : 1.75} />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
