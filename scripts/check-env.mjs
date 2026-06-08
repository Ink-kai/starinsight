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
const EXPECTED_REPORT_STORE = 'supabase';
const MIN_ADMIN_TOKEN_LENGTH = 32;

function isMissing(name) {
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
  warnings.push(`AI_PROVIDER is "${process.env.AI_PROVIDER}"; current production checklist expects "deepseek".`);
}

if (!isMissing('ADMIN_TOKEN') && process.env.ADMIN_TOKEN.trim().length < MIN_ADMIN_TOKEN_LENGTH) {
  errors.push(`ADMIN_TOKEN must be at least ${MIN_ADMIN_TOKEN_LENGTH} characters for pre-launch deployment checks.`);
}

if (!isMissing('REPORT_PRICE')) {
  const price = Number(process.env.REPORT_PRICE);
  if (!Number.isFinite(price) || price <= 0) {
    errors.push('REPORT_PRICE must be a positive number.');
  }
}

if (!isMissing('REPORT_STORE')) {
  if (process.env.REPORT_STORE !== EXPECTED_REPORT_STORE) {
    errors.push(`REPORT_STORE must be "${EXPECTED_REPORT_STORE}" for Vercel preview/pre-production.`);
  }

  if (process.env.REPORT_STORE === 'supabase') {
    for (const name of SUPABASE_ENV) {
      if (isMissing(name)) {
        errors.push(`${name} is required when REPORT_STORE=supabase.`);
      }
    }
  }
}

console.log('Vercel pre-deploy environment check');
console.log('Required variables:', REQUIRED_ENV.join(', '));
console.log(`REPORT_STORE expected value: ${EXPECTED_REPORT_STORE}`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nEnvironment check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('\nEnvironment check passed.');
