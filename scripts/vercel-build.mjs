#!/usr/bin/env node
/**
 * Vercel build entrypoint — runs Drizzle migrations before the Next.js build.
 *
 * Why: production auth (register-password / login-password) reads/writes the
 * `User` table directly (local mode when no external NestJS backend is
 * configured). If migrations haven't applied (e.g. missing `passwordHash`
 * column from 0004, or missing seed backfill from 0005), auth fails with
 * opaque 500s and there is no entry point into the platform.
 *
 * Behaviour (config-driven, non-breaking, removable later):
 * - If DATABASE_URL is unset/empty (or not a postgres URL): log a warning
 *   and continue to the web build so preview builds without a DB still succeed.
 * - If SKIP_DB_MIGRATE=1 (or SKIP_MIGRATIONS=1): skip migrate on request.
 * - If DATABASE_URL is set: run the repo-local `drizzle-kit migrate` binary
 *   (avoids an `npx --yes` registry fetch per build) with a 60s timeout
 *   (override via VERCEL_MIGRATE_TIMEOUT_MS). On migrate failure OR timeout,
 *   log but DO NOT fail the build — the web auth routes already self-heal
 *   (ALTER TABLE IF NOT EXISTS + structured 503s). This fail-soft timeout is
 *   what keeps `vercel build` from stalling with a truncated log when the DB
 *   is unreachable (pooler/DNS), the exact symptom in Vercel CLI 62.7.0 logs.
 * - Then runs the standard web build via the repo-local `turbo` binary when
 *   present, else `npx --yes turbo`.
 *
 * To remove later: set vercel.json buildCommand back to
 * `npx turbo run build --filter=@hw/web...` and delete this file + the
 * `vercel-build` npm script.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function log(msg) {
  console.log(`[vercel-build] ${msg}`);
}

// Resolve the monorepo root regardless of Vercel's Root Directory setting.
// - If the dashboard Root is the repo root (empty), cwd already contains turbo.json.
// - If the dashboard Root is apps/web, cwd is apps/web and turbo.json lives
//   one (or more) levels up. Walking up keeps drizzle/turbo paths correct and
//   avoids the old doubled-path check (apps/web/apps/web/.next).
function findRepoRoot() {
  const markers = ['turbo.json', 'package.json'];
  const isRoot = (dir) =>
    existsSync(join(dir, 'turbo.json')) &&
    existsSync(join(dir, 'package.json')) &&
    existsSync(join(dir, 'apps', 'web', 'package.json'));
  let dir = resolve(process.cwd());
  for (let i = 0; i < 6; i++) {
    if (isRoot(dir)) return dir;
    // Also accept a dir whose package.json declares workspaces apps/* (extra guard)
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: relative to this script (scripts/vercel-build.mjs → repo root)
  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const candidate = resolve(scriptDir, '..');
    if (isRoot(candidate)) return candidate;
  } catch {
    // ignore — fall through to cwd
  }
  void markers;
  return resolve(process.cwd());
}

const REPO_ROOT = findRepoRoot();
if (REPO_ROOT !== resolve(process.cwd())) {
  log(`Detected repo root at ${REPO_ROOT} (cwd is ${resolve(process.cwd())}).`);
} else {
  log(`Repo root is cwd (${REPO_ROOT}).`);
}

function resolveBin(name) {
  // Prefer the repo-local binary so Vercel builds don't pay an `npx --yes`
  // registry round-trip per build (log line: "turbo@x will be installed").
  for (const candidate of [
    join(REPO_ROOT, 'node_modules', '.bin', name),
    join(REPO_ROOT, 'packages', 'api', 'node_modules', '.bin', name),
    join(REPO_ROOT, 'apps', 'web', 'node_modules', '.bin', name),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return { status: res.status ?? 1, error: res.error, signal: res.signal };
}

function looksLikePostgresUrl(url) {
  return /^(postgres(ql)?:\/\/|postgresql:\/\/)/i.test(url);
}

const SKIP_MIGRATE =
  ['1', 'true', 'yes'].includes((process.env.SKIP_DB_MIGRATE ?? '').trim().toLowerCase()) ||
  ['1', 'true', 'yes'].includes((process.env.SKIP_MIGRATIONS ?? '').trim().toLowerCase());
// Default migrate timeout: fail-soft so a hung DB never stalls `vercel build`
// with a truncated log (the exact symptom in the reported build log).
const MIGRATE_TIMEOUT_MS = Number(process.env.VERCEL_MIGRATE_TIMEOUT_MS ?? 60000) || 60000;

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();

if (!databaseUrl) {
  log('WARNING: DATABASE_URL is not set — skipping drizzle migrate (auth will return 503 with hint until DB is configured).');
} else if (SKIP_MIGRATE) {
  log('SKIP_DB_MIGRATE is set — skipping drizzle migrate by request; continuing to web build.');
} else if (!looksLikePostgresUrl(databaseUrl)) {
  log('WARNING: DATABASE_URL does not look like a postgres URL — skipping drizzle migrate; continuing to web build.');
} else {
  log(`Running drizzle-kit migrate (packages/api, timeout ${MIGRATE_TIMEOUT_MS}ms)...`);
  // drizzle-kit reads drizzle.config.ts which loads DATABASE_URL itself.
  // Use --config to be explicit; cwd is repo root so pass relative path.
  const drizzleBin =
    resolveBin('drizzle-kit') ?? join(REPO_ROOT, 'node_modules', '.bin', 'drizzle-kit');
  let migrate;
  if (drizzleBin && existsSync(drizzleBin)) {
    migrate = run(drizzleBin, ['migrate', '--config=packages/api/drizzle.config.ts'], {
      cwd: REPO_ROOT,
      timeout: MIGRATE_TIMEOUT_MS,
      killSignal: 'SIGKILL',
    });
  } else {
    migrate = run(
      'npx',
      ['--yes', 'drizzle-kit', 'migrate', '--config=packages/api/drizzle.config.ts'],
      { cwd: REPO_ROOT, timeout: MIGRATE_TIMEOUT_MS, killSignal: 'SIGKILL' },
    );
  }
  if (migrate.error) {
    log(
      `WARNING: drizzle-kit migrate did not complete (${String(migrate.error.message ?? migrate.error)}). ` +
        'Continuing to web build anyway — web auth routes self-heal missing columns at request time.',
    );
  } else if (migrate.status !== 0) {
    log(
      `WARNING: drizzle-kit migrate exited with code ${migrate.status}${migrate.signal ? ` (signal ${migrate.signal})` : ''}. Continuing to web build anyway — ` +
        'web auth routes self-heal missing columns at request time and Vercel logs above show the migrate error.',
    );
  } else {
    log('drizzle-kit migrate completed.');
  }
}

log('Running web build: turbo run build --filter=@hw/web...');
const turboBin = resolveBin('turbo');
const build = turboBin
  ? run(turboBin, ['run', 'build', '--filter=@hw/web...'], { cwd: REPO_ROOT })
  : run('npx', ['--yes', 'turbo', 'run', 'build', '--filter=@hw/web...'], { cwd: REPO_ROOT });
if (build.status !== 0) {
  log(`Web build failed with code ${build.status}.`);
  process.exit(build.status);
}
// Post-build output check: Vercel expects apps/web/.next when the dashboard
// Root Directory is the repo root (empty). If a future dashboard change sets
// Root to apps/web, Vercel would look for apps/web/apps/web/.next (doubled)
// and fail with "output directory not found" — this explicit check makes that
// misconfiguration obvious in the build log instead of a silent stall.
// REPO_ROOT is used (not process.cwd()) so the check is correct from either cwd.
const __nextDir = join(REPO_ROOT, 'apps', 'web', '.next');
if (existsSync(join(__nextDir, 'BUILD_ID')) || existsSync(join(__nextDir, 'build-manifest.json'))) {
  log(`Verified Next.js output at apps/web/.next (Root Directory = repo root is correct).`);
} else if (existsSync(join(REPO_ROOT, '.next', 'BUILD_ID')) || existsSync(join(process.cwd(), '.next', 'BUILD_ID'))) {
  log(
    'WARNING: Next.js output found at .next instead of apps/web/.next — ' +
      'the build ran from apps/web as cwd (dashboard Root Directory may be apps/web). ' +
      'Set Vercel dashboard Root Directory to the repo root (empty) for monorepo builds.',
  );
} else {
  log(
    'WARNING: Next.js output not found at apps/web/.next — Vercel may report ' +
      '"output directory not found". Check that the dashboard Root Directory is the repo root (empty).',
  );
}
log('Web build completed.');
