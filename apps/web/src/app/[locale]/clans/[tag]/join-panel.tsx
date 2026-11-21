'use client';

import { JOIN_MESSAGE_MAX, type ClanRole } from '@efp/contracts';
import { Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/dialog';
import { Button, buttonClass, TextArea } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useAction } from '@/lib/use-action';

export type Viewer =
  | { kind: 'anonymous' }
  | { kind: 'no-profile' }
  | { kind: 'other-clan' }
  | { kind: 'member'; role: ClanRole }
  | { kind: 'requested'; requestId: string }
  | { kind: 'can-request' };

/** The primary action on a clan page, chosen by who is looking. */
export function JoinPanel({ tag, viewer, full }: { tag: string; viewer: Viewer; full: boolean }) {
  const t = useTranslations('clans');
  const tDash = useTranslations('dashboard');
  const { run, pending, error, setError } = useAction();
  const [dialog, setDialog] = useState<'join' | 'leave' | null>(null);
  const [message, setMessage] = useState('');

  const note = (text: string) => (
    <p className="rounded-[var(--radius-control)] bg-surface-3 px-3 py-2.5 text-center text-sm text-ink-muted">
      {text}
    </p>
  );

  switch (viewer.kind) {
    case 'anonymous':
      return (
        <Link href="/login" className={buttonClass('primary')}>
          {t('signInToJoin')}
        </Link>
      );
    case 'no-profile':
      return (
        <Link href="/me/profile" className={buttonClass('primary')}>
          {t('createProfileToJoin')}
        </Link>
      );
    case 'other-clan':
      return note(t('inAnotherClan'));
    case 'requested':
      return (
        <div className="flex flex-col gap-2">
          <p className="flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning">
            <Clock3 className="size-4" aria-hidden />
            {t('requestPending')}
          </p>
          <Button
            variant="ghost"
            size="sm"
            loading={pending === 'cancel'}
            onClick={() =>
              run('cancel', () => apiPost(`/clan-join-requests/${viewer.requestId}/cancel`))
            }
          >
            {tDash('cancelRequest')}
          </Button>
          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      );
    case 'member':
      return (
        <div className="flex flex-col gap-2">
          {viewer.role !== 'member' ? (
            <Link href={`/clans/${tag}/manage`} className={buttonClass('primary')}>
              {t('manage')}
            </Link>
          ) : (
            note(t('yourClan'))
          )}
          {viewer.role !== 'leader' && (
            <>
              <Button variant="danger" size="sm" onClick={() => setDialog('leave')}>
                {t('leave')}
              </Button>
              <ConfirmDialog
                open={dialog === 'leave'}
                title={t('leaveTitle')}
                body={t('leaveBody')}
                confirmLabel={t('leave')}
                tone="danger"
                loading={pending === 'leave'}
                error={error}
                onClose={() => {
                  setDialog(null);
                  setError(null);
                }}
                onConfirm={async () => {
                  if (await run('leave', () => apiPost(`/clans/${tag}/leave`))) setDialog(null);
                }}
              />
            </>
          )}
        </div>
      );
    case 'can-request':
      if (full) return note(t('full'));
      return (
        <>
          <Button onClick={() => setDialog('join')}>{t('requestJoin')}</Button>
          <ConfirmDialog
            open={dialog === 'join'}
            title={t('requestJoin')}
            confirmLabel={t('sendRequest')}
            loading={pending === 'join'}
            error={error}
            onClose={() => {
              setDialog(null);
              setError(null);
            }}
            onConfirm={async () => {
              const ok = await run('join', () =>
                apiPost(`/clans/${tag}/join-requests`, { message }),
              );
              if (ok) setDialog(null);
            }}
          >
            <TextArea
              id="join-message"
              label={t('requestMessage')}
              placeholder={t('requestMessagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={JOIN_MESSAGE_MAX}
              rows={3}
              aside={`${message.length} / ${JOIN_MESSAGE_MAX}`}
            />
          </ConfirmDialog>
        </>
      );
  }
}
