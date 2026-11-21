import type { ClanRole } from '@efp/contracts';
import { Crown, ShieldCheck, ShieldQuestion, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Chip, cx } from './ui';

/**
 * Identity components: the visual vocabulary for players and clans.
 * The clan crest is the platform's signature element.
 */

type CrestSize = 'sm' | 'md' | 'lg' | 'xl';

const CREST_SIZES: Record<CrestSize, { box: string; tag: string }> = {
  sm: { box: 'size-10', tag: 'text-[0.6rem]' },
  md: { box: 'size-14', tag: 'text-xs' },
  lg: { box: 'size-24', tag: 'text-base' },
  xl: { box: 'size-32 sm:size-40', tag: 'text-xl' },
};

/**
 * Shield-cut frame holding the clan logo. With no logo, the tag is set in kit lettering
 * on a gradient derived from the tag, so every clan still has a distinct mark.
 */
export function Crest({
  logoUrl,
  tag,
  name,
  size = 'md',
  className,
  priority = false,
}: {
  logoUrl: string | null;
  tag: string;
  name: string;
  size?: CrestSize;
  className?: string;
  /** Above-the-fold hero crest: load eagerly with high priority (it is the page's LCP). */
  priority?: boolean;
}) {
  const s = CREST_SIZES[size];
  const hue = [...tag].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div className={cx('relative shrink-0', s.box, className)}>
      {/* Gold rim */}
      <div className="crest-shape absolute inset-0 bg-gradient-to-b from-accent/80 to-accent/20" />
      <div className="crest-shape absolute inset-[2px] overflow-hidden bg-surface-2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our API, already sized
          <img
            src={logoUrl}
            alt={name}
            className="size-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
          />
        ) : (
          <div
            role="img"
            aria-label={name}
            className="grid size-full place-items-center"
            style={{
              background: `linear-gradient(160deg, hsl(${hue} 45% 32%), hsl(${(hue + 40) % 360} 50% 16%))`,
            }}
          >
            <span className={cx('kit-tag text-ink', s.tag)}>{tag}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Clan tag in kit lettering, e.g. [EFSC]. Always LTR, even inside Arabic text. */
export function ClanTag({ tag, className }: { tag: string; className?: string }) {
  return <span className={cx('kit-tag text-accent', className)}>[{tag}]</span>;
}

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
const AVATAR_SIZES: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-lg',
  xl: 'size-24 text-2xl sm:size-28',
};

export function Avatar({
  url,
  name,
  size = 'md',
  className,
}: {
  url: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}) {
  const initials = [...name.trim()].slice(0, 2).join('');
  return (
    <div
      className={cx(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong bg-surface-3 font-display font-semibold text-ink-muted',
        AVATAR_SIZES[size],
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by our API, already sized
        <img
          src={url}
          alt={name}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
}

export function RoleBadge({ role }: { role: ClanRole }) {
  const t = useTranslations('roles');
  if (role === 'leader')
    return (
      <Chip tone="gold" icon={<Crown className="size-3.5" aria-hidden />}>
        {t('leader')}
      </Chip>
    );
  if (role === 'co_leader')
    return (
      <Chip tone="blue" icon={<Star className="size-3.5" aria-hidden />}>
        {t('co_leader')}
      </Chip>
    );
  return <Chip>{t('member')}</Chip>;
}

/**
 * Game ID ownership status. Profiles are never shown as verified unless an admin has
 * verified them; there is no official Konami verification API.
 */
export function GameIdStatus({ verified }: { verified: boolean }) {
  const t = useTranslations('player');
  return verified ? (
    <Chip tone="green" icon={<ShieldCheck className="size-3.5" aria-hidden />}>
      {t('gameIdVerified')}
    </Chip>
  ) : (
    <Chip icon={<ShieldQuestion className="size-3.5" aria-hidden />}>{t('gameIdUnverified')}</Chip>
  );
}

export function flagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function Country({
  code,
  locale,
  className,
}: {
  code: string;
  locale: string;
  className?: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1.5', className)}>
      <span aria-hidden>{flagEmoji(code)}</span>
      <span>{countryName(code, locale)}</span>
    </span>
  );
}
