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
