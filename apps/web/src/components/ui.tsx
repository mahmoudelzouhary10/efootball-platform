import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

/** Base components. Every screen composes these so the look stays consistent. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 font-semibold',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-ink-muted',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-transparent text-danger border border-danger/50 hover:bg-danger/10',
};

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_STYLES[variant]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent"
        />
      )}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  id,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  id: string;
}) {
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-11 rounded-xl border bg-bg px-3.5 text-base text-ink placeholder:text-ink-muted/60 outline-none transition focus:border-accent ${
          error ? 'border-danger' : 'border-line'
        }`}
      />
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

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const ALERT_STYLES: Record<AlertTone, string> = {
  error: 'border-danger/40 bg-danger/10 text-danger',
  success: 'border-success/40 bg-success/10 text-success',
  info: 'border-line bg-surface-2 text-ink',
  warning: 'border-warning/40 bg-warning/10 text-warning',
};

export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${ALERT_STYLES[tone]}`}
    >
      {children}
    </div>
  );
}

/** Centered single-column page for auth flows. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:py-16">
      <Card>
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </Card>
    </div>
  );
}
