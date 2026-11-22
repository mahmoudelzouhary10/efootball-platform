'use client';
import { type ReactNode, useEffect, useRef, useState } from 'react';

type Round = { key: string; label: string };

/**
 * Mobile bracket: one round per screen.
 * Two independent states, never the same visual:
 *   selected → filled ink chip, aria-pressed (what the user is looking at; follows taps and swipes)
 *   live     → red "LIVE" tag inside the chip (where play is happening now)
 * Opens on the live round; any later choice by the user is kept.
 */
export function RoundNav({
  rounds,
  liveKey,
  liveLabel,
  navLabel,
  initialKey,
  children,
}: {
  rounds: Round[];
  liveKey: string | null;
  liveLabel: string;
  navLabel: string;
  initialKey?: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState(initialKey ?? liveKey ?? rounds[0]!.key);
  const track = useRef<HTMLDivElement>(null);
  const lock = useRef(false);

  const go = (key: string, smooth = true) => {
    const el = track.current?.querySelector<HTMLElement>(`[data-round="${key}"]`);
    if (!el || !track.current) return;
    lock.current = true;
    setSelected(key);
    // Scroll the track only (never the page), in either reading direction.
    const t = track.current;
    const rtl = getComputedStyle(t).direction === 'rtl';
    const left = rtl
      ? el.offsetLeft + el.offsetWidth - t.clientWidth
      : el.offsetLeft - parseFloat(getComputedStyle(t).paddingInlineStart || '0');
    t.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    window.setTimeout(() => (lock.current = false), 450);
  };

  useEffect(() => {
    go(selected, false);
    const t = track.current;
    if (!t) return;
    // Swiping updates the selection too.
    const io = new IntersectionObserver(
      (entries) => {
        if (lock.current) return;
        const best = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.6)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const k = best?.target.getAttribute('data-round');
        if (k) setSelected(k);
      },
      { root: t, threshold: [0.6, 0.9] },
    );
    t.querySelectorAll('[data-round]').forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        className="mn-scroll -mx-5 mb-5 flex gap-2 overflow-x-auto px-5"
        role="toolbar"
        aria-label={navLabel}
      >
        {rounds.map((r) => {
          const isSel = r.key === selected;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={isSel}
              onClick={() => go(r.key)}
              className={`flex shrink-0 items-center gap-2 border-2 border-[var(--mn-ink)] px-3 py-1.5 text-sm font-semibold ${isSel ? 'bg-[var(--mn-ink)] text-white' : 'bg-transparent text-[var(--mn-ink)]'}`}
            >
              {r.label}
              {r.key === liveKey && (
                <span className="inline-flex items-center gap-1 bg-[var(--mn-signal)] px-1.5 py-px text-[11px] font-bold text-white">
                  <span className="mn-pulse size-1.5 rounded-full bg-white" />
                  {liveLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        ref={track}
        className="mn-scroll -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2"
      >
        {children}
      </div>
    </div>
  );
}
