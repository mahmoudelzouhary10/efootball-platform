import { expect, test } from '@playwright/test';
import {
  apiActor,
  browserUser,
  createProfileInBrowser,
  expectNoHorizontalScroll,
  grantRole,
  pngFile,
  resetRateLimits,
  uniqueName,
  uniqueTag,
} from './helpers';

test.beforeEach(resetRateLimits);

test('player profile: create with avatar, public page shows the game ID as not verified', async ({
  page,
}) => {
  const username = uniqueName('prof');
  await browserUser(page, username);

  await page.goto('/me/profile');
  await page.locator('input[type=file]').setInputFiles(await pngFile());
  await expect(page.getByRole('button', { name: 'تغيير الصورة' })).toBeVisible();
  await page.getByLabel('الاسم الظاهر').fill('محمود الزهيري');
  await page.getByLabel('معرّف اللعبة (User ID)').fill(`GID-${username}`.slice(0, 24));
  await page.getByLabel('الدولة').selectOption('EG');
  await page.getByLabel('نبذة قصيرة').fill('وسط ميدان صانع ألعاب.');
  await page.getByRole('button', { name: 'إنشاء الملف' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('محمود الزهيري').first()).toBeVisible();

  await page.getByRole('link', { name: 'صفحتي العامة' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('محمود الزهيري');
  await expect(page.getByText('المعرّف غير موثّق')).toBeVisible();
  await expect(page.getByText(/لا توجد طريقة رسمية من Konami/)).toBeVisible();
  await expect(page.locator('main img').first()).toHaveAttribute('src', /\/api\/v1\/media\//);
  await expectNoHorizontalScroll(page);
});

test('found a clan: apply → admin approves in the review queue → founder leads the clan', async ({
  page,
  browser,
}) => {
  const founder = uniqueName('fnd');
  const tag = uniqueTag();
  await browserUser(page, founder);
  await createProfileInBrowser(page, 'Founder Player', `GID-${founder}`.slice(0, 24));

  // Apply through the form.
  await page.goto('/clans/apply');
  await page.locator('input[type=file]').setInputFiles(await pngFile({ r: 20, g: 90, b: 200 }));
  await expect(page.getByRole('button', { name: 'تغيير الصورة' })).toBeVisible();
  await page.getByLabel('اسم الكلان').fill(`نسور ${tag}`);
  await page.getByLabel('الرمز').fill(tag.toLowerCase());
  await expect(page.getByLabel('الرمز')).toHaveValue(tag);
  await page.getByLabel('وصف الكلان').fill('كلان تنافسي يبحث عن لاعبين ملتزمين بالبطولات.');
  await page.getByLabel('رابط التواصل').fill('https://discord.gg/e2e');
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('طلبك قيد المراجعة من الإدارة.')).toBeVisible();

  // The clan doesn't exist publicly yet.
  expect((await page.request.get(`/api/v1/clans/${tag}`)).status()).toBe(404);

  // Admin reviews in a separate browser session.
  const admin = await apiActor(uniqueName('adm'));
  grantRole(admin.username, 'admin');
  const adminCtx = await browser.newContext();
  await adminCtx.addCookies((await admin.api.storageState()).cookies);
  const adminPage = await adminCtx.newPage();
  await adminPage.goto('/admin');
  await adminPage.getByRole('link', { name: 'افتح طابور المراجعة' }).click();
  await adminPage.getByRole('link', { name: new RegExp(`نسور ${tag}`) }).click();
  await expect(adminPage.getByText('الاسم متاح')).toBeVisible();
  await expect(adminPage.getByText('https://discord.gg/e2e')).toBeVisible();
  await adminPage.getByRole('button', { name: 'الموافقة وإنشاء الكلان' }).first().click();
  await adminPage
    .getByRole('dialog')
    .getByRole('button', { name: 'الموافقة وإنشاء الكلان' })
    .click();
  await expect(adminPage.getByText('مقبول').first()).toBeVisible();
  await adminCtx.close();

  // Founder now leads the clan.
  await page.goto('/dashboard');
  await expect(page.getByText('القائد').first()).toBeVisible();
  await page.getByRole('link', { name: 'إدارة الكلان' }).click();
  await expect(page).toHaveURL(new RegExp(`/clans/${tag}/manage$`));
});

test('regular players cannot see the admin area', async ({ page }) => {
  await browserUser(page, uniqueName('noadm'));
  const res = await page.goto('/admin');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'الإدارة' })).toHaveCount(0);
});

