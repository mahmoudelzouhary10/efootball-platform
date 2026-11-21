import {
  CLAN_APPLICATION_STATUSES,
  type AdminClanApplicationResponse,
  type ClanApplicationStatus,
  type Page,
} from '@efp/contracts';
import { Inbox } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ClanTag, Crest } from '@/components/identity';
import { buttonClass, Chip, cx, EmptyState, PageContainer, SectionHeader } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { getCurrentUser, isStaff, serverGet } from '@/lib/session';

const STATUS_TONE = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  withdrawn: 'neutral',
} as const;

export async function generateMetadata() {
  const t = await getTranslations('admin');
  return { title: t('queueTitle') };
}

export default async function ApplicationsQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  if (!isStaff(await getCurrentUser())) notFound();

  const status: ClanApplicationStatus = CLAN_APPLICATION_STATUSES.includes(
    sp.status as ClanApplicationStatus,
  )
    ? (sp.status as ClanApplicationStatus)
    : 'pending';
  const cursor = typeof sp.cursor === 'string' ? sp.cursor : undefined;
  const res = await serverGet<Page<AdminClanApplicationResponse>>(
    `/admin/clan-applications?status=${status}&limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
  );
  if (!res.ok) notFound();
  const [t, tStatus, tClans, format] = await Promise.all([
    getTranslations('admin'),
    getTranslations('statuses'),
    getTranslations('clans'),
    getFormatter(),
  ]);

  return (
    <PageContainer>
      <Link href="/admin" className="text-sm text-ink-muted hover:text-ink">
        {t('title')}
      </Link>
      <div className="mt-2">
        <SectionHeader as="h1" title={t('queueTitle')} description={t('queueDescription')} />
      </div>

      <nav aria-label={t('queueTitle')} className="-mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex gap-2">
          {CLAN_APPLICATION_STATUSES.map((s) => (
            <li key={s}>
              <Link
                href={`/admin/clan-applications?status=${s}`}
                aria-current={status === s ? 'page' : undefined}
                className={cx(
                  'inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-sm transition',
                  status === s
                    ? 'border-accent/60 bg-accent/10 text-accent'
                    : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
                )}
              >
                {tStatus(s)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {res.data.items.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" aria-hidden />} title={t('emptyQueue')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {res.data.items.map((app) => (
            <li key={app.id}>
              <Link
                href={`/admin/clan-applications/${app.id}`}
                className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition hover:border-accent/50 sm:p-5"
              >
                <Crest logoUrl={app.logoUrl} tag={app.tag} name={app.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-lg font-semibold group-hover:text-accent">
                      {app.name}
                    </p>
                    <ClanTag tag={app.tag} className="text-xs" />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {app.applicant.displayName}{' '}
                    <span dir="ltr" className="text-ink-faint">
                      @{app.applicant.username}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {t('submitted', {
                      date: format.dateTime(new Date(app.createdAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }),
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Chip tone={STATUS_TONE[app.status]}>{tStatus(app.status)}</Chip>
                  {app.status === 'pending' && !app.checks.nameAvailable && (
                    <Chip tone="red">{t('nameTaken')}</Chip>
                  )}
                  {app.status === 'pending' && !app.checks.tagAvailable && (
                    <Chip tone="red">{t('tagTaken')}</Chip>
                  )}
                  {app.status === 'pending' && app.checks.applicantInClan && (
                    <Chip tone="red">{t('applicantInClan')}</Chip>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {res.data.nextCursor && (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/admin/clan-applications?status=${status}&cursor=${encodeURIComponent(res.data.nextCursor)}`}
            className={buttonClass('secondary')}
          >
            {tClans('loadMore')}
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
