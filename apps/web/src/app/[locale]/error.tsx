'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, EmptyState, PageContainer } from '@/components/ui';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('common');
  return (
    <PageContainer narrow>
      <EmptyState
        icon={<TriangleAlert className="size-6" aria-hidden />}
        title={t('errorTitle')}
        description={t('errorBody')}
        action={
          <Button variant="secondary" onClick={reset}>
            {t('retry')}
          </Button>
        }
      />
    </PageContainer>
  );
}
