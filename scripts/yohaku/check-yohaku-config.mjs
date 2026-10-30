#!/usr/bin/env node
// Guards the offline promise of a Yohaku build: no Readest service keys reach
// the app, every app build is a Yohaku build, and the Tauri config names
// Yohaku and calls none of Readest's or the telemetry/payment hosts.
// Usage: node scripts/yohaku/check-yohaku-config.mjs (from the repository root).
import fs from 'node:fs';
import path from 'node:path';

const appDir = path.resolve('apps/readest-app');
const problems = [];

const FORBIDDEN_KEYS = [
  /^NEXT_PUBLIC_DEFAULT_(POSTHOG|SUPABASE)_/,
  /^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/,
  /^NEXT_PUBLIC_POSTHOG_(KEY|HOST)$/,
  /^SENTRY_(DSN|AUTH_TOKEN)$/,
];
const FORBIDDEN_HOSTS = ['readest.com', 'posthog.com', 'sentry.io', 'supabase.co', 'stripe.com'];

const readEnv = (file) => {
  const full = path.join(appDir, file);
  if (!fs.existsSync(full)) return null;
  const entries = new Map();
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) entries.set(match[1], match[2].trim());
  }
  return entries;
};

for (const file of ['.env', '.env.tauri', '.env.local']) {
  const env = readEnv(file);
  if (!env) continue;
  for (const key of env.keys()) {
    if (FORBIDDEN_KEYS.some((re) => re.test(key))) problems.push(`${file} defines ${key}`);
  }
}
for (const key of Object.keys(process.env)) {
  if (FORBIDDEN_KEYS.some((re) => re.test(key)) && process.env[key]) {
    problems.push(`the build environment defines ${key}`);
  }
}

const tauriEnv = readEnv('.env.tauri');
if (tauriEnv?.get('NEXT_PUBLIC_YOHAKU_BUILD') !== 'true') {
  problems.push('.env.tauri must set NEXT_PUBLIC_YOHAKU_BUILD=true');
}
// Readest's web API falls back to web.readest.com unless pointed elsewhere.
for (const key of ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_NODE_BASE_URL']) {
  const host = URL.canParse(tauriEnv?.get(key) ?? '') ? new URL(tauriEnv.get(key)).hostname : '';
  if (!host.endsWith('.invalid')) problems.push(`.env.tauri must point ${key} at a .invalid host`);
}

const conf = JSON.parse(fs.readFileSync(path.join(appDir, 'src-tauri/tauri.conf.json'), 'utf8'));
if (conf.identifier !== 'io.github.chaosnap.yohaku') {
  problems.push(`tauri.conf.json identifier is ${conf.identifier}`);
}
if (conf.productName !== 'Yohaku') problems.push(`tauri.conf.json productName is ${conf.productName}`);
if (conf.bundle?.createUpdaterArtifacts) {
  problems.push('tauri.conf.json must not create updater artifacts yet');
}
for (const endpoint of conf.plugins?.updater?.endpoints ?? []) {
  if (endpoint.includes('readest')) problems.push(`updater endpoint points at Readest: ${endpoint}`);
}
for (const [directive, value] of Object.entries(conf.app?.security?.csp ?? {})) {
  for (const host of FORBIDDEN_HOSTS) {
    if (String(value).includes(host)) problems.push(`CSP ${directive} allows ${host}`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`::error::${problem}`);
  process.exit(1);
}
console.log('Yohaku config check passed: offline build, Yohaku identity, no Readest services.');
