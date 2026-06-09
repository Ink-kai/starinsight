import { expect, test } from '@playwright/test';

const ADMIN_TOKEN = process.env.PROD_ADMIN_TOKEN || process.env.ADMIN_TOKEN;
const TEST_IP = process.env.PROD_TEST_IP || '198.51.100.88';

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}. Create .env.production.local before running npm run test:prod.`);
  }
}

function uniqueBirthInfo() {
  return {
    nickname: `ProdAlphaQA-${Date.now()}`,
    gender: 'male',
    birthDate: process.env.PROD_TEST_BIRTH_DATE || '1990-01-01',
    birthTime: process.env.PROD_TEST_BIRTH_TIME || '08:30',
    birthPlace: process.env.PROD_TEST_BIRTH_PLACE || '北京',
    useTrueSolarTime: false,
  };
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON but received status ${response.status()}: ${text.slice(0, 500)}`);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('production alpha report flow', () => {
  let reportId;
  let accessToken;
  let reportUrl;

  test.beforeAll(() => {
    requireEnv('PROD_ADMIN_TOKEN or ADMIN_TOKEN', ADMIN_TOKEN);
  });

  test('create report returns reportId, accessToken and tokenized reportUrl', async ({ request }) => {
    const response = await request.post('/api/reports', {
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': TEST_IP,
      },
      data: uniqueBirthInfo(),
    });

    expect(response.status(), await response.text()).toBe(200);
    const data = await readJson(response);

    expect(data.reportId, 'reportId').toEqual(expect.any(String));
    expect(data.accessToken, 'accessToken').toEqual(expect.any(String));
    expect(data.accessToken.length, 'access token length').toBeGreaterThan(20);
    expect(data.reportUrl, 'reportUrl').toBe(`/report/${data.reportId}?token=${data.accessToken}`);
    expect(data.status, 'initial report status').toBe('free');

    reportId = data.reportId;
    accessToken = data.accessToken;
    reportUrl = data.reportUrl;
  });

  test('token access allows correct token and rejects missing or wrong tokens', async ({ request }) => {
    expect(reportId, 'reportId from create report').toBeTruthy();
    expect(accessToken, 'accessToken from create report').toBeTruthy();

    const correct = await request.get(reportUrl);
    expect(correct.status(), await correct.text()).toBe(200);
    await expect(correct).toContainText('AI 紫微命盘报告');

    const missing = await request.get(`/report/${reportId}`);
    expect(missing.status(), await missing.text()).toBe(200);
    await expect(missing).toContainText('无法访问这份报告');

    const wrong = await request.get(`/report/${reportId}?token=wrong-token`);
    expect(wrong.status(), await wrong.text()).toBe(200);
    await expect(wrong).toContainText('无法访问这份报告');
  });

  test('free report cannot be exported and wrong export token is rejected', async ({ request }) => {
    const freeExport = await request.get(`/api/reports/${reportId}/export?token=${accessToken}`, {
      headers: { 'x-forwarded-for': TEST_IP },
    });
    expect(freeExport.status(), await freeExport.text()).toBe(403);
    await expect(freeExport).toContainText('Only paid reports can be exported');

    const wrongTokenExport = await request.get(`/api/reports/${reportId}/export?token=wrong-token`, {
      headers: { 'x-forwarded-for': TEST_IP },
    });
    expect(wrongTokenExport.status(), await wrongTokenExport.text()).toBe(403);
  });

  test('admin mark-paid rejects wrong ADMIN_TOKEN and accepts correct ADMIN_TOKEN', async ({ request }) => {
    const wrongAdmin = await request.post(`/api/admin/reports/${reportId}/mark-paid`, {
      headers: {
        Authorization: 'Bearer wrong-token',
        'x-forwarded-for': TEST_IP,
      },
    });
    expect(wrongAdmin.status(), await wrongAdmin.text()).toBe(401);

    const paid = await request.post(`/api/admin/reports/${reportId}/mark-paid`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'x-forwarded-for': TEST_IP,
      },
    });
    expect(paid.status(), await paid.text()).toBe(200);
    const paidData = await readJson(paid);
    expect(paidData.status).toBe('paid');
  });

  test('paid report can be exported as Markdown', async ({ request }) => {
    const paidExport = await request.get(`/api/reports/${reportId}/export?token=${accessToken}`, {
      headers: { 'x-forwarded-for': TEST_IP },
    });

    expect(paidExport.status(), await paidExport.text()).toBe(200);
    expect(paidExport.headers()['content-type']).toContain('text/markdown');
    expect(paidExport.headers()['content-disposition']).toContain(`ziwei-report-${reportId}.md`);
    await expect(paidExport).toContainText('# AI紫微命盘报告');
  });
});
