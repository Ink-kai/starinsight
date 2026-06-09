#!/usr/bin/env node

const REQUIRED_ENV = [
  'NEXT_PUBLIC_APP_NAME',
  'AI_PROVIDER',
  'AI_MODEL',
  'DEEPSEEK_API_KEY',
  'ADMIN_TOKEN',
  'REPORT_PRICE',
  'REPORT_STORE',
];

const SUPABASE_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const MIN_ADMIN_TOKEN_LENGTH = 32;

function isMissing(name) {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim().length === 0;
}

function isEmpty(name) {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim().length === 0;
}

const errors = [];
const warnings = [];

for (const name of REQUIRED_ENV) {
  if (isMissing(name)) {
    errors.push(`${name} is required.`);
  }
}

if (!isMissing('AI_PROVIDER') && process.env.AI_PROVIDER !== 'deepseek') {
  warnings.push(`AI_PROVIDER is "${process.env.AI_PROVIDER}"; current production expects "deepseek".`);
}

if (!isMissing('ADMIN_TOKEN')) {
  const tokenLen = process.env.ADMIN_TOKEN.trim().length;
  if (tokenLen < MIN_ADMIN_TOKEN_LENGTH) {
    errors.push(`ADMIN_TOKEN must be at least ${MIN_ADMIN_TOKEN_LENGTH} characters (current: ${tokenLen}).`);
  }
}

if (!isMissing('REPORT_PRICE')) {
  const price = Number(process.env.REPORT_PRICE);
  if (!Number.isFinite(price) || price <= 0) {
    errors.push('REPORT_PRICE must be a positive number.');
  }
}

if (!isMissing('REPORT_STORE')) {
  const store = process.env.REPORT_STORE;

  if (!['json', 'supabase'].includes(store)) {
    errors.push(`REPORT_STORE must be either "json" (local dev) or "supabase" (production).`);
  }

  // Supabase mode requires additional env vars
  if (store === 'supabase') {
    for (const name of SUPABASE_ENV) {
      if (isEmpty(name)) {
        errors.push(`${name} is required when REPORT_STORE=supabase.`);
      }
    }

    // SECURITY: Ensure no NEXT_PUBLIC_ version of service role key exists
    if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY !== undefined) {
      errors.push('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must NOT exist. Service role key must never be exposed to the client.');
    }
  }
}

console.log('=== Vercel / Production Environment Check ===\n');
console.log('Required variables:', REQUIRED_ENV.join(', '));
console.log('Report store mode:', isMissing('REPORT_STORE') ? 'NOT SET' : process.env.REPORT_STORE);

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\n❌  Environment check failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error('\nFor local development with JSON storage:');
  console.error('  REPORT_STORE=json');
  console.error('\nFor production with Supabase:');
  console.error('  REPORT_STORE=supabase');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

console.log('\n✅  Environment check passed.');
console.log('\nMode: ' + (process.env.REPORT_STORE === 'supabase' ? 'Production (Supabase)' : 'Development (JSON)'));
