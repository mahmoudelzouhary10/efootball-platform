'use client';

import type { ClanCardResponse, Page } from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ClanCard } from '@/components/clan-card';
import { Button } from '@/components/ui';
import { apiGet } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function ClanGrid({
  initial,
  initialCursor,
  query,
}: {
  initial: ClanCardResponse[];
  initialCursor: string | null;
  query: string;
}) {
  const t = useTranslations('clans');
  const errorText = useErrorText();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '24', cursor });
      if (query) params.set('q', query);
      const page = await apiGet<Page<ClanCardResponse>>(`/clans?${params}`);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (err) {
      setError(errorText.message(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((clan) => (
          <li key={clan.id}>
            <ClanCard clan={clan} />
          </li>
        ))}
      </ul>
      {(cursor || error) && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          {cursor && (
            <Button variant="secondary" onClick={loadMore} loading={loading}>
              {t('loadMore')}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
