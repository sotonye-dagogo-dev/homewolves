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
 * - If DATABASE_URL is unset/empty: log a warning and continue to the web
 *   build so preview builds without a DB still succeed.
 * - If DATABASE_URL is set: run `drizzle-kit migrate` from packages/api
 *   (applies ./drizzle/migrations). On migrate failure, log but DO NOT fail
 *   the build — the web auth routes already self-heal (ALTER TABLE IF NOT
 *   EXISTS + structured 503s) and Vercel logs will show the migrate error.
 * - Then runs the standard web build: `turbo run build --filter=@hw/web...`.
 *
 * To remove later: set vercel.json buildCommand back to
 * `npx turbo run build --filter=@hw/web...` and delete this file + the
 * `vercel-build` npm script.
 */
import { spawnSync } from 'node:child_process';

function log(msg) {
  console.log(`[vercel-build] ${msg}`);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return res.status ?? 1;
}

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();

if (!databaseUrl) {
  log('WARNING: DATABASE_URL is not set — skipping drizzle migrate (auth will return 503 with hint until DB is configured).');
} else {
  log('Running drizzle-kit migrate (packages/api)...');
  // drizzle-kit reads drizzle.config.ts which loads DATABASE_URL itself.
  // Use --config to be explicit; cwd is repo root so pass relative path.
  const migrateStatus = run(
    'npx',
    ['--yes', 'drizzle-kit', 'migrate', '--config=packages/api/drizzle.config.ts'],
    { cwd: process.cwd() },
  );
  if (migrateStatus !== 0) {
    log(
      `WARNING: drizzle-kit migrate exited with code ${migrateStatus}. Continuing to web build anyway — ` +
        'web auth routes self-heal missing columns at request time and Vercel logs above show the migrate error.',
    );
  } else {
    log('drizzle-kit migrate completed.');
  }
}

log('Running web build: npx turbo run build --filter=@hw/web...');
const buildStatus = run('npx', ['turbo', 'run', 'build', '--filter=@hw/web...']);
if (buildStatus !== 0) {
  log(`Web build failed with code ${buildStatus}.`);
  process.exit(buildStatus);
}
log('Web build completed.');
