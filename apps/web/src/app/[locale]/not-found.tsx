import { Compass } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { EmptyState, PageContainer, buttonClass } from '@/components/ui';
import { Link } from '@/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <PageContainer narrow>
      <EmptyState
        icon={<Compass className="size-6" aria-hidden />}
        title={t('notFoundTitle')}
        description={t('notFoundBody')}
        action={
          <Link href="/" className={buttonClass('secondary')}>
            {t('toHome')}
          </Link>
        }
      />
    </PageContainer>
  );
}
