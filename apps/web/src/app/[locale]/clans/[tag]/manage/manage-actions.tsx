'use client';

import { CLAN_DESCRIPTION_MAX, type ClanRole } from '@efp/contracts';
import { Crown, EllipsisVertical, UserMinus, UserRoundCog } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '@/components/dialog';
import { ImageUpload } from '@/components/image-upload';
import { Alert, Button, Field, TextArea } from '@/components/ui';
import { apiPatch, apiPost } from '@/lib/api';
import { useAction } from '@/lib/use-action';
import { useErrorText } from '@/lib/use-error-text';

// ── members ─────────────────────────────────────────────────────────────────

type MemberRef = { username: string; displayName: string; role: ClanRole };

/**
 * Per-member action menu. Only actions the actor's role allows are offered (mirroring
 * ClanPolicy on the server, which remains the authority).
 */
export function MemberActions({
  tag,
  member,
  actorRole,
}: {
  tag: string;
  member: MemberRef;
  actorRole: ClanRole;
}) {
  const t = useTranslations('manage');
  const { run, pending, error, setError } = useAction();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<'kick' | 'transfer' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === 'Escape'
          : !menuRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const isLeader = actorRole === 'leader';
  const canKick =
    member.role !== 'leader' &&
    (isLeader || (actorRole === 'co_leader' && member.role === 'member'));
  if (!isLeader && !canKick) return null;

  const base = `/clans/${tag}/members/${encodeURIComponent(member.username)}`;
  const item =
    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-start text-sm hover:bg-surface-3 disabled:opacity-50';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('actions')}: ${member.displayName}`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-[var(--radius-control)] text-ink-muted hover:bg-surface-2 hover:text-ink"
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-20 mt-1 w-56 animate-[var(--animate-fade)] rounded-[var(--radius-control)] border border-line bg-surface-2 p-1 shadow-[var(--shadow-raise)]"
        >
          {isLeader && member.role === 'member' && (
            <button
              role="menuitem"
              className={item}
              disabled={pending !== null}
              onClick={() =>
                run('role', () => apiPost(`${base}/role`, { role: 'co_leader' })).then(() =>
                  setOpen(false),
                )
              }
            >
              <UserRoundCog className="size-4 text-info" aria-hidden />
              {t('promote')}
            </button>
          )}
          {isLeader && member.role === 'co_leader' && (
            <button
              role="menuitem"
              className={item}
              disabled={pending !== null}
              onClick={() =>
                run('role', () => apiPost(`${base}/role`, { role: 'member' })).then(() =>
                  setOpen(false),
                )
              }
            >
              <UserRoundCog className="size-4 text-ink-muted" aria-hidden />
              {t('demote')}
            </button>
          )}
          {isLeader && (
            <button
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                setDialog('transfer');
              }}
            >
              <Crown className="size-4 text-accent" aria-hidden />
              {t('transfer')}
            </button>
          )}
          {canKick && (
            <button
              role="menuitem"
              className={`${item} text-danger`}
              onClick={() => {
                setOpen(false);
                setDialog('kick');
              }}
            >
              <UserMinus className="size-4" aria-hidden />
              {t('kick')}
            </button>
          )}
        </div>
      )}
      {error && !dialog && (
        <p role="alert" className="absolute end-0 top-full mt-1 w-56 text-xs text-danger">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={dialog === 'kick'}
        title={t('kickTitle', { name: member.displayName })}
        body={t('kickBody')}
        confirmLabel={t('kick')}
        tone="danger"
        loading={pending === 'kick'}
        error={error}
        onClose={() => {
          setDialog(null);
          setError(null);
        }}
        onConfirm={async () => {
          if (await run('kick', () => apiPost(`${base}/kick`))) setDialog(null);
        }}
      />
      <ConfirmDialog
        open={dialog === 'transfer'}
        title={t('transferTitle', { name: member.displayName })}
        body={t('transferBody', { name: member.displayName })}
        confirmLabel={t('transfer')}
        loading={pending === 'transfer'}
        error={error}
        onClose={() => {
          setDialog(null);
          setError(null);
        }}
        onConfirm={async () => {
          if (
            await run('transfer', () =>
              apiPost(`/clans/${tag}/transfer-leadership`, { username: member.username }),
            )
          ) {
            setDialog(null);
          }
        }}
      />
    </div>
  );
}

