import { defineConfig } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.production.local'));

const baseURL = process.env.PROD_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://starinsight.vercel.app';
const timeout = Number.parseInt(process.env.PROD_TEST_TIMEOUT_MS || '90000', 10);

export default defineConfig({
  testDir: '.',
  testMatch: ['production.spec.mjs'],
  fullyParallel: false,
  workers: 1,
  retries: Number.parseInt(process.env.PROD_TEST_RETRIES || '0', 10),
  timeout: Number.isFinite(timeout) ? timeout : 90000,
  reporter: [['list']],
  use: {
    baseURL,
    extraHTTPHeaders: {
      'x-production-smoke-test': 'true',
    },
  },
});
