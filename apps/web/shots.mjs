import { chromium, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
const cookies = Object.fromEntries(
  readFileSync('/tmp/seed/cookies.env', 'utf8')
    .trim()
    .split('\n')
    .map((l) => l.split('=')),
);
const base = 'http://localhost:3100';
const b = await chromium.launch({ channel: 'chrome' });
const errors = [];
async function shot(name, path, { who, mobile, full = true } = {}) {
  const ctx = await b.newContext(
    mobile ? { ...devices['Pixel 7'] } : { viewport: { width: 1366, height: 900 } },
  );
  if (who)
    await ctx.addCookies([
      { name: 'efp_session', value: cookies[who], domain: 'localhost', path: '/' },
    ]);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${name}: ${e.message.slice(0, 150)}`));
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${name}: ${m.text().slice(0, 150)}`);
  });
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `/tmp/shots/${name}.png`, fullPage: full });
  await ctx.close();
}
const list = process.argv.slice(2);
const all = {
  'home-d': ['/', {}],
  'home-m': ['/', { mobile: true }],
  'home-en-d': ['/en', {}],
  'clans-d': ['/clans', {}],
  'clans-m': ['/clans', { mobile: true }],
  'clan-d': ['/clans/NILE', { who: 'DEMO_COOKIE' }],
  'clan-m': ['/clans/NILE', { mobile: true }],
  'dash-d': ['/dashboard', { who: 'DEMO_COOKIE' }],
  'dash-m': ['/dashboard', { who: 'DEMO_COOKIE', mobile: true }],
  'profile-m': ['/me/profile', { who: 'DEMO_COOKIE', mobile: true }],
  'player-d': ['/players/mo_salah10', {}],
  'manage-d': ['/clans/NILE/manage', { who: 'NILE_COOKIE' }],
  'manage-req-m': ['/clans/NILE/manage?tab=requests', { who: 'NILE_COOKIE', mobile: true }],
  'apply-d': ['/clans/apply', { who: 'DEMO_COOKIE' }],
  'admin-d': ['/admin', { who: 'ADMIN_COOKIE' }],
  'queue-d': ['/admin/clan-applications', { who: 'ADMIN_COOKIE' }],
  'queue-m': ['/admin/clan-applications', { who: 'ADMIN_COOKIE', mobile: true }],
  'clan-en-d': ['/en/clans/CEG', {}],
};
for (const [name, [path, opts]] of Object.entries(all))
  if (!list.length || list.includes(name)) await shot(name, path, opts);
// review page: first pending
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
await ctx.addCookies([
  { name: 'efp_session', value: cookies.ADMIN_COOKIE, domain: 'localhost', path: '/' },
]);
const p = await ctx.newPage();
await p.goto(base + '/admin/clan-applications', { waitUntil: 'networkidle' });
const href = await p
  .locator('main a[href*="/admin/clan-applications/"]')
  .first()
  .getAttribute('href');
if (!list.length || list.includes('review-d')) {
  await p.goto(base + href, { waitUntil: 'networkidle' });
  await p.screenshot({ path: '/tmp/shots/review-d.png', fullPage: true });
}
await b.close();
console.log(errors.join('\n') || 'no console errors');
