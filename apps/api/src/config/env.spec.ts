import { describe, expect, it } from 'vitest';
import { loadConfig } from './env';

const base = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379/0',
  WEB_ORIGIN: 'https://play.example.com/',
  APP_PUBLIC_URL: 'https://play.example.com',
};

describe('loadConfig', () => {
  it('derives the allowed origin from WEB_ORIGIN', () => {
    expect(loadConfig({ ...base }).allowedOrigins).toEqual(['https://play.example.com']);
  });

  it('fails fast on a missing variable', () => {
    expect(() => loadConfig({ ...base, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it.each([
    ['insecure cookies', { COOKIE_SECURE: 'false', MAIL_TRANSPORT: 'smtp', SMTP_URL: 'smtp://x' }],
    ['the log mailer', { COOKIE_SECURE: 'true', MAIL_TRANSPORT: 'log' }],
    ['the file mailer', { COOKIE_SECURE: 'true', MAIL_TRANSPORT: 'file', MAIL_FILE: '/tmp/m' }],
  ])('refuses %s in production', (_label, extra) => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production', ...extra })).toThrow();
  });

  it('accepts a correct production configuration', () => {
    expect(() =>
      loadConfig({
        ...base,
        NODE_ENV: 'production',
        COOKIE_SECURE: 'true',
        MAIL_TRANSPORT: 'smtp',
        SMTP_URL: 'smtp://mail.example.com:587',
      }),
    ).not.toThrow();
  });
});
