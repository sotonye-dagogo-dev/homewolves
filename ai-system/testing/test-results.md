# Test Results

> **Metadata**
> - last-updated-by: fix-build
> - last-verified-against-code: 2026-09-23
> - staleness-policy: overwritten on every test run — always current

> **Overview:** Latest test run results. Updated by agents after running tests. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-09-23
**Run by:** fix-build

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| API unit (vitest, @hw/api) | 159 | 0 | 0 |
| Web unit/component (vitest, @hw/web) | 153 | 0 | 0 |
| E2E (Playwright, @hw/web) | 22 | 0 | 0 |

**Overall Status:** Green — `npm test` (312 tests), `npm run lint` (3 pre-existing warnings: no-console in api/main.ts, empty blocks in sitemap.ts + messaging.ts), `npm run typecheck` 4/4, full E2E 22/22 from `apps/web` (`npx playwright test`).

**API unit test files (17):** including auth, listing, rate-limit, sms, storage, docuseal, health + app.e2e.spec.
**Web unit test files (21):** including property-filters (21 tests), auth-local (15), messaging, use-auth, top-nav, mobile-bar, hero-section, hw-button, post-form.
**E2E spec files (6):** smoke, guest, auth, agent-dashboard, admin-journey, transaction-stepper.

**Notes:**
- E2E must be run from `apps/web` (`npx playwright test`) — root-level `npx playwright test` does not pick up the config correctly.
- Hero search converted to native form (progressive enhancement) so Enter works pre-hydration.
- Auth page GSI container split fixed PublicErrorBoundary crash.

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
