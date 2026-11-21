'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/routing';

/** Switches between Arabic and English, keeping the current page and query string. */
export function LanguageSwitch({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const target = locale === 'ar' ? 'en' : 'ar';
  return (
    <Link
      href={search ? `${pathname}?${search}` : pathname}
      locale={target}
      lang={target}
      className="rounded-lg px-3 py-2 text-ink-muted hover:bg-surface-2 hover:text-ink"
    >
      {label}
    </Link>
  );
}
