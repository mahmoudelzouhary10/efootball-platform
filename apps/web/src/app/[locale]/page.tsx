import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/session';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, user] = await Promise.all([getTranslations('home'), getCurrentUser()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:py-28">
      <p className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
        {t('eyebrow')}
      </p>
      <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">{t('title')}</h1>
      <p className="max-w-2xl text-lg text-ink-muted">{t('subtitle')}</p>
      <div className="flex flex-wrap gap-3">
        {user ? (
          <Link
            href="/account"
            className="inline-flex h-12 items-center rounded-xl bg-accent px-6 font-semibold text-accent-ink hover:brightness-110"
          >
            {t('ctaAccount')}
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-xl bg-accent px-6 font-semibold text-accent-ink hover:brightness-110"
            >
              {t('ctaRegister')}
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl border border-line bg-surface-2 px-6 hover:border-ink-muted"
            >
              {t('ctaLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
