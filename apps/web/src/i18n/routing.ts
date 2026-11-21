import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // Arabic URLs have no prefix (/login); English is /en/login.
  localePrefix: 'as-needed',
  // Arabic unless the user picks English (remembered in the NEXT_LOCALE cookie); browser language is ignored.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const directionOf = (locale: Locale): 'rtl' | 'ltr' => (locale === 'ar' ? 'rtl' : 'ltr');

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
