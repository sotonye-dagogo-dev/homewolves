# Test Results

> **Metadata**
> - last-updated-by: execute-feature-session-25
> - last-verified-against-code: 2026-10-20
> - staleness-policy: overwritten on every test run — always current

> **Overview:** Latest test run results. Updated by agents after running tests. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-10-20
**Run by:** execute-feature (Session 25 — QA gate)

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| API unit (vitest, @hw/api) | 173 | 0 | 0 |
| Web unit/component (vitest, @hw/web) | 155 | 0 | 0 |
| E2E (Playwright, @hw/web) | not run | — | — |
| Web production build (`next build`) | 38 pages | 0 | — |

**Overall Status:** Green — API 173/173 (18 files), web 155/155 (21 files), `npm run typecheck` 4/4 (0 TS errors), `npm run lint` 4/4 (0 errors, 0 warnings), `npm run build` 38/38 static pages + nest build clean.

**API unit test files (18):** including auth, listing, rate-limit, sms, storage, docuseal, health, app.e2e.spec + `drizzle/seed.backup.spec.ts`.
**Web unit test files (21):** including property-filters (21 tests), auth-local (15), messaging, use-auth, top-nav, mobile-bar, hero-section, hw-button, post-form.

**Notes:**
- Session 25 QA: realtime/design-token/role-aware changes initially broke 2 web tests (`top-nav`, `mobile-bar`) because accessible names for the profile/post controls had been renamed. Fixed by restoring stable labels (`Profile`, `Post property`) while keeping role-aware `href`/visibility; web suite then green.
- E2E must be run from `apps/web` (`npx playwright test`) — root-level `npx playwright test` does not pick up the config correctly.
- Run typecheck only after `next build` finishes (`.next/types` race).
- `apps/web/next.config.js` loads the repo-root `.env` via dotenv (non-overriding) — shell/Vercel env stays authoritative.
- `NEXT_PUBLIC_REALTIME_ENABLED` defaults to false; realtime sockets are intentionally not exercised in CI.

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
| 2026-10-20 | — | 0 | execute-feature Session 24: no unit tests needed (only file change: `migrations/meta/_journal.json` `when` value — no source code). QA = live DB verification: migrations 0000–0005 applied via pooler, journal 6/6, 31 tables intact, all 5 seed users' `passwordHash` backfilled (0005). Pre-flight `db:seed:backup` attempted, failed on then-unreachable DB; reconciled by destructive-SQL scan (none) + row/table-count parity post-run |
| 2026-10-20 | 328 | 0 | execute-feature Session 25: API 173/173 (18 files), web 155/155 (21 files); typecheck 4/4, lint 4/4 (0 warnings), `next build` 38/38 pages; E2E not run |
