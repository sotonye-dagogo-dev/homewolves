# Test Results

> **Metadata**
> - last-updated-by: execute-feature-session-23
> - last-verified-against-code: 2026-10-16
> - staleness-policy: overwritten on every test run — always current

> **Overview:** Latest test run results. Updated by agents after running tests. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-10-16
**Run by:** execute-feature (Session 23 — QA gate)

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| API unit (vitest, @hw/api) | 173 | 0 | 0 |
| Web unit/component (vitest, @hw/web) | 155 | 0 | 0 |
| E2E (Playwright, @hw/web) | not run | — | — |
| Web production build (`next build`) | 38 pages | 0 | — |

**Overall Status:** Green — `npm run test` API 173/173 (18 files) + web 155/155 (21 files), `npm run typecheck` 4/4 (0 TS errors), `npm run lint` 4/4 (0 errors; 3 pre-existing warnings: no-console in api/main.ts, empty blocks in sitemap.ts + messaging.ts — the previously-tracked `auth.service.ts:290` lint error is no longer present), `npm run build` Next.js 38/38 static pages + nest build clean.

**API unit test files (18):** including auth, listing, rate-limit, sms, storage, docuseal, health, app.e2e.spec + **NEW `drizzle/seed.backup.spec.ts` (14 tests: table-registry integrity 4, collectBackup scopes/fail-hard/credential-safety 6, createBackup 2, restoreBackup parents-first/chunking 2)**.
**Web unit test files (21):** including property-filters (21 tests), auth-local (15), messaging, use-auth, top-nav, mobile-bar, hero-section, hw-button, post-form.

**Notes:**
- Session 23 QA: two initial seed.backup spec failures were **test-side only** (stale assertion raced by an in-flight fix; `URL.host` includes the `:5432` port — port kept intentionally for provenance). Both spec fixes verified green on re-run.
- `db:seed` / `db:purge` / `db:restore` could not be live-tested here (Supabase unreachable from this environment: IPv6-only host + WARP DNS latency). Covered by unit specs; first live run should start with `npm run db:seed:backup`.
- E2E must be run from `apps/web` (`npx playwright test`) — root-level `npx playwright test` does not pick up the config correctly.
- Run typecheck only after `next build` finishes (`.next/types` race).
- `apps/web/next.config.js` now loads the repo-root `.env` via dotenv (non-overriding) — shell/Vercel env stays authoritative.

---

## Active Failures

| Test | Error | Status | Assigned To |
|------|-------|--------|------------|
| — | — | None | — |

---

## History

| Date | Passed | Failed | Notes |
|------|--------|--------|-------|
| 2026-06-10 | 0 | 0 | Initial audit complete. No test suite exists yet |
| 2026-06-10 | 0 | 0 | Session 6: All features implemented. `tsc --noEmit` passes on all packages |
| 2026-06-16 | 0 | 0 | Build repair pass — `npm run build` completes green |
| 2026-08-05 | 0 | 0 | v2 ai-system bootstrap. No test suite configured yet |
| 2026-08-11 | 35 | 0 | Baseline before this session: 16 API + 19 web unit tests, 3 E2E smoke tests |
| 2026-08-13 | 187 | 0 | Testing setup complete: 93 API + 94 web unit, 16 E2E journeys (1 flaky) |
| 2026-09-23 | 334 | 0 | fix-build multi-issue repair: 159 API + 153 web unit, 22 E2E all green |
| 2026-09-23 | 334 | 0 | Vercel `postgres` Module not found fixed; `next build` 33 pages green; typecheck/lint 4/4 |
| 2026-10-14 | 42 | 0 | fix-build Session 20c: web UI vitest 21/21 (hw-input 7/7), api auth vitest 21/21; web tsc 0 errors |
| 2026-10-15 | 314 | 0 | fix-build Session 20d: web vitest 155/155 (21 files), api vitest 159/159 (17 files); web + api tsc 0 errors |
| 2026-10-15 | — | 0 | fix-build Session 22: no unit tests touched (build-config fix). Verified `npm run vercel-build` green from BOTH cwds — `apps/web` (direct `next build`, full route table incl. products/services) and repo root (migrate-skip + turbo + `Verified Next.js output at apps/web/.next`); `findRepoRoot()` resolves repo root from either cwd; `npm run --workspace=@hw/web vercel-build` resolves (was `Missing script`) |
| 2026-10-16 | 328 | 0 | execute-feature Session 23: api 173/173 (18 files — +`drizzle/seed.backup.spec.ts` 14/14), web 155/155 (21 files); typecheck 4/4, lint 0 errors (auth.service:290 error gone), `next build` 38/38 pages; E2E not run |
