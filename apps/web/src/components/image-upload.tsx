'use client';

import { ImagePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { apiUploadImage } from '@/lib/api';
import { useErrorText } from '@/lib/use-error-text';
import { cx, Spinner } from './ui';

/**
 * Uploads immediately on selection (the server validates and re-encodes), then reports the
 * media id to the form. The preview always shows the server's processed image, so what the
 * user sees is exactly what will be published.
 */
export function ImageUpload({
  kind,
  label,
  initialUrl,
  onUploaded,
  error,
  shape = 'circle',
}: {
  kind: 'avatar' | 'clan_logo';
  label: string;
  initialUrl: string | null;
  onUploaded: (mediaId: string) => void;
  error?: string;
  shape?: 'circle' | 'crest';
}) {
  const t = useTranslations('upload');
  const errorText = useErrorText();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const media = await apiUploadImage(kind, file);
      setPreview(media.url);
      onUploaded(media.id);
    } catch (err) {
      setUploadError(errorText.message(err));
    } finally {
      setBusy(false);
    }
  }

  const shown = uploadError ?? error;
  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <div
          className={cx(
            'relative grid size-20 shrink-0 place-items-center overflow-hidden border bg-surface-2 text-ink-faint',
            shape === 'circle'
              ? 'rounded-full border-line-strong'
              : 'crest-shape border-transparent',
            shown && 'ring-2 ring-danger',
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- our processed upload
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-7" aria-hidden />
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-bg/70">
              <Spinner className="size-5 text-accent" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            aria-describedby={`${id}-hint`}
            className="self-start rounded-[var(--radius-control)] border border-line bg-surface-2 px-3 py-2 text-sm hover:border-line-strong disabled:opacity-60"
          >
            {busy ? t('uploading') : preview ? t('change') : t('choose')}
          </button>
          <p id={`${id}-hint`} className="text-xs text-ink-muted">
            {t('hint')}
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-labelledby={`${id}-label`}
          onChange={onChange}
          tabIndex={-1}
        />
      </div>
      {shown && (
        <p role="alert" className="text-xs text-danger">
          {shown}
        </p>
      )}
    </div>
  );
}
