'use client';

import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  type PlayerProfileResponse,
} from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { CountrySelect, type CountryOptions } from '@/components/country-select';
import { ImageUpload } from '@/components/image-upload';
import { Alert, Button, Field, TextArea } from '@/components/ui';
import { useRouter } from '@/i18n/routing';
import { apiPatch, apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function ProfileForm({
  profile,
  countries,
}: {
  profile: PlayerProfileResponse | null;
  countries: CountryOptions;
}) {
  const t = useTranslations('profileForm');
  const tPlayer = useTranslations('player');
  const errorText = useErrorText();
  const router = useRouter();
  const [avatarMediaId, setAvatarMediaId] = useState<string | undefined>();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      gameId: String(form.get('gameId') ?? ''),
      displayName: String(form.get('displayName') ?? ''),
      countryCode: String(form.get('countryCode') ?? ''),
      bio,
    };
    if (avatarMediaId) body.avatarMediaId = avatarMediaId;

    setPending(true);
    setError(null);
    setSaved(false);
    setFieldErrors({});
    try {
      if (profile) {
        await apiPatch('/me/player-profile', body);
        setSaved(true);
        router.refresh();
      } else {
        await apiPost('/me/player-profile', body);
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      const fields = errorText.fields(err);
      const code = (err as { code?: string }).code;
      if (code === 'GAME_ID_TAKEN') fields.gameId = errorText.message(err);
      if (code === 'MEDIA_INVALID') fields.avatar = errorText.message(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(errorText.message(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      {saved && <Alert tone="success">{t('saved')}</Alert>}

      <ImageUpload
        kind="avatar"
        label={t('avatar')}
        initialUrl={profile?.avatarUrl ?? null}
        onUploaded={setAvatarMediaId}
        error={fieldErrors.avatar}
      />

      <Field
        id="displayName"
        name="displayName"
        label={t('displayName')}
        hint={t('displayNameHint')}
        defaultValue={profile?.displayName}
        required
        minLength={DISPLAY_NAME_MIN}
        maxLength={DISPLAY_NAME_MAX}
        autoComplete="nickname"
        error={fieldErrors.displayName}
      />

      <div className="flex flex-col gap-2">
        <Field
          id="gameId"
          name="gameId"
          label={t('gameId')}
          hint={profile?.gameIdVerified ? t('gameIdChangeWarning') : t('gameIdHint')}
          defaultValue={profile?.gameId}
          required
          maxLength={24}
          dir="ltr"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          error={fieldErrors.gameId}
        />
        <p className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2 text-xs text-ink-muted">
          {tPlayer('gameIdNotice')}
        </p>
      </div>

      <CountrySelect
        options={countries}
        defaultValue={profile?.countryCode}
        error={fieldErrors.countryCode}
      />

      <TextArea
        id="bio"
        name="bio"
        label={t('bio')}
        hint={t('bioHint')}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={BIO_MAX}
        rows={3}
        aside={`${bio.length} / ${BIO_MAX}`}
        error={fieldErrors.bio}
      />

      <Button type="submit" loading={pending} className="self-start">
        {profile ? t('save') : t('create')}
      </Button>
    </form>
  );
}
