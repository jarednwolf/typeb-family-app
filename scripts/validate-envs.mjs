#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const repoRoot = process.cwd();

const FILES = [
  // Root
  '.env.local',
  '.env.staging',
  '.env.production',
  // Web
  'apps/web/.env.local',
  'apps/web/.env.staging',
  'apps/web/.env.production',
  // Mobile
  'typeb-family-app/.env.local',
  'typeb-family-app/.env.staging',
  'typeb-family-app/.env.production',
];

const REQUIRED = {
  root: [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'REVENUECAT_WEBHOOK_SECRET',
    // Monitoring/functions deploy tokens
    'FIREBASE_TOKEN',
  ],
  web: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    // Web monitoring
    'NEXT_PUBLIC_SENTRY_DSN',
  ],
  mobile: [
    'EXPO_PUBLIC_ENVIRONMENT',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    // Mobile monitoring & payments
    'EXPO_PUBLIC_SENTRY_DSN',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
    'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID',
  ],
};

// At least one of the keys in each inner array must be present
const REQUIRED_ONE_OF = {
  root: [ ['SENTRY_DSN_FUNCTIONS', 'SENTRY_DSN'] ],
  web: [],
  mobile: [],
};

const OPTIONAL = {
  root: [
    'SENTRY_DSN', // functions DSN
    'MONITORING_WEBHOOK_URL',
    'ANALYTICS_WEBHOOK_URL',
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
    'EXPO_TOKEN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
    'REVENUECAT_API_KEY',
  ],
  web: [
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  ],
  mobile: [
    'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'EXPO_PUBLIC_USE_EMULATOR',
    'EXPO_PUBLIC_ENABLE_CRASH_REPORTING',
  ],
};

function classify(filePath) {
  if (filePath.startsWith('apps/web/')) return 'web';
  if (filePath.startsWith('typeb-family-app/')) return 'mobile';
  return 'root';
}

function parseEnv(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1);
    // Strip surrounding quotes if present (single or double)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

async function readIfExists(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

function warnPrivateKeyFormatting(value) {
  if (!value) return null;
  const hasBegin = value.includes('BEGIN PRIVATE KEY');
  const hasEscapedNewlines = value.includes('\\n');
  if (hasBegin && !hasEscapedNewlines) {
    return 'FIREBASE_ADMIN_PRIVATE_KEY should be quoted and contain \\n escapes (see env.example).';
  }
  return null;
}

async function ensurePlaceholders(filePath, missingKeys) {
  const exists = await readIfExists(filePath);
  const header = '\n\n# Added by env validator (placeholders for missing keys)\n';
  const additions = missingKeys.map(k => `${k}=`).join('\n') + '\n';
  const content = exists === null ? additions : exists + header + additions;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const write = args.has('--write-placeholders') || args.has('--fix');
  const only = process.env.ENV_FILES ? process.env.ENV_FILES.split(',').map(s => s.trim()) : null;

  const targets = only && only.length ? only : FILES;
  let hadErrors = false;
  let wrote = false;
  const results = [];

  for (const rel of targets) {
    const filePath = path.resolve(repoRoot, rel);
    const profile = classify(rel);
    const content = await readIfExists(filePath);

    if (content === null) {
      results.push({ file: rel, exists: false, missing: REQUIRED[profile], optionalMissing: OPTIONAL[profile], warnings: ['File not found'] });
      if (write) { await ensurePlaceholders(filePath, REQUIRED[profile]); wrote = true; }
      hadErrors = true;
      continue;
    }

    const env = parseEnv(content);

    const required = REQUIRED[profile];
    const missing = required.filter(k => !env.has(k));

    // Handle one-of requirements
    const oneOf = REQUIRED_ONE_OF[profile] || [];
    for (const group of oneOf) {
      const hasAny = group.some(k => env.has(k));
      if (!hasAny) missing.push(group.join('|'));
    }

    const optional = OPTIONAL[profile];
    const optionalMissing = optional.filter(k => !env.has(k));

    const warnings = [];

    // Cross-profile warnings
    if (profile === 'web') {
      for (const k of env.keys()) {
        if (k.startsWith('EXPO_PUBLIC_')) warnings.push(`Unexpected mobile var in web env: ${k}`);
      }
    } else if (profile === 'mobile') {
      for (const k of env.keys()) {
        if (k.startsWith('NEXT_PUBLIC_')) warnings.push(`Unexpected web var in mobile env: ${k}`);
      }
    }

    // Private key formatting check
    if (profile === 'root') {
      const pk = env.get('FIREBASE_ADMIN_PRIVATE_KEY');
      const warn = warnPrivateKeyFormatting(pk);
      if (warn) warnings.push(warn);
    }

    if (missing.length) hadErrors = true;
    if (write && missing.length) { await ensurePlaceholders(filePath, missing); wrote = true; }

    results.push({ file: rel, exists: true, missing, optionalMissing, warnings });
  }

  // Print report
  for (const r of results) {
    const status = r.exists ? 'FOUND' : 'MISSING';
    console.log(`\n[${status}] ${r.file}`);
    if (r.missing?.length) console.log(`  Missing required: ${r.missing.join(', ')}`);
    if (r.optionalMissing?.length) console.log(`  Missing optional: ${r.optionalMissing.join(', ')}`);
    if (r.warnings?.length) r.warnings.forEach(w => console.log(`  Warning: ${w}`));
  }

  // Machine-readable checklist summary
  const summary = [];
  for (const r of results) {
    if (!r.missing?.length && !r.optionalMissing?.length) continue;
    const scope = classify(r.file);
    for (const key of (r.missing || [])) summary.push({ file: r.file, scope, key, required: true });
    for (const key of (r.optionalMissing || [])) summary.push({ file: r.file, scope, key, required: false });
  }
  if (summary.length) {
    console.log('\nJSON_CHECKLIST_START');
    console.log(JSON.stringify(summary, null, 2));
    console.log('JSON_CHECKLIST_END');
  }

  if (write) {
    if (wrote) console.log('\nPlaceholders written. Re-run "pnpm env:check" to verify.');
    process.exitCode = 0;
    return;
  }

  if (hadErrors) {
    process.exitCode = 1;
    console.log('\nUse "pnpm env:fix" to add placeholder keys for missing required vars.');
  } else {
    console.log('\nAll checked env files contain required keys.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
