'use client';

import { REJECTION_REASON_MAX } from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/dialog';
import { Button, TextArea } from '@/components/ui';
import { apiPost } from '@/lib/api';
import { useAction } from '@/lib/use-action';
import { useErrorText } from '@/lib/use-error-text';

export function ReviewActions({ applicationId, name }: { applicationId: string; name: string }) {
  const t = useTranslations('admin');
  const errorText = useErrorText();
  const { run, pending, error, setError } = useAction();
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();

  const close = () => {
    setDialog(null);
    setError(null);
    setReasonError(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={() => setDialog('approve')}>
        {t('approve')}
      </Button>
      <Button variant="danger" onClick={() => setDialog('reject')}>
        {t('reject')}
      </Button>

      <ConfirmDialog
        open={dialog === 'approve'}
        title={t('approveTitle', { name })}
        body={t('approveBody')}
        confirmLabel={t('approve')}
        loading={pending === 'approve'}
        error={error}
        onClose={close}
        onConfirm={async () => {
          if (
            await run('approve', () => apiPost(`/admin/clan-applications/${applicationId}/approve`))
          )
            close();
        }}
      />

      <ConfirmDialog
        open={dialog === 'reject'}
        title={t('rejectTitle')}
        confirmLabel={t('confirmReject')}
        tone="danger"
        loading={pending === 'reject'}
        error={reasonError ? null : error}
        onClose={close}
        onConfirm={async () => {
          setReasonError(undefined);
          const ok = await run('reject', async () => {
            try {
              await apiPost(`/admin/clan-applications/${applicationId}/reject`, { reason });
            } catch (err) {
              setReasonError(errorText.fields(err).reason);
              throw err;
            }
          });
          if (ok) close();
        }}
      >
        <TextArea
          id="reject-reason"
          label={t('rejectReason')}
          hint={t('rejectReasonHint')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={REJECTION_REASON_MAX}
          rows={4}
          required
          aside={`${reason.length} / ${REJECTION_REASON_MAX}`}
          error={reasonError}
        />
      </ConfirmDialog>
    </div>
  );
}
