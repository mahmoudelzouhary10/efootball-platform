'use client';

import type { ClanApplicationResponse } from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useAction } from '@/lib/use-action';

function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-xs text-danger">
      {error}
    </p>
  ) : null;
}

export function InvitationActions({ invitationId }: { invitationId: string }) {
  const t = useTranslations('dashboard');
  const { run, pending, error } = useAction();
  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          className="flex-1 sm:flex-none"
          loading={pending === 'accept'}
          disabled={pending !== null}
          onClick={() => run('accept', () => apiPost(`/clan-invitations/${invitationId}/accept`))}
        >
          {t('accept')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 sm:flex-none"
          loading={pending === 'decline'}
          disabled={pending !== null}
          onClick={() => run('decline', () => apiPost(`/clan-invitations/${invitationId}/decline`))}
        >
          {t('decline')}
        </Button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

export function JoinRequestActions({ requestId }: { requestId: string }) {
  const t = useTranslations('dashboard');
  const { run, pending, error } = useAction();
  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button
        size="sm"
        variant="ghost"
        loading={pending === 'cancel'}
        onClick={() => run('cancel', () => apiPost(`/clan-join-requests/${requestId}/cancel`))}
      >
        {t('cancelRequest')}
      </Button>
      <ErrorLine error={error} />
    </div>
  );
}

export function ApplicationActions({ application }: { application: ClanApplicationResponse }) {
  const t = useTranslations('dashboard');
  const { run, pending, error } = useAction();
  if (application.status === 'rejected') {
    return (
      <Link href="/clans/apply" className="mt-3 inline-block text-sm text-accent hover:underline">
        {t('applyAgain')}
      </Link>
    );
  }
  if (application.status !== 'pending') return null;
  return (
    <div className="mt-3 flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="-ms-3"
        loading={pending === 'withdraw'}
        onClick={() =>
          run('withdraw', () => apiPost(`/clan-applications/${application.id}/withdraw`))
        }
      >
        {t('withdraw')}
      </Button>
      <ErrorLine error={error} />
    </div>
  );
}
