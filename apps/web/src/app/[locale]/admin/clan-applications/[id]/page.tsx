import type { AdminClanApplicationResponse } from '@efp/contracts';
import { CircleCheck, CircleX, ExternalLink, Mail } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Avatar, ClanTag, Country, Crest } from '@/components/identity';
import { buttonClass, Card, Chip, PageContainer } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { getCurrentUser, isStaff, serverGet } from '@/lib/session';
import { ReviewActions } from './review-actions';

const STATUS_TONE = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  withdrawn: 'neutral',
} as const;

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CircleCheck className="size-4 shrink-0 text-success" aria-hidden />
      ) : (
        <CircleX className="size-4 shrink-0 text-danger" aria-hidden />
      )}
      <span className={ok ? 'text-ink' : 'text-[#ff8f92]'}>{label}</span>
    </li>
  );
}

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!isStaff(await getCurrentUser())) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const res = await serverGet<AdminClanApplicationResponse>(`/admin/clan-applications/${id}`);
  if (!res.ok) notFound();
  const app = res.data;
  const [t, tStatus, format] = await Promise.all([
    getTranslations('admin'),
    getTranslations('statuses'),
    getFormatter(),
  ]);
  const tApply = await getTranslations('apply');
  const date = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <PageContainer>
      <Link
        href={`/admin/clan-applications?status=${app.status}`}
        className="text-sm text-ink-muted hover:text-ink"
      >
        {t('backToQueue')}
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start">
        {/* What is being reviewed: exactly the five criteria. */}
        <Card>
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-start">
            <Crest logoUrl={app.logoUrl} tag={app.tag} name={app.name} size="xl" />
            <div className="min-w-0 flex-1">
              <Chip tone={STATUS_TONE[app.status]}>{tStatus(app.status)}</Chip>
              <h1 className="mt-2 text-3xl font-bold">{app.name}</h1>
              <ClanTag tag={app.tag} className="text-base" />
              <p className="mt-2 text-xs text-ink-faint">
                {t('submitted', { date: date(app.createdAt) })}
              </p>
            </div>
          </div>

          <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-muted">{t('criteria')}</h2>
          <dl className="grid gap-4 rounded-[var(--radius-control)] border border-line p-4 text-sm">
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-muted">{tApply('name')}</dt>
              <dd className="font-medium">{app.name}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-muted">{tApply('tag')}</dt>
              <dd>
                <span className="kit-tag">{app.tag}</span>
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-muted">{tApply('logo')}</dt>
              <dd>
                {app.logoUrl && (
                  <a href={app.logoUrl} target="_blank" rel="noopener" className="inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- full-size check of the uploaded logo */}
                    <img
                      src={app.logoUrl}
                      alt={app.name}
                      className="size-32 rounded-lg border border-line object-cover"
                    />
                  </a>
                )}
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-muted">{tApply('description')}</dt>
              <dd className="whitespace-pre-line leading-relaxed">{app.description}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-muted">{tApply('contactUrl')}</dt>
              <dd className="min-w-0">
                <a
                  href={app.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex max-w-full items-center gap-1.5 break-all text-info hover:underline"
                  dir="ltr"
                >
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  {app.contactUrl}
                </a>
              </dd>
            </div>
          </dl>

          {app.rejectionReason && (
            <div className="mt-5 rounded-[var(--radius-control)] border border-danger/40 bg-danger/10 p-4 text-sm">
              <p className="font-semibold text-[#ffb3b5]">{t('rejectReason')}</p>
              <p className="mt-1">{app.rejectionReason}</p>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          {app.status === 'pending' ? (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-ink-muted">{t('checks')}</h2>
              <ul className="mb-5 flex flex-col gap-2">
                <Check
                  ok={app.checks.nameAvailable}
                  label={app.checks.nameAvailable ? t('nameAvailable') : t('nameTaken')}
                />
                <Check
                  ok={app.checks.tagAvailable}
                  label={app.checks.tagAvailable ? t('tagAvailable') : t('tagTaken')}
                />
                <Check
                  ok={!app.checks.applicantInClan}
                  label={app.checks.applicantInClan ? t('applicantInClan') : t('applicantFree')}
                />
              </ul>
              <ReviewActions applicationId={app.id} name={app.name} />
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-ink-muted">
                {app.reviewedAt &&
                  (app.reviewedBy
                    ? t('decidedBy', { name: app.reviewedBy, date: date(app.reviewedAt) })
                    : t('decidedOn', { date: date(app.reviewedAt) }))}
              </p>
              {app.clanTag && (
                <Link
                  href={`/clans/${app.clanTag}`}
                  className={buttonClass('secondary', 'sm', 'mt-3')}
                >
                  {t('viewClan')}
                </Link>
              )}
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-ink-muted">{t('applicant')}</h2>
            <Link
              href={`/players/${app.applicant.username}`}
              className="flex items-center gap-3 hover:text-accent"
            >
              <Avatar url={app.applicant.avatarUrl} name={app.applicant.displayName} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">{app.applicant.displayName}</p>
                <p className="truncate text-xs text-ink-muted" dir="ltr">
                  @{app.applicant.username}
                </p>
              </div>
            </Link>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <dt className="sr-only">{t('email')}</dt>
                <Mail className="size-4 text-ink-faint" aria-hidden />
                <dd className="min-w-0 truncate" dir="ltr">
                  {app.applicant.email}
                </dd>
                <Chip tone={app.applicant.emailVerified ? 'green' : 'amber'}>
                  {app.applicant.emailVerified ? t('emailVerified') : t('emailUnverified')}
                </Chip>
              </div>
              <div>
                <dt className="sr-only">{(await getTranslations('player'))('country')}</dt>
                <dd>
                  <Country code={app.applicant.countryCode} locale={locale} />
                </dd>
              </div>
              <div>
                <dd className="text-ink-muted">
                  {t('accountCreated', { date: date(app.applicant.accountCreatedAt) })}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
