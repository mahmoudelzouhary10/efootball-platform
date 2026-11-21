import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { E2E } from './env';

// ioredis is an API dependency; resolve it from there.
const apiRequire = createRequire(path.resolve(__dirname, '../../api/package.json'));
const Redis = apiRequire('ioredis') as new (url: string) => {
  flushdb(): Promise<unknown>;
  quit(): Promise<unknown>;
};

/**
 * Every browser request reaches the API from the same address, so the real per-IP limits
 * (e.g. 10 sign-ups an hour) would trip across tests. Reset counters between tests; the
 * limits themselves are covered by the API integration tests.
 */
test.beforeEach(async () => {
  const redis = new Redis(E2E.redisUrl);
  await redis.flushdb();
  await redis.quit();
});

/** Reads the newest link (verify-email / reset-password) emailed to an address. */
function linkFromMail(to: string, path: string): string {
  const lines = readFileSync(E2E.mailFile, 'utf8').trim().split('\n');
  for (const line of lines.reverse()) {
    const msg = JSON.parse(line) as { to: string; text: string };
    if (msg.to.toLowerCase() !== to.toLowerCase()) continue;
    const match = new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_-]+`).exec(msg.text);
    if (match) return match[0];
  }
  throw new Error(`No ${path} link emailed to ${to}`);
}

function uniqueUser(prefix: string) {
  const id = `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(0, 20);
  return { username: id, email: `${id}@example.com`, password: 'quiet river under stars' };
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function register(page: Page, user: ReturnType<typeof uniqueUser>) {
  await page.goto('/register');
  await page.getByLabel('البريد الإلكتروني').fill(user.email);
  await page.getByLabel('اسم المستخدم').fill(user.username);
  await page.getByLabel('كلمة المرور').fill(user.password);
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test('Arabic is the default, right-to-left, and fits a phone screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ساحتك التنافسية تبدأ هنا');
  await expectNoHorizontalScroll(page);

  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('register, verify email, log out, log back in with the username', async ({ page }) => {
  const user = uniqueUser('reg');
  await register(page, user);

  await expect(page.getByText(user.username).first()).toBeVisible();
  await expect(page.getByText('غير مؤكَّد')).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.goto(linkFromMail(user.email, '/verify-email').replace(E2E.webUrl, ''));
  await expect(page.getByText('تم تأكيد بريدك الإلكتروني.')).toBeVisible();
  await page.getByRole('link', { name: 'متابعة' }).click();
  await expect(page.getByText('مؤكَّد', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('البريد الإلكتروني أو اسم المستخدم').fill(user.username.toUpperCase());
  await page.getByLabel('كلمة المرور').fill(user.password);
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test('shows field errors from the server next to the right input', async ({ page }) => {
  const user = uniqueUser('dup');
  await register(page, user);
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();

  await page.goto('/register');
  await page.getByLabel('البريد الإلكتروني').fill(`other_${user.email}`);
  await page.getByLabel('اسم المستخدم').fill(user.username);
  await page.getByLabel('كلمة المرور').fill('password123');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page.getByText('كلمة المرور هذه شائعة جدًا.')).toBeVisible();

  await page.getByLabel('كلمة المرور').fill(user.password);
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page.getByText('اسم المستخدم مستخدَم بالفعل.')).toBeVisible();
});

test('wrong password shows a generic error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني أو اسم المستخدم').fill('nobody_at_all');
  await page.getByLabel('كلمة المرور').fill('not the password');
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page.getByText('بيانات الدخول غير صحيحة.')).toBeVisible();
});

test('forgot password → reset link → new password works, old one does not', async ({ page }) => {
  const user = uniqueUser('rst');
  await register(page, user);
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();

  await page.goto('/forgot-password');
  await page.getByLabel('البريد الإلكتروني').fill(user.email);
  await page.getByRole('button', { name: 'أرسل الرابط' }).click();
  await expect(page.getByText(/إذا كان هذا البريد مسجّلًا/)).toBeVisible();

  await page.goto(linkFromMail(user.email, '/reset-password').replace(E2E.webUrl, ''));
  const newPassword = 'bright lantern over hills';
  await page.getByLabel('كلمة المرور الجديدة').fill(newPassword);
  await page.getByRole('button', { name: 'حفظ كلمة المرور' }).click();
  await expect(page.getByText(/تم تغيير كلمة المرور/)).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني أو اسم المستخدم').fill(user.email);
  await page.getByLabel('كلمة المرور').fill(user.password);
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page.getByText('بيانات الدخول غير صحيحة.')).toBeVisible();

  await page.getByLabel('كلمة المرور').fill(newPassword);
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test('session cookie is not readable from JavaScript', async ({ page, context }) => {
  await register(page, uniqueUser('ck'));
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === 'efp_session');
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie)).not.toContain('efp_session');
});