export function InviteForm({ tag }: { tag: string }) {
  const t = useTranslations('manage');
  const { run, pending, error } = useAction();
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const username = String(new FormData(formEl).get('username') ?? '')
      .trim()
      .replace(/^@/, '');
    if (!username) return;
    setSentTo(null);
    if (await run('invite', () => apiPost(`/clans/${tag}/invitations`, { username }))) {
      setSentTo(username);
      formEl.reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <Field
        id="invite-username"
        name="username"
        label={t('inviteLabel')}
        placeholder={t('invitePlaceholder')}
        dir="ltr"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={21}
        required
      />
      <Button type="submit" variant="secondary" loading={pending === 'invite'}>
        {t('invite')}
      </Button>
      {sentTo && <Alert tone="success">{t('invited', { name: sentTo })}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
    </form>
  );
}

// ── requests & invitations ──────────────────────────────────────────────────

export function RequestRowActions({ requestId }: { requestId: string }) {
  const t = useTranslations('manage');
  const { run, pending, error } = useAction();
  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div className="flex gap-2">
        <Button
          variant="success"
          size="sm"
          className="flex-1 sm:flex-none"
          loading={pending === 'approve'}
          disabled={pending !== null}
          onClick={() => run('approve', () => apiPost(`/clan-join-requests/${requestId}/approve`))}
        >
          {t('approve')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 sm:flex-none"
          loading={pending === 'reject'}
          disabled={pending !== null}
          onClick={() => run('reject', () => apiPost(`/clan-join-requests/${requestId}/reject`))}
        >
          {t('reject')}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function InvitationRowActions({ invitationId }: { invitationId: string }) {
  const t = useTranslations('manage');
  const { run, pending, error } = useAction();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        loading={pending === 'revoke'}
        onClick={() => run('revoke', () => apiPost(`/clan-invitations/${invitationId}/revoke`))}
      >
        {t('revoke')}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ── settings ────────────────────────────────────────────────────────────────

export function ClanSettingsForm({
  tag,
  initial,
}: {
  tag: string;
  initial: { logoUrl: string | null; description: string; contactUrl: string };
}) {
  const t = useTranslations('manage');
  const tApply = useTranslations('apply');
  const errorText = useErrorText();
  const { run, pending, error } = useAction();
  const [logoMediaId, setLogoMediaId] = useState<string | undefined>();
  const [description, setDescription] = useState(initial.description);
  const [contactUrl, setContactUrl] = useState(initial.contactUrl);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    setFieldErrors({});
    const body: Record<string, string> = {};
    if (logoMediaId) body.logoMediaId = logoMediaId;
    if (description !== initial.description) body.description = description;
    if (contactUrl !== initial.contactUrl) body.contactUrl = contactUrl;
    if (Object.keys(body).length === 0) return setSaved(true);
    const ok = await run('save', async () => {
      try {
        await apiPatch(`/clans/${tag}`, body);
      } catch (err) {
        setFieldErrors(errorText.fields(err));
        throw err;
      }
    });
    if (ok) setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {saved && <Alert tone="success">{t('saved')}</Alert>}
      {error && Object.keys(fieldErrors).length === 0 && <Alert tone="error">{error}</Alert>}
      <ImageUpload
        kind="clan_logo"
        shape="crest"
        label={tApply('logo')}
        initialUrl={initial.logoUrl}
        onUploaded={setLogoMediaId}
        error={fieldErrors.logoMediaId}
      />
      <TextArea
        id="description"
        label={tApply('description')}
        hint={tApply('descriptionHint')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={CLAN_DESCRIPTION_MAX}
        aside={`${description.length} / ${CLAN_DESCRIPTION_MAX}`}
        error={fieldErrors.description}
      />
      <Field
        id="contactUrl"
        type="url"
        label={tApply('contactUrl')}
        hint={tApply('contactHint')}
        value={contactUrl}
        onChange={(e) => setContactUrl(e.target.value)}
        dir="ltr"
        maxLength={300}
        error={fieldErrors.contactUrl}
      />
      <Button type="submit" loading={pending === 'save'} className="self-start">
        {t('save')}
      </Button>
    </form>
  );
}
