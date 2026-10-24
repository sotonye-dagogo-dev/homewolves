# Test Results

> **Metadata**
> - last-updated-by: execute-feature-session-30
> - last-verified-against-code: 2026-10-24
> - staleness-policy: overwritten on every test run — always current

> **Overview:** Latest test run results. Updated by agents after running tests. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-10-24
**Run by:** execute-feature (Session 30 — QA gate)

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| API unit (vitest, @hw/api) | not run (last known 180) | — | — |
| Web unit/component (vitest, @hw/web) | 197 | 0 | 0 |
| E2E (Playwright, @hw/web) | not run | — | — |
| Web production build (`next build`) | 48 routes | 0 | — |

**Overall Status:** Green — web 197/197 (26 files, +9 `lib/server/messaging-local` tests), `npm run typecheck` 4/4 (0 TS errors), `npm run lint --workspace=@hw/web` clean, `npm run build --workspace=@hw/web` 48 routes incl. `ƒ /api/v1/messaging/[...path]`. API unit suite untouched in Session 30 (last known 180/180, 19 files).

**API unit test files (19, last run Session 27):** including auth, listing, rate-limit, sms, storage, docuseal, health, app.e2e.spec, `messaging.service.spec.ts` + `drizzle/seed.backup.spec.ts`.
**Web unit test files (26):** including property-filters, auth-local, messaging (+ `lib/server/messaging-local.test.ts` ×9), use-auth, top-nav, mobile-bar, hero-section, hw-button, post-form, footer, design-tokens, `lib/map/config.test.ts`, `components/map/hw-map.test.tsx`.

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
| 2026-10-21 | 345 | 0 | execute-feature Session 26: api 173/173 (18 files), web 172/172 (23 files — +17 map tests: `lib/map/config.test.ts` 11, `components/map/hw-map.test.tsx` 6); typecheck 4/4, lint 4/4 (0 warnings), `next build` 47 routes green; E2E not run |
| 2026-10-24 | 197 | 0 | execute-feature Session 30: web 197/197 (26 files — +9 `lib/server/messaging-local` tests); turbo typecheck 4/4, web lint clean, `next build` 48 routes incl. `/api/v1/messaging/[...path]`; API suite not run; E2E not run |
