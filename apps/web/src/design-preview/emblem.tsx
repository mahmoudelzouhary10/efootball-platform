import type { Emblem as EmblemKind } from './data';

/**
 * DESIGN PREVIEW ONLY. Generated clan emblems (stand-ins for uploaded logos) so every sample
 * clan has a distinct, believable mark. The container shape is chosen by each concept.
 */
const GLYPHS: Record<EmblemKind, string> = {
  crown: 'M20 64 L28 34 L42 50 L50 26 L58 50 L72 34 L80 64 Z M22 70 H78 V78 H22 Z',
  wing: 'M14 62 C30 30 58 22 86 30 C70 36 60 44 54 56 C66 50 76 50 84 54 C64 60 46 70 34 78 C34 70 28 64 14 62 Z',
  star: 'M50 18 L59 40 L83 41 L64 56 L71 80 L50 66 L29 80 L36 56 L17 41 L41 40 Z',
  bolt: 'M57 14 L30 54 H48 L42 86 L72 42 H53 Z',
  ring: 'M50 22 A28 28 0 1 1 49.9 22 Z M50 36 A14 14 0 1 0 50.1 36 Z',
  anchor: 'M47 18 H53 V30 H64 V36 H53 V72 C62 71 70 65 74 56 L66 54 L80 44 L84 62 L78 60 C72 74 62 82 50 82 C38 82 28 74 22 60 L16 62 L20 44 L34 54 L26 56 C30 65 38 71 47 72 V36 H36 V30 H47 Z',
  sword: 'M47 14 H53 L54 62 H64 V68 H54 V78 L58 84 H42 L46 78 V68 H36 V62 H46 Z',
  cedar: 'M50 14 L64 34 H56 L72 52 H60 L78 70 H54 V84 H46 V70 H22 L40 52 H28 L44 34 H36 Z',
};

export type EmblemShape = 'shield' | 'circle' | 'hex' | 'square' | 'bare';

const SHAPES: Record<Exclude<EmblemShape, 'bare'>, string> = {
  shield: 'M50 3 L94 14 V52 C94 74 76 90 50 98 C24 90 6 74 6 52 V14 Z',
  circle: 'M50 3 A47 47 0 1 1 49.9 3 Z',
  hex: 'M50 3 L92 27 V73 L50 97 L8 73 V27 Z',
  square: 'M10 3 H90 A7 7 0 0 1 97 10 V90 A7 7 0 0 1 90 97 H10 A7 7 0 0 1 3 90 V10 A7 7 0 0 1 10 3 Z',
};

export function Emblem({
  kind,
  colors,
  shape = 'shield',
  className,
  title,
}: {
  kind: EmblemKind;
  colors: [string, string];
  shape?: EmblemShape;
  className?: string;
  title?: string;
}) {
  const id = `g-${kind}-${colors[0].slice(1)}-${shape}`;
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={shade(colors[0], -0.35)} />
        </linearGradient>
      </defs>
      {shape !== 'bare' && (
        <>
          <path d={SHAPES[shape]} fill={`url(#${id})`} />
          <path d={SHAPES[shape]} fill="none" stroke={colors[1]} strokeWidth="3" opacity="0.9" />
        </>
      )}
      <g transform={shape === 'bare' ? undefined : 'translate(14 12) scale(0.72)'}>
        <path d={GLYPHS[kind]} fill={shape === 'bare' ? colors[0] : colors[1]} fillRule="evenodd" />
      </g>
    </svg>
  );
}

/** Lighten (amount > 0) or darken (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Player avatar stand-in: initials on a tint derived from the username. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${[...parts[0]!][0]}${[...parts[1]!][0]}` : [...name].slice(0, 2).join('');
}

export function hueOf(s: string): number {
  return [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 11);
}
