/** Environment for integration tests. Override DATABASE_URL / REDIS_URL in CI if needed. */
export const TEST_ENV = {
  NODE_ENV: 'test',
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://efp:efp@localhost:5432/efp_test',
  REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/15',
  WEB_ORIGIN: 'http://localhost:3000',
  APP_PUBLIC_URL: 'http://localhost:3000',
  TRUST_PROXY_HOPS: '1',
  COOKIE_SECURE: 'false',
  MAIL_TRANSPORT: 'log',
  HIBP_ENABLED: 'false',
} as const;

export function applyTestEnv(): void {
  Object.assign(process.env, TEST_ENV);
}
