import { defineConfig, devices } from '@playwright/test';
import { E2E } from './e2e/env';

/**
 * End-to-end tests: the real built API and the real built web app, a real browser,
 * Postgres (efp_e2e) and Redis (db 14). Build both apps first (`pnpm build`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: E2E.webUrl,
    trace: 'retain-on-failure',
    // Uses the system Chrome locally; CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...(process.env.CI ? {} : { channel: 'chrome' }) },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: 'chrome' }) },
    },
  ],
  webServer: [
    {
      command: 'node ../api/dist/main.js',
      url: `${E2E.apiUrl}/api/v1/health`,
      env: E2E.apiEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `pnpm exec next start -p ${E2E.webPort}`,
      // A static file: servers start before globalSetup migrates the database, so a data page
      // would 500 on a fresh CI database.
      url: `${E2E.webUrl}/icon.svg`,
      env: { API_INTERNAL_URL: E2E.apiUrl, NEXT_TELEMETRY_DISABLED: '1' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
