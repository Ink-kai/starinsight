#!/usr/bin/env node

import { access, readFile } from 'fs/promises';
import path from 'path';

const root = process.cwd();
const requiredFiles = [
  'app/page.tsx',
  'app/chart/new/page.tsx',
  'app/report/[id]/page.tsx',
  'app/api/reports/route.ts',
  'app/api/generate/route.ts',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'docs/deploy-vercel.md',
  'supabase/migrations/001_create_reports.sql',
];

const requiredDocPhrases = [
  'Vercel Preview',
  'REPORT_STORE=supabase',
  'SUPABASE_SERVICE_ROLE_KEY',
  '不要把 service role key 暴露到客户端',
  'Cloudflare Pages',
  'npm run check:env',
  'npm run build',
  'npm run test:smoke',
  'SupabaseReportStore',
  'REPORT_STORE=json',
];

const errors = [];

for (const file of requiredFiles) {
  try {
    await access(path.join(root, file));
  } catch {
    errors.push(`Missing required smoke-check file: ${file}`);
  }
}

try {
  const store = await readFile(path.join(root, 'lib/report/store.ts'), 'utf8');
  if (!store.includes('class SupabaseReportStore')) {
    errors.push('lib/report/store.ts is missing SupabaseReportStore.');
  }
  if (!store.includes("REPORT_STORE || 'json'")) {
    errors.push('lib/report/store.ts is missing REPORT_STORE=json local fallback.');
  }
} catch {
  errors.push('Unable to read lib/report/store.ts.');
}

try {
  const migration = await readFile(path.join(root, 'supabase/migrations/001_create_reports.sql'), 'utf8');
  for (const phrase of ['create table if not exists public.reports', 'access_token', 'birth_info', 'chart_data', 'ai_full_report']) {
    if (!migration.includes(phrase)) {
      errors.push(`supabase/migrations/001_create_reports.sql is missing phrase: ${phrase}`);
    }
  }
} catch {
  errors.push('Unable to read supabase/migrations/001_create_reports.sql.');
}

try {
  const doc = await readFile(path.join(root, 'docs/deploy-vercel.md'), 'utf8');
  for (const phrase of requiredDocPhrases) {
    if (!doc.includes(phrase)) {
      errors.push(`docs/deploy-vercel.md is missing phrase: ${phrase}`);
    }
  }
} catch {
  errors.push('Unable to read docs/deploy-vercel.md.');
}

console.log('Pre-deploy smoke checks');
console.log(`Checked ${requiredFiles.length} files and ${requiredDocPhrases.length} deployment doc markers.`);

if (errors.length > 0) {
  console.error('\nSmoke test failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('\nSmoke test passed.');
