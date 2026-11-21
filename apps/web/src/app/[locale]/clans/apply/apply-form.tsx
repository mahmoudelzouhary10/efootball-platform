'use client';

import {
  CLAN_DESCRIPTION_MAX,
  CLAN_NAME_MAX,
  CLAN_NAME_MIN,
  CLAN_TAG_MAX,
  CLAN_TAG_MIN,
} from '@efp/contracts';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { ClanTag, Crest } from '@/components/identity';
import { ImageUpload } from '@/components/image-upload';
import { Alert, Button, Card, Field, TextArea } from '@/components/ui';
import { useRouter } from '@/i18n/routing';
import { apiPost } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';

export function ApplyForm() {
  const t = useTranslations('apply');
  const tUpload = useTranslations('upload');
  const errorText = useErrorText();
  const router = useRouter();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState<{ id: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!logo) {
      setFieldErrors({ logoMediaId: tUpload('required') });
      return;
    }
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      await apiPost('/clan-applications', {
        name,
        tag,
        logoMediaId: logo.id,
        description,
        contactUrl: String(form.get('contactUrl') ?? ''),
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const fields = errorText.fields(err);
      const code = (err as { code?: string }).code;
      if (code === 'CLAN_NAME_TAKEN') fields.name = errorText.message(err);
      if (code === 'CLAN_TAG_TAKEN') fields.tag = errorText.message(err);
      if (code === 'MEDIA_INVALID') fields.logoMediaId = errorText.message(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(errorText.message(err));
      setPending(false);
    }
  }

  const previewTag = tag || 'TAG';
  const previewName = name || t('name');

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {error && <Alert tone="error">{error}</Alert>}

          <ImageUpload
            kind="clan_logo"
            shape="crest"
            label={t('logo')}
            initialUrl={null}
            onUploaded={(id) => {
              setLogo({ id });
              setLogoUrl(`/api/v1/media/${id}`);
            }}
            error={fieldErrors.logoMediaId}
          />

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <Field
              id="name"
              name="name"
              label={t('name')}
              hint={t('nameHint')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={CLAN_NAME_MIN}
              maxLength={CLAN_NAME_MAX}
              error={fieldErrors.name}
            />
            <Field
              id="tag"
              name="tag"
              label={t('tag')}
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              required
              minLength={CLAN_TAG_MIN}
              maxLength={CLAN_TAG_MAX}
              dir="ltr"
              autoCapitalize="characters"
              spellCheck={false}
              className="kit-tag"
              error={fieldErrors.tag}
            />
          </div>
          <p className="-mt-3 text-xs text-ink-muted">{t('tagHint')}</p>

          <TextArea
            id="description"
            name="description"
            label={t('description')}
            hint={t('descriptionHint')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={CLAN_DESCRIPTION_MAX}
            aside={`${description.length} / ${CLAN_DESCRIPTION_MAX}`}
            error={fieldErrors.description}
          />

          <Field
            id="contactUrl"
            name="contactUrl"
            type="url"
            inputMode="url"
            label={t('contactUrl')}
            hint={t('contactHint')}
            placeholder="https://discord.gg/…"
            dir="ltr"
            required
            maxLength={300}
            error={fieldErrors.contactUrl}
          />

          <Button type="submit" loading={pending} size="lg" className="self-start">
            {t('submit')}
          </Button>
        </form>
      </Card>

      {/* Live preview: how the clan will appear once approved. */}
      <aside aria-label={t('preview')} className="lg:sticky lg:top-24">
        <p className="mb-3 text-sm text-ink-muted">{t('preview')}</p>
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] border border-line bg-gradient-to-b from-surface-2 to-surface p-8 text-center">
          <Crest logoUrl={logoUrl} tag={previewTag} name={previewName} size="xl" />
          <div className="min-w-0 max-w-full">
            <p className="truncate font-display text-2xl font-bold">{previewName}</p>
            <ClanTag tag={previewTag} className="text-sm" />
          </div>
          {description && <p className="line-clamp-3 text-sm text-ink-muted">{description}</p>}
        </div>
      </aside>
    </div>
  );
}
