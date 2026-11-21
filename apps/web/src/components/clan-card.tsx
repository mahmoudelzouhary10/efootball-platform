import type { ClanCardResponse } from '@efp/contracts';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ClanTag, Crest } from './identity';

/** Discovery card: crest leads, name and tag read as one unit, member count as the key stat. */
export function ClanCard({ clan }: { clan: ClanCardResponse }) {
  const t = useTranslations('clans');
  return (
    <Link
      href={`/clans/${clan.tag}`}
      className="group flex h-full gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition hover:border-accent/50 hover:bg-surface-2 sm:p-5"
    >
      <Crest logoUrl={clan.logoUrl} tag={clan.tag} name={clan.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="truncate text-lg font-semibold group-hover:text-accent">{clan.name}</h2>
          <ClanTag tag={clan.tag} className="shrink-0 text-xs" />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{clan.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
          <Users className="size-3.5" aria-hidden />
          {t('members', { count: clan.memberCount })}
        </p>
      </div>
    </Link>
  );
}
