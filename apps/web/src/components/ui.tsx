import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/**
 * Base components. Every screen composes these, so spacing, radius, colour and states stay
 * consistent. Variants encode meaning: gold = the primary action on a screen (one per view),
 * danger = destructive, secondary/ghost = everything else.
 */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

// ── buttons ─────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink font-semibold hover:bg-accent-strong active:translate-y-px shadow-[0_6px_20px_-8px_rgb(227_184_92/0.6)]',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-surface-3',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-2',
  danger: 'text-danger border border-danger/40 hover:bg-danger/10',
  success: 'bg-success/15 text-success border border-success/40 hover:bg-success/25 font-semibold',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const buttonClass = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
) =>
  cx(
    'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] transition duration-150 disabled:cursor-not-allowed disabled:opacity-55',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra,
  );

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'animate-spin rounded-full border-2 border-current border-e-transparent',
        className,
      )}
    />
  );
}

// ── form controls ───────────────────────────────────────────────────────────

const CONTROL =
  'w-full rounded-[var(--radius-control)] border bg-bg/70 px-3.5 text-base text-ink placeholder:text-ink-faint outline-none transition focus:border-accent focus:bg-bg';

interface FieldChrome {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Text shown at the end of the label row, e.g. a character counter. */
  aside?: ReactNode;
}

function FieldFrame({
  id,
  label,
  hint,
  error,
  aside,
  children,
}: FieldChrome & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {aside && <span className="text-xs text-ink-faint">{aside}</span>}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return (
    [hint && !error && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  );
}

export function Field({
  label,
  hint,
  error,
  aside,
  id,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & FieldChrome) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} aside={aside}>
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(CONTROL, 'h-11', error ? 'border-danger' : 'border-line')}
      />
    </FieldFrame>
  );
}

export function TextArea({
  label,
  hint,
  error,
  aside,
  id,
  ...input
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} aside={aside}>
      <textarea
        id={id}
        rows={4}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(
          CONTROL,
          'resize-y py-2.5 leading-relaxed',
          error ? 'border-danger' : 'border-line',
        )}
      />
    </FieldFrame>
  );
}

export function Select({
  label,
  hint,
  error,
  aside,
  id,
  children,
  ...select
}: SelectHTMLAttributes<HTMLSelectElement> & FieldChrome) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} aside={aside}>
      <select
        id={id}
        {...select}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(CONTROL, 'h-11', error ? 'border-danger' : 'border-line')}
      >
        {children}
      </select>
    </FieldFrame>
  );
}

// ── surfaces ────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
}) {
  return (
    <Tag
      className={cx(
        'rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-raise)] sm:p-6',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Section heading inside a page: title + optional supporting line + optional action. */
export function SectionHeader({
  title,
  description,
  action,
  as: Tag = 'h2',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Tag className={Tag === 'h1' ? 'text-3xl font-bold sm:text-4xl' : 'text-lg font-semibold'}>
          {title}
        </Tag>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageContainer({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={cx(
        'mx-auto w-full px-4 pb-28 pt-8 sm:pt-12 md:pb-16',
        narrow ? 'max-w-2xl' : 'max-w-6xl',
      )}
    >
      {children}
    </div>
  );
}

// ── feedback ────────────────────────────────────────────────────────────────

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const ALERT_STYLES: Record<AlertTone, string> = {
  error: 'border-danger/40 bg-danger/10 text-[#ffb3b5]',
  success: 'border-success/40 bg-success/10 text-[#9be8c6]',
  info: 'border-line bg-surface-2 text-ink',
  warning: 'border-warning/40 bg-warning/10 text-[#ffd29e]',
};

export function Alert({
  tone,
  children,
  action,
}: {
  tone: AlertTone;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex flex-col gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        ALERT_STYLES[tone],
      )}
    >
      <div>{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** An empty screen is an invitation to act: icon, one sentence, one action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-surface-2 text-ink-muted">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className: string }) {
  return <div aria-hidden className={cx('animate-pulse rounded-md bg-surface-2', className)} />;
}

// ── chips ───────────────────────────────────────────────────────────────────

type ChipTone = 'neutral' | 'gold' | 'green' | 'red' | 'amber' | 'blue';

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: 'bg-surface-3 text-ink-muted',
  gold: 'bg-accent/15 text-accent',
  green: 'bg-success/15 text-success',
  red: 'bg-danger/15 text-[#ff8f92]',
  amber: 'bg-warning/15 text-warning',
  blue: 'bg-info/15 text-info',
};

export function Chip({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: ChipTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        CHIP_TONES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Centered single-column page for auth flows. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-28 pt-10 sm:pt-16">
      <Card>
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </Card>
    </div>
  );
}
