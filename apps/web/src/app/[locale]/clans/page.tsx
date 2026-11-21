import type { ClanCardResponse, Page } from '@efp/contracts';
import { Search, SearchX, Shield, X } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonClass, EmptyState, PageContainer, SectionHeader } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { serverGet } from '@/lib/session';
import { ClanGrid } from './clan-grid';

export async function generateMetadata() {
  const t = await getTranslations('clans');
  return { title: t('title') };
}

export default async function ClansPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale }, { q }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const query = typeof q === 'string' ? q.trim().slice(0, 32) : '';
  const t = await getTranslations('clans');
  const res = await serverGet<Page<ClanCardResponse>>(
    `/clans?limit=24${query ? `&q=${encodeURIComponent(query)}` : ''}`,
  );
  const page = res.ok ? res.data : { items: [], nextCursor: null };

  return (
    <PageContainer>
      <SectionHeader
        as="h1"
        title={t('title')}
        description={t('description')}
        action={
          <Link href="/clans/apply" className={buttonClass('secondary', 'sm')}>
            {t('apply')}
          </Link>
        }
      />

      {/* Plain GET form: works before JavaScript loads and keeps the query in the URL. */}
      <form role="search" action="" className="relative mb-6 max-w-xl">
        <label htmlFor="clan-search" className="sr-only">
          {t('searchLabel')}
        </label>
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <input
          id="clan-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t('searchPlaceholder')}
          maxLength={32}
          className="h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface ps-10 pe-24 text-base outline-none transition placeholder:text-ink-faint focus:border-accent"
        />
        <div className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <Link
              href="/clans"
              aria-label={t('clearSearch')}
              className="rounded-md p-2 text-ink-muted hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </Link>
          )}
          <button type="submit" className={buttonClass('secondary', 'sm', 'h-9')}>
            {t('search')}
          </button>
        </div>
      </form>

      {page.items.length === 0 ? (
        query ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={t('noResultsTitle')}
            description={t('noResults', { q: query })}
          />
        ) : (
          <EmptyState
            icon={<Shield className="size-6" aria-hidden />}
            title={t('emptyTitle')}
            description={t('emptyBody')}
            action={
              <Link href="/clans/apply" className={buttonClass('primary')}>
                {t('apply')}
              </Link>
            }
          />
        )
      ) : (
        <ClanGrid initial={page.items} initialCursor={page.nextCursor} query={query} />
      )}
    </PageContainer>
  );
}
