import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ADMIN_TOKEN = 'smoke-admin-token';
const VALID_BIRTH_INFO = {
  nickname: 'Smoke Test',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '08:30',
  birthPlace: '北京',
  useTrueSolarTime: false,
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function waitForServer(baseUrl, processName) {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { cache: 'no-store' });
      if (response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(500);
  }
  throw new Error(`${processName} did not become ready: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

async function startNextDev({ env, label }) {
  const port = await getFreePort();
  const child = spawn('node_modules/.bin/next', ['dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    output += chunk.toString();
  });

  child.once('exit', code => {
    if (code !== null && code !== 0) {
      output += `\n[${label}] next dev exited with code ${code}`;
    }
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(baseUrl, label);

  return {
    baseUrl,
    stop: async () => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      await Promise.race([
        new Promise(resolve => child.once('exit', resolve)),
        sleep(5_000).then(() => {
          if (!child.killed) child.kill('SIGKILL');
        }),
      ]);
    },
    getOutput: () => output,
  };
}

async function postJson(url, body, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function createReport(baseUrl, body = VALID_BIRTH_INFO) {
  const response = await postJson(`${baseUrl}/api/reports`, body);
  const data = await response.json();
  return { response, data };
}

async function readStoredReport(reportStoreDir, reportId) {
  const raw = await readFile(path.join(reportStoreDir, `${reportId}.json`), 'utf8');
  return JSON.parse(raw);
}

async function runCoreFlow() {
  const reportStoreDir = await mkdtemp(path.join(tmpdir(), 'starinsight-smoke-json-'));
  const app = await startNextDev({
    label: 'core-flow',
    env: {
      REPORT_STORE: 'json',
      REPORT_STORE_DIR: reportStoreDir,
      RATE_LIMIT_ENABLED: 'false',
      ADMIN_TOKEN,
      AI_PROVIDER: 'deepseek',
      AI_MODEL: 'deepseek-chat',
      DEEPSEEK_API_KEY: '',
      DEEPSEEK_BASE_URL: '',
    },
  });

  try {
    const missingGender = await createReport(app.baseUrl, { ...VALID_BIRTH_INFO, gender: undefined });
    assert(missingGender.response.status === 400, 'missing gender should return 400');

    const missingDate = await createReport(app.baseUrl, { ...VALID_BIRTH_INFO, birthDate: '' });
    assert(missingDate.response.status === 400, 'missing birthDate should return 400');

    const missingTime = await createReport(app.baseUrl, { ...VALID_BIRTH_INFO, birthTime: '' });
    assert(missingTime.response.status === 400, 'missing birthTime should return 400');

    const created = await createReport(app.baseUrl);
    assert(created.response.ok, `create report should succeed: ${JSON.stringify(created.data)}`);
    assert(typeof created.data.reportId === 'string' && created.data.reportId.length > 0, 'create report should return reportId');
    assert(typeof created.data.accessToken === 'string' && created.data.accessToken.length > 20, 'create report should return accessToken');
    assert(created.data.reportUrl === `/report/${created.data.reportId}?token=${created.data.accessToken}`, 'create report should return tokenized reportUrl');

    const storedFree = await readStoredReport(reportStoreDir, created.data.reportId);
    assert(storedFree.aiFullReport, 'no API key fallback should still save aiFullReport');
    assert(storedFree.metadata?.aiStatus === 'fallback', 'no API key path should record fallback status');

    const wrongReportPage = await fetch(`${app.baseUrl}/report/${created.data.reportId}?token=wrong-token`, {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    const wrongReportHtml = await wrongReportPage.text();
    assert(wrongReportHtml.includes('无法访问这份报告'), 'wrong report token should show access denied page');

    const freeExport = await fetch(`${app.baseUrl}/api/reports/${created.data.reportId}/export?token=${created.data.accessToken}`, {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    assert(freeExport.status === 403, 'free report export should return 403');

    const wrongExport = await fetch(`${app.baseUrl}/api/reports/${created.data.reportId}/export?token=wrong-token`, {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    assert(wrongExport.status === 403, 'wrong export token should return 403');

    const wrongAdmin = await fetch(`${app.baseUrl}/api/admin/reports/${created.data.reportId}/mark-paid`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer wrong-token',
        'x-forwarded-for': '203.0.113.10',
      },
    });
    assert(wrongAdmin.status === 401, 'wrong ADMIN_TOKEN should return 401');

    const paidAdmin = await fetch(`${app.baseUrl}/api/admin/reports/${created.data.reportId}/mark-paid`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'x-forwarded-for': '203.0.113.10',
      },
    });
    const paidData = await paidAdmin.json();
    assert(paidAdmin.ok && paidData.status === 'paid', `correct ADMIN_TOKEN should mark paid: ${JSON.stringify(paidData)}`);

    const paidExport = await fetch(`${app.baseUrl}/api/reports/${created.data.reportId}/export?token=${created.data.accessToken}`, {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    const markdown = await paidExport.text();
    assert(paidExport.ok, `paid export should succeed: ${markdown}`);
    assert(markdown.includes('# AI紫微命盘报告'), 'paid export should return markdown report');

    return { reportStoreDir };
  } finally {
    await app.stop();
    await rm(reportStoreDir, { recursive: true, force: true });
  }
}

async function startInvalidJsonMock() {
  const port = await getFreePort();
  const server = createServer((request, response) => {
    if (request.method === 'POST' && request.url === '/v1/chat/completions') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ choices: [{ message: { content: '{"summary":' } }] }));
      return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: { message: 'not found' } }));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    stop: () => new Promise(resolve => server.close(resolve)),
  };
}

async function runInvalidJsonFallbackFlow() {
  const reportStoreDir = await mkdtemp(path.join(tmpdir(), 'starinsight-smoke-invalid-ai-'));
  const mock = await startInvalidJsonMock();
  const app = await startNextDev({
    label: 'invalid-ai-json-flow',
    env: {
      REPORT_STORE: 'json',
      REPORT_STORE_DIR: reportStoreDir,
      RATE_LIMIT_ENABLED: 'false',
      ADMIN_TOKEN,
      AI_PROVIDER: 'deepseek',
      AI_MODEL: 'deepseek-chat',
      DEEPSEEK_API_KEY: 'smoke-test-key',
      DEEPSEEK_BASE_URL: mock.baseUrl,
    },
  });

  try {
    const created = await createReport(app.baseUrl, { ...VALID_BIRTH_INFO, nickname: 'Invalid JSON AI' });
    assert(created.response.ok, `invalid AI JSON should fallback and create report: ${JSON.stringify(created.data)}`);

    const stored = await readStoredReport(reportStoreDir, created.data.reportId);
    assert(stored.aiFullReport, 'invalid AI JSON fallback should save aiFullReport');
    assert(stored.metadata?.aiStatus === 'fallback', 'invalid AI JSON should record fallback status');
    assert(typeof stored.metadata?.aiFailureReason === 'string' && stored.metadata.aiFailureReason.length > 0, 'invalid AI JSON should record failure reason');
  } finally {
    await app.stop();
    await mock.stop();
    await rm(reportStoreDir, { recursive: true, force: true });
  }
}

async function main() {
  console.log('[smoke] Running core report/API/store flow...');
  await runCoreFlow();
  console.log('[smoke] Core report/API/store flow passed.');

  console.log('[smoke] Running invalid AI JSON fallback flow...');
  await runInvalidJsonFallbackFlow();
  console.log('[smoke] Invalid AI JSON fallback flow passed.');

  console.log('[smoke] All smoke tests passed.');
}

main().catch(error => {
  console.error('[smoke] Smoke tests failed.');
  console.error(error);
  process.exitCode = 1;
});
