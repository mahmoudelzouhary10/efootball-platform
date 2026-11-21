import type { AdminOverviewResponse } from '@efp/contracts';
import { ClipboardCheck, Shield, UserRound, Users } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { buttonClass, Card, cx, PageContainer } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { getCurrentUser, isStaff, serverGet } from '@/lib/session';

export async function generateMetadata() {
  const t = await getTranslations('admin');
  return { title: t('title') };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Non-staff get a plain 404: the admin area isn't advertised. The API enforces permissions.
  if (!isStaff(await getCurrentUser())) notFound();
  const res = await serverGet<AdminOverviewResponse>('/admin/overview');
  if (!res.ok) notFound();
  const o = res.data;
  const t = await getTranslations('admin');

  const stats = [
    { label: t('users'), value: o.users, icon: UserRound },
    { label: t('players'), value: o.players, icon: Users },
    { label: t('clans'), value: o.activeClans, icon: Shield },
  ];

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>

      {/* The queue is the reason admins come here, so it leads. */}
      <Card
        className={cx(
          'mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
          o.pendingClanApplications > 0 && 'border-accent/50 shadow-[var(--shadow-glow)]',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-full bg-accent/15 text-accent">
            <ClipboardCheck className="size-6" aria-hidden />
          </div>
          <div>
            <p className="font-display text-4xl font-bold tabular">{o.pendingClanApplications}</p>
            <p className="text-sm text-ink-muted">{t('pending')}</p>
          </div>
        </div>
        <Link
          href="/admin/clan-applications"
          className={buttonClass(o.pendingClanApplications > 0 ? 'primary' : 'secondary')}
        >
          {t('openQueue')}
        </Link>
      </Card>

      <h2 className="mb-3 mt-10 text-lg font-semibold">{t('overviewTitle')}</h2>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 bg-surface p-5">
            <s.icon className="size-5 text-ink-faint" aria-hidden />
            <div>
              <dt className="text-sm text-ink-muted">{s.label}</dt>
              <dd className="font-display text-2xl font-semibold tabular">{s.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </PageContainer>
  );
}
