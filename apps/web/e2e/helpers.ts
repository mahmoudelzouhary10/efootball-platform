import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, request, type APIRequestContext, type Page } from '@playwright/test';
import { E2E } from './env';

// API-side dependencies (sharp, ioredis) are resolved from the API package.
const apiDir = path.resolve(__dirname, '../../api');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const sharp = apiRequire('sharp') as (opts: object) => { png(): { toBuffer(): Promise<Buffer> } };
const Redis = apiRequire('ioredis') as new (url: string) => {
  flushdb(): Promise<unknown>;
  quit(): Promise<unknown>;
};

export const PASSWORD = 'quiet river under stars';

export async function resetRateLimits(): Promise<void> {
  const redis = new Redis(E2E.redisUrl);
  await redis.flushdb();
  await redis.quit();
}

/** Newest emailed link (verify-email / reset-password) for an address, as a path. */
export function linkFromMail(to: string, linkPath: string): string {
  const lines = readFileSync(E2E.mailFile, 'utf8').trim().split('\n');
  for (const line of lines.reverse()) {
    const msg = JSON.parse(line) as { to: string; text: string };
    if (msg.to.toLowerCase() !== to.toLowerCase()) continue;
    const match = new RegExp(`https?://[^\\s]+${linkPath}\\?token=[A-Za-z0-9_-]+`).exec(msg.text);
    if (match) return match[0].replace(E2E.webUrl, '');
  }
  throw new Error(`No ${linkPath} link emailed to ${to}`);
}

let seq = 0;
export function uniqueName(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36).slice(-5)}${seq}`.slice(0, 20);
}

export function uniqueTag(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function pngFile(
  color = { r: 200, g: 150, b: 40 },
): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const buffer = await sharp({
    create: { width: 300, height: 300, channels: 3, background: color },
  })
    .png()
    .toBuffer();
  return { name: 'image.png', mimeType: 'image/png', buffer };
}

/** Grants a platform role through the real bootstrap CLI. */
export function grantRole(username: string, role: 'admin' | 'moderator'): void {
  execFileSync(process.execPath, ['dist/cli/grant-role.js', username, role], {
    cwd: apiDir,
    env: { ...process.env, ...E2E.apiEnv, MAIL_TRANSPORT: 'log' },
  });
}

/**
 * A second actor driven through the HTTP API (same origin as the browser), used to set up
 * the other side of a workflow while the browser plays the user under test.
 */
export interface ApiActor {
  username: string;
  api: APIRequestContext;
}

export async function apiActor(
  username: string,
  profile?: { displayName: string; countryCode: string },
): Promise<ApiActor> {
  const api = await request.newContext({
    baseURL: E2E.webUrl,
    extraHTTPHeaders: { Origin: E2E.webUrl },
  });
  const email = `${username}@example.com`;
  const reg = await api.post('/api/v1/auth/register', {
    data: { email, username, password: PASSWORD },
  });
  expect(reg.status(), await reg.text()).toBe(201);
  const token = linkFromMail(email, '/verify-email').split('token=')[1];
  expect((await api.post('/api/v1/auth/verify-email', { data: { token } })).status()).toBe(204);
  if (profile) {
    const res = await api.post('/api/v1/me/player-profile', {
      data: { gameId: `E2E-${username.toUpperCase().replace(/_/g, '')}`.slice(0, 24), ...profile },
    });
    expect(res.status(), await res.text()).toBe(201);
  }
  return { username, api };
}

/** Registers and verifies the browser user, landing on the dashboard. */
export async function browserUser(page: Page, username: string): Promise<void> {
  const email = `${username}@example.com`;
  await page.goto('/register');
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('اسم المستخدم').fill(username);
  await page.getByLabel('كلمة المرور').fill(PASSWORD);
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto(linkFromMail(email, '/verify-email'));
  await expect(page.getByText('تم تأكيد بريدك الإلكتروني.')).toBeVisible();
}

/** Creates the browser user's player profile through the real form. */
export async function createProfileInBrowser(
  page: Page,
  displayName: string,
  gameId: string,
): Promise<void> {
  await page.goto('/me/profile');
  await page.getByLabel('الاسم الظاهر').fill(displayName);
  await page.getByLabel('معرّف اللعبة (User ID)').fill(gameId);
  await page.getByLabel('الدولة').selectOption('EG');
  await page.getByRole('button', { name: 'إنشاء الملف' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