test('membership: join request approved, invitation accepted, promote, transfer leadership, kick, leave', async ({
  page,
  browser,
}) => {
  // Leader is the browser user; the clan is created through the API with an admin.
  const leaderName = uniqueName('ldr');
  const tag = uniqueTag();
  await browserUser(page, leaderName);
  await createProfileInBrowser(page, 'Clan Leader', `GID-${leaderName}`.slice(0, 24));
  const logo = await page.request.post('/api/v1/media/images?kind=clan_logo', {
    headers: { Origin: new URL(page.url()).origin },
    multipart: { file: await pngFile() },
  });
  const app = await page.request.post('/api/v1/clan-applications', {
    headers: { Origin: new URL(page.url()).origin },
    data: {
      name: `Falcons ${tag}`,
      tag,
      logoMediaId: (await logo.json()).id,
      description: 'Competitive clan for e2e.',
      contactUrl: 'https://discord.gg/e2e',
    },
  });
  const admin = await apiActor(uniqueName('adm'));
  grantRole(admin.username, 'admin');
  expect(
    (
      await admin.api.post(`/api/v1/admin/clan-applications/${(await app.json()).id}/approve`)
    ).status(),
  ).toBe(200);

  // Player A asks to join; the leader approves from the requests tab.
  const a = await apiActor(uniqueName('pla'), { displayName: 'Player Alpha', countryCode: 'SA' });
  expect(
    (
      await a.api.post(`/api/v1/clans/${tag}/join-requests`, {
        data: { message: 'Midfielder, online nightly.' },
      })
    ).status(),
  ).toBe(204);
  await page.goto(`/clans/${tag}/manage?tab=requests`);
  await expect(page.getByText('Midfielder, online nightly.')).toBeVisible();
  await page.getByRole('button', { name: 'قبول' }).click();
  await expect(page.getByText('لا توجد طلبات انضمام حاليًا.')).toBeVisible();

  // Player B is invited by username and accepts from their dashboard (second browser session).
  const b = await apiActor(uniqueName('plb'), { displayName: 'Player Bravo', countryCode: 'MA' });
  await page.goto(`/clans/${tag}/manage`);
  await page.getByLabel('اسم المستخدم').fill(b.username);
  await page.getByRole('button', { name: 'إرسال دعوة' }).click();
  await expect(page.getByText(`أُرسلت الدعوة إلى ${b.username}.`)).toBeVisible();

  const bCtx = await browser.newContext();
  await bCtx.addCookies((await b.api.storageState()).cookies);
  const bPage = await bCtx.newPage();
  await bPage.goto('/dashboard');
  await bPage.getByRole('button', { name: 'قبول' }).click();
  await expect(bPage.getByText('عضو', { exact: true }).first()).toBeVisible();

  // Roster now has three; promote Alpha, then hand leadership to Alpha.
  await page.reload();
  await expect(page.getByText('3 من 50 عضوًا')).toBeVisible();
  await page.getByRole('button', { name: 'إجراءات العضو: Player Alpha' }).click();
  await page.getByRole('menuitem', { name: 'ترقية لنائب قائد' }).click();
  await expect(page.getByText('نائب القائد', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'إجراءات العضو: Player Alpha' }).click();
  await page.getByRole('menuitem', { name: 'نقل القيادة' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'نقل القيادة' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto(`/clans/${tag}`);
  const alphaRow = page.getByRole('link', { name: /Player Alpha/ });
  await expect(alphaRow.getByText('القائد', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Clan Leader/ }).getByText('نائب القائد', { exact: true }),
  ).toBeVisible();

  // The former leader (now co-leader) can still remove a member…
  await page.goto(`/clans/${tag}/manage`);
  await page.getByRole('button', { name: 'إجراءات العضو: Player Bravo' }).click();
  await page.getByRole('menuitem', { name: 'طرد من الكلان' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'طرد من الكلان' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('2 من 50 عضوًا')).toBeVisible();

  // …but can't act on the new leader, and can leave.
  await expect(page.getByRole('button', { name: 'إجراءات العضو: Player Alpha' })).toHaveCount(0);
  await page.goto(`/clans/${tag}`);
  await page.getByRole('button', { name: 'مغادرة الكلان' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'مغادرة الكلان' }).click();
  await expect(page.getByRole('button', { name: 'اطلب الانضمام' })).toBeVisible();

  await bCtx.close();
});

test('admin rejection with a reason is shown to the applicant', async ({ page }) => {
  const applicant = uniqueName('rej');
  await browserUser(page, applicant);
  await createProfileInBrowser(page, 'Rejected Applicant', `GID-${applicant}`.slice(0, 24));
  const origin = new URL(page.url()).origin;
  const logo = await page.request.post('/api/v1/media/images?kind=clan_logo', {
    headers: { Origin: origin },
    multipart: { file: await pngFile() },
  });
  const tag = uniqueTag();
  const app = await page.request.post('/api/v1/clan-applications', {
    headers: { Origin: origin },
    data: {
      name: `Bad ${tag}`,
      tag,
      logoMediaId: (await logo.json()).id,
      description: 'Description for e2e.',
      contactUrl: 'https://x.com/e2e',
    },
  });
  const admin = await apiActor(uniqueName('adm'));
  grantRole(admin.username, 'moderator');
  const res = await admin.api.post(
    `/api/v1/admin/clan-applications/${(await app.json()).id}/reject`,
    {
      data: { reason: 'الشعار غير واضح، ارفع نسخة بدقة أعلى.' },
    },
  );
  expect(res.status()).toBe(200);

  await page.goto('/dashboard');
  await expect(page.getByText('رُفض الطلب.')).toBeVisible();
  await expect(page.getByText('السبب: الشعار غير واضح، ارفع نسخة بدقة أعلى.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'قدّم طلبًا جديدًا' })).toBeVisible();
});

test('clan discovery search, empty results, and English LTR clan page', async ({ page }) => {
  await page.goto('/clans?q=zz-no-such-clan');
  await expect(page.getByText('لا نتائج')).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.goto('/en/clans');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1, name: 'Clans' })).toBeVisible();
});
