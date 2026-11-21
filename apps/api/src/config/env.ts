import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  APP_PUBLIC_URL: z.string().url(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  COOKIE_SECURE: bool.default(false),
  MAIL_TRANSPORT: z.enum(['smtp', 'log']).default('log'),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('eFootball Platform <no-reply@localhost>'),
  HIBP_ENABLED: bool.default(false),
});

export type AppConfig = z.infer<typeof envSchema> & {
  /** Every origin allowed to send state-changing requests. */
  allowedOrigins: string[];
};

export const APP_CONFIG = Symbol('APP_CONFIG');

/** Parses and validates environment variables. Fails fast at boot with a readable message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const cfg = parsed.data;
  if (cfg.NODE_ENV === 'production') {
    if (!cfg.COOKIE_SECURE) throw new Error('COOKIE_SECURE must be true in production');
    if (cfg.MAIL_TRANSPORT !== 'smtp') throw new Error('MAIL_TRANSPORT must be smtp in production');
  }
  if (cfg.MAIL_TRANSPORT === 'smtp' && !cfg.SMTP_URL) {
    throw new Error('SMTP_URL is required when MAIL_TRANSPORT=smtp');
  }
  return { ...cfg, allowedOrigins: [new URL(cfg.WEB_ORIGIN).origin] };
}
