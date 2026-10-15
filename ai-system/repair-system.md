# Repair System — Error Knowledge Base

> **Metadata**
> - last-updated-by: execute-feature-session-21
> - last-verified-against-code: 2026-10-15
> - staleness-policy: individual entries may be stale if the code has changed around them — verify fix still applies before reusing

> **Overview:** Living knowledge base of errors encountered during development, their root causes, and how they were fixed. Agents must search this before diagnosing new errors and log every fixed bug to prevent recurrence.

---

## How to Use

- **Before debugging:** Search this file for patterns matching the current error
- **After fixing a bug:** Add an entry using the template below
- **If a fix no longer applies:** Mark the entry as `[SUPERSEDED]` and link to the new entry

---

## Error Log

### [TEMPLATE]

```
## [Error Title]

**Symptom:**
[What the developer or user sees]

**Root Cause:**
[The actual technical reason]

**Fix Applied:**
[What change was made]

**Prevention:**
[How to avoid this in future]

**Files Affected:**
[list of files]

**Date:** [YYYY-MM-DD]
**Status:** [Active / Superseded]
```

---

## Resolved Errors Archive

### Navbar search icon duplicates properties search

**Symptom:** Navbar and properties hero both show an active-looking search, confusing users.
**Root Cause:** `top-nav.tsx` and `mobile-bar.tsx` each rendered their own search entry alongside the hero search.
**Fix Applied:** Removed search UI from `top-nav.tsx` and `mobile-bar.tsx`; only the hero search remains.
**Prevention:** Single search surface — smoke test asserts nav textbox count is 0.
**Files Affected:** `apps/web/components/landing/top-nav.tsx`, `apps/web/components/landing/mobile-bar.tsx`
**Date:** 2026-09-23
**Status:** Active

### Runtime errors: null.get / filter is not a function / React #310

**Symptom:** `TypeError: Cannot read properties of null (reading 'get')`, `C.filter is not a function`, React #310 "Rendered more hooks than during the previous render".
**Root Cause:** Messaging/notification helpers assumed arrays; API sometimes returned `null`/objects. No single conditional-hook source identified for #310 (defensive hydration fix covers the common path).
**Fix Applied:** `toArray` normalizer in `lib/messaging.ts`; `Array.isArray` guards on dashboard/messages/notification consumers; `use-auth.ts` always sets `hydrated:true` in `onRehydrateStorage`.
**Prevention:** Normalize API payloads at the boundary; never assume array shape from untyped fetches.
**Files Affected:** `apps/web/lib/messaging.ts`, `apps/web/app/(public)/messages/page.tsx`, `apps/web/hooks/use-notifications.ts`, `apps/web/hooks/use-auth.ts`
**Date:** 2026-09-23
**Status:** Active

### Unauthenticated dashboard infinite loading

**Symptom:** Guest visiting `/profile` → `/dashboard/client` sticks on "Loading dashboard..." forever.
**Root Cause:** `hydrated` stayed false when no token existed, so the redirect never fired.
**Fix Applied:** Always set `hydrated:true` after rehydration; `(dashboard)/layout.tsx` redirects to `/auth?redirect=<pathname>` with a 3s safety timeout.
**Prevention:** Auth gates must handle the "no session" path explicitly, not only the "session loading" path.
**Files Affected:** `apps/web/hooks/use-auth.ts`, `apps/web/app/(dashboard)/layout.tsx`
**Date:** 2026-09-23
**Status:** Active

### Email auth 502 API not configured

**Symptom:** `POST /api/v1/auth/register` returns 502; client shows "API not configured".
**Root Cause:** No NestJS API deployed (`backendOrigin()` null); web had no local auth fallback.
**Fix Applied:** Server-side local auth at `app/api/v1/auth/[action]/route.ts` + `lib/server/auth-local.ts` (HS256 JWT, HMAC OTP cookie, Resend when configured); proxies to API when `backendOrigin()` is set. API `verifyOtp` auto-creates missing users; `jwtSecret()` no longer lets empty string bypass dev fallback.
**Prevention:** Local auth route must stay in front of catch-all; never rely on `secret ?? DEV` when secret can be `''`.
**Files Affected:** `apps/web/app/api/v1/auth/[action]/route.ts`, `apps/web/lib/server/auth-local.ts`, `packages/api/src/modules/auth/auth.service.ts`
**Date:** 2026-09-23
**Status:** Active

### Properties "All" filter renders zero results

**Symptom:** Selecting a filter then "All" shows 0 properties despite data existing.
**Root Cause:** Reset effect ran in wrong order relative to data fetch; `parseListingResponse` assumed array shape; pills and URL state desynced.
**Fix Applied:** New `lib/property-filters.ts` (URL↔pill helpers); properties page uses `appliedKeyRef` keyed on `activePill|debouncedSearch`, `Array.isArray`-safe parse, effect reorder; `FALLBACK_FILTER_PILLS` extended; `verified` param plumbed through listing service/controller.
**Prevention:** Key applied filters on a single serialized ref; always normalize list responses.
**Files Affected:** `apps/web/lib/property-filters.ts`, `apps/web/app/(public)/properties/page.tsx`, `packages/config/src/fallbacks.ts`, `packages/api/src/modules/listings/listing.service.ts`, `listing.controller.ts`
**Date:** 2026-09-23
**Status:** Active

### Google GSI renderButton crashes auth page (React removeChild NotFoundError)

**Symptom:** Auth page shows "Page error" (PublicErrorBoundary) on load/mount.
**Root Cause:** Google Identity Services `renderButton` mutates its container; React unmount of a placeholder button in the same node threw `NotFoundError: Failed to execute 'removeChild'`.
**Fix Applied:** Separate placeholder and `googleBtnRef` mount containers; `googleRenderedRef` guards double `renderButton`.
**Prevention:** Never let a third-party imperative library own the same DOM node React renders into.
**Files Affected:** `apps/web/app/(public)/auth/page.tsx`
**Date:** 2026-09-23
**Status:** Active

### E2E smoke: hero search Enter does not navigate

**Symptom:** `smoke.spec.ts` "hero search box navigates to properties page" fills and presses Enter but URL stays `/`.
**Root Cause:** Hero search was a `div` with only client `onKeyDown`/`onClick` — no native form action, so navigation required hydrated React handlers (race under Playwright).
**Fix Applied:** Converted hero search to a real `<form method="GET" action="/properties">` with `name="search"` input + `type="submit"` button; `onSubmit` preventDefault + `router.push` for SPA nav when hydrated.
**Prevention:** Progressive enhancement — search UIs should work as plain forms before JS hydrates.
**Files Affected:** `apps/web/components/landing/hero-section.tsx`
**Date:** 2026-09-23
**Status:** Active

### Vercel build: Module not found Can't resolve 'postgres'

**Symptom:** Vercel `next build` fails compiling `./app/api/v1/auth/[action]/route.ts` with `Module not found: Can't resolve 'postgres'`.
**Root Cause:** Auth route dynamically imports `postgres` for local DB access, but `postgres` was only a root/`@hw/api` dependency — not declared on `@hw/web`. Webpack (Vercel) could not resolve it from the app package graph; local resolve succeeded only via root hoisting.
**Fix Applied:** Added `postgres` to `apps/web/package.json` dependencies (+ lockfile); set `experimental.serverComponentsExternalPackages: ['postgres']` in `next.config.js` so the driver stays a runtime external rather than a bundled client module.
**Prevention:** Any package imported by `apps/web` must be listed in that package's `dependencies` (not only root/api). Prefer `serverComponentsExternalPackages` for native/DB drivers.
**Files Affected:** `apps/web/package.json`, `apps/web/next.config.js`, `package-lock.json`, `apps/web/app/api/v1/auth/[action]/route.ts` (importer)
**Date:** 2026-09-23
**Status:** Active

### Typecheck race with fresh Next build (.next/types missing)

**Symptom:** `tsc --noEmit` reports TS6053 for many `apps/web/.next/types/**/*.ts` files immediately after/during `next build`.
**Root Cause:** Typecheck ran against a `.next/types` tree that was mid-regeneration or incomplete when the build had not finished writing route types.
**Fix Applied:** Re-run typecheck after `next build` completes — not a product defect. Sequential: build → typecheck → lint.
**Prevention:** Do not parallelize `typecheck` with `next build` on the same workspace; always finish build first when `.next/types` is included by tsconfig.
**Files Affected:** `apps/web/tsconfig.json` (include), `.next/types` (generated)
**Date:** 2026-09-23
**Status:** Active

### Turborepo v2 Pipeline Key Renamed

**Symptom:** `turbo run` errors because `pipeline` is not a valid top-level key.
**Root Cause:** Turborepo v2 renamed `pipeline` → `tasks` in `turbo.json`.
**Fix Applied:** Renamed the `pipeline` key to `tasks` in `turbo.json`.
**Prevention:** Use `tasks` for Turborepo v2+; check turbo version before assuming the old key.
**Files Affected:** `turbo.json`
**Date:** 2026-06-10
**Status:** Active

### Build Blocker: Lint/Format Errors in Web App

**Symptom:** `npm run build` fails in `apps/web` on lint errors (unused imports, empty `catch {}` blocks, inline styles).
**Root Cause:** Files committed with lint-level issues — unused `HwButton` import in footer, empty catch blocks, console statements in messaging client, inline styles on agent listings page.
**Fix Applied:** Removed unused import, replaced empty `catch {}` with explicit no-op handling, removed console noise, converted inline styles to tokenized classes.
**Prevention:** Run `npm run lint` + `npm run typecheck` before declaring web changes complete.
**Files Affected:** `apps/web/components/landing/footer.tsx`, `apps/web/app/(public)/auth/page.tsx`, `apps/web/app/(dashboard)/dashboard/agent/listings/page.tsx`, `apps/web/lib/notifications.ts`, `apps/web/lib/messaging.ts`
**Date:** 2026-06-16
**Status:** Active

### Next.js SWC Lockfile Patch Warning (non-blocking)

**Symptom:** `next build` prints a lockfile patch warning (`ENOWORKSPACES` / SWC dependency patching) during dependency checks.
**Root Cause:** Workspace hoisting interacts with Next SWC package patching in npm workspaces.
**Fix Applied:** None required — the build completes successfully; the warning is environmental.
**Prevention:** Reinstalling dependencies in the workspace (`npm install`) may clear it if it ever becomes a blocker.
**Date:** 2026-06-16
**Status:** Active

---

## Known Error Patterns

### React / Next.js

**Hydration Mismatch**
- Symptom: `Hydration failed because the initial UI does not match what was rendered on the server`
- Cause: Browser-only logic (window, localStorage, Date.now()) running during server render
- Fix: Wrap in `useEffect` or use `dynamic(() => import(...), { ssr: false })`
- Prevention: Never access browser APIs outside useEffect in components

**Missing Key Prop**
- Symptom: `Each child in a list should have a unique "key" prop`
- Cause: `.map()` rendering without a stable unique key
- Fix: Add `key={item.id}` — use a stable unique ID, not the array index

### Design Token / CSS Variable Usage

**Hardcoded Tailwind Color Classes Instead of CSS Variables**
- Symptom: Components use raw Tailwind utilities like `text-emerald-600`, `bg-amber-100` etc. instead of `var(--color-*)`
- Cause: Rapid feature development using Tailwind shorthand instead of Homewolves design tokens
- Fix: Replace `className="text-emerald-600"` with `var(--color-*)` references
- Prevention: Always use `var(--color-*)` CSS variables for any color. Never use raw Tailwind color names.

**Missing `@keyframes` for Design Animations**
- Symptom: Design specifies `animation: celebrate-pulse` but component uses generic `animate-pulse`
- Cause: Custom animation keyframes not ported to globals.css
- Fix: Add `@keyframes` block to `globals.css` and reference by name
- Prevention: When implementing a design with custom animations, create a matching `@keyframes` in `globals.css`

### Node.js / NestJS Backend

**Prisma Client Stale for New Models**
- Symptom: TypeScript errors or missing models on new Prisma schema models
- Cause: New models added to `schema.prisma` without regenerating the Prisma client
- Fix: Run `npx prisma generate` (requires a placeholder `DATABASE_URL` — no live DB needed). The client is regenerated as of 2026-08-10; `(this.prisma as any)` casts have been removed from services.
- Prevention: Regenerate the client after every schema change; track in task queue. Do not reintroduce `as any` casts on Prisma access.

**Unhandled Promise Rejection**
- Symptom: Server crashes silently or logs `UnhandledPromiseRejectionWarning`
- Cause: async function missing try/catch or `.catch()` not attached to promise
- Fix: Wrap async route handlers in try/catch; use a global async error wrapper
- Prevention: Always release DB connections in finally, not just success path

**Database Connection Pool Exhausted**
- Symptom: Requests hang indefinitely under load
- Cause: Connection pool limit too low or connections not released
- Fix: Increase pool size; ensure `client.release()` in finally blocks
- Prevention: Always release connections in finally

### Configuration / Environment

**Missing Environment Variable**
- Symptom: `undefined` values in production, features silently broken
- Cause: Variable defined in `.env.local` but not in production environment
- Fix: Add to deployment environment variables
- Prevention: Add a startup validation check that throws if required env vars are missing

### Register-Password 500 persists after migrations — passwordHash had schema but no migration SQL (Session 20c, 2026-10-14)

**Symptom:**
`POST /api/v1/auth/register-password → 500` persisted in production even after the operator ran drizzle migrations and confirmed they applied.

**Root Cause:**
`passwordHash` existed in `packages/api/src/drizzle/schema.ts` but in none of the migration SQL files (`0000`–`0003`); `0003` only added `BugReport` columns. Running `drizzle-kit migrate` therefore never created the column — the only thing creating it was the web fallback's runtime `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, whose failure was swallowed silently, so the subsequent INSERT kept failing with a 500 (`MISSING_PASSWORD_COLUMN`).

**Fix Applied:**
- Added migration `0004_stale_starjammers.sql` (`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" text;`) + `meta/0004_snapshot.json` + journal entry. Operator must run `drizzle-kit migrate` once more to materialize it.
- Hardened `handleRegisterPassword`: `ensureAuthColumns` now returns boolean + logs; INSERT retries once after re-ensuring columns; persistent column failure returns 503 `MISSING_PASSWORD_COLUMN` with an actionable hint instead of a generic 500.
- Added `isMissingColumnError()` helper (matches `passwordHash` / `column does not exist` / `undefined_column`).

**Prevention:**
Every schema.ts change must ship with a generated migration (`drizzle-kit generate`) in the same PR — verify with `grep <column> drizzle/migrations/*.sql` before merging. Never rely on runtime DDL as the sole column creator (pooled roles may lack DDL permission).

**Files Affected:**
`packages/api/drizzle/migrations/0004_stale_starjammers.sql` (new), `packages/api/drizzle/migrations/meta/0004_snapshot.json` (new), `packages/api/drizzle/migrations/meta/_journal.json`, `apps/web/app/api/v1/auth/[action]/route.ts`
**Date:** 2026-10-14
**Status:** Active

### Register-password 500, round 3 — pooler prepared-statements + seed NULL hashes + opaque errors (fix-build Session 20d, 2026-10-15)

**Symptom:**
`POST /api/v1/auth/register-password → 500` still reported in production after migrations 0000–0004 were confirmed applied; reporter also asked whether seed rows' NULL `passwordHash` values were the cause.

**Root Cause (three findings):**
1. Seed NULL hashes were a red herring for the 500: `login-password` already maps a missing hash to a clean 401 ("uses email-code sign-in…"), and `register-password` only touches new emails. Seed logins failed, but with 401s, not 500s.
2. Likely 500 source: the web fallback's `postgres()` client used default prepared statements with no TLS handling — Supabase poolers (port 6543, pgbouncer transaction mode) reject prepared statements, so every query (starting with the email lookup → `DB_LOOKUP_FAILED` 500) fails. Prior logging printed raw driver objects with no code/message extraction, making this invisible in Vercel logs.
3. Unique-violation races (duplicate phone/identifier) and any unexpected throw surfaced as misleading codes (503 `MISSING_PASSWORD_COLUMN`) or opaque HTML 500s outside the JSON envelope.

**Fix Applied:**
- `pgOptionsFor()` in `apps/web/app/api/v1/auth/[action]/route.ts`: `prepare: false` by default (opt back in via `PG_PREPARE=true`), `ssl: 'require'` for non-local hosts (opt out via `PG_SSL=disable`/`?sslmode=disable`). Serverless/pooler-safe, config-driven.
- `logDbError()` sanitized logger (driver code + message, never secrets) on all auth DB paths; `POST` router wrapped in an outer try/catch returning structured `{ message, code: 'UNEXPECTED' }` JSON — no more opaque HTML 500s.
- `isUniqueViolationError()` (PG `23505`): duplicate registration races now return 409 `EMAIL_CONFLICT`, never the misleading 503.
- Seed accounts gain `passwordHash` (`SEED_USER_PASSWORD_HASH`, scrypt hash of demo password `Homewolves123!`): `seed.data.ts` sets it on `SEED_USERS`, `seed.ts` backfills NULLs only (never overwrites), migration `0005_wild_hellion.sql` backfills existing DBs (+ snapshot + journal).

**Prevention:**
Pooler-hosted Postgres must use `prepare: false` + TLS in serverless routes; every auth failure path must return a coded JSON response and a greppable log line. Seed/demo credentials stay in `seed.data.ts` with rotation notes, never for real users.

**Files Affected:**
`apps/web/app/api/v1/auth/[action]/route.ts`, `packages/api/drizzle/seed.data.ts`, `packages/api/drizzle/seed.ts`, `packages/api/drizzle/migrations/0005_wild_hellion.sql` (new), `packages/api/drizzle/migrations/meta/0005_snapshot.json` (new), `packages/api/drizzle/migrations/meta/_journal.json`
**Date:** 2026-10-15
**Status:** Active

### White-on-white input/select text in dark theme — hardcoded #FFFFFF backgrounds (Session 20c, 2026-10-14)

**Symptom:**
Most inputs showed a white background with white (invisible) text; select boxes likewise, while native dropdown options rendered with a dark background and legible text.

**Root Cause:**
Fields paired theme-aware text (`color: var(--color-text-primary)` → near-white in dark theme) with hardcoded white surfaces (`backgroundColor: '#FFFFFF'`, `bg-white`). In dark theme this is white-on-white. The global baseline only enforced `color`, not `background-color`, so raw fields inherited the mismatch; `HwInput/HwSelect/HwTextarea` additionally forced `colorScheme: 'light'`, fighting the dark-theme `color-scheme`. (Options looked fine because the baseline already forced opaque token backgrounds on `option`.)

**Fix Applied:**
- `form-field-config.ts` gains `FORM_FIELD_SURFACE_STYLE` (`color: var(--color-text-primary)` + `background: var(--color-bg-input)`); auth + advertise pages consume it instead of `#FFFFFF`.
- `globals.css` baseline now also sets `background-color: var(--color-bg-input)` on `input/select/textarea` (element selector — utility classes still override).
- Removed forced `colorScheme: 'light'` from Hw* wrappers (caller `style` still passes through); `color-scheme` is now driven by `[data-theme]` CSS.
- `products`/`services` search labels + selects: `bg-white` → `bg-[var(--color-bg-input)]`.

**Prevention:**
Never hardcode `#FFFFFF`/`bg-white` on a form surface — use `FORM_FIELD_SURFACE_STYLE` or `bg-[var(--color-bg-input)]`. Token-mixing rule: if `color` comes from a theme token, `background` must come from one too.

**Files Affected:**
`apps/web/components/ui/form-field-config.ts`, `apps/web/components/ui/hw-input.tsx`, `hw-select.tsx`, `hw-textarea.tsx`, `apps/web/app/globals.css`, `apps/web/app/(public)/auth/page.tsx`, `apps/web/app/(public)/advertise/page.tsx`, `apps/web/app/(public)/products/page.tsx`, `apps/web/app/(public)/services/page.tsx`
**Date:** 2026-10-14
**Status:** Active

### Vercel build log truncates after `Running "npm run vercel-build"` — migrate hang (Session 21, 2026-10-15)

**Symptom:**
`vercel build` (CLI 62.7.0, Turbo detected, `npm install` ok, Next 14.2.35 detected) prints `Running "npm run vercel-build"` then nothing — no error, no further lines. Local `npm run vercel-build` is green (38 pages).

**Root Cause:**
`scripts/vercel-build.mjs` ran `drizzle-kit migrate` via blocking `spawnSync` with no timeout. When build-time `DATABASE_URL` points at an unreachable DB (Supabase pooler/DNS hang rather than fast DNS fail), the child hangs indefinitely and the Vercel log stalls. Each build also paid an `npx --yes` registry fetch for `drizzle-kit`/`turbo` (`turbo@x will be installed` in logs).

**Fix Applied:**
- 60s migrate timeout (`VERCEL_MIGRATE_TIMEOUT_MS`, `SIGKILL`) with fail-soft continue to the web build (auth routes self-heal at request time).
- `SKIP_DB_MIGRATE`/`SKIP_MIGRATIONS` escape hatch; skip when `DATABASE_URL` is empty or not a postgres URL.
- Prefer repo-local `node_modules/.bin/drizzle-kit` and `node_modules/.bin/turbo` over `npx --yes`.
- Post-build check verifies `apps/web/.next` and logs Root-Directory guidance (repo root/empty) so the old doubled-path `apps/web/apps/web/.next` misconfiguration surfaces explicitly.
- Documented `SKIP_DB_MIGRATE`/`VERCEL_MIGRATE_TIMEOUT_MS` in `.env.example`.

**Prevention:**
Never add an unbounded network call to the build path — every build-time network step gets a timeout, a skip flag, and a log line stating both.

**Files Affected:**
`scripts/vercel-build.mjs`, `.env.example`
**Date:** 2026-10-15
**Status:** Active

### Vercel `Missing script: "vercel-build"` in @hw/web — dashboard Root is apps/web (Session 22, 2026-10-15)

**Symptom:**
`vercel build` prints `Running "npm run vercel-build"` then fails immediately:
`npm error workspace @hw/web@1.0.0 / location /vercel/path0/apps/web / Missing script: "vercel-build"`.
(Session 21 had assumed Root = repo root because the command *started*; this error proves the dashboard Root Directory is `apps/web`, so npm resolves scripts from `apps/web/package.json`, where `vercel-build` did not exist.)

**Root Cause:**
`vercel-build` existed only at the repo root (`node scripts/vercel-build.mjs`), but Vercel runs the `vercel.json` buildCommand with cwd = dashboard Root (`apps/web`). Additionally `scripts/vercel-build.mjs` assumed `process.cwd()` is the repo root for binary resolution, drizzle config path, turbo invocation, and the `.next` output check (which would have produced the doubled `apps/web/apps/web/.next` path from cwd `apps/web`).

**Fix Applied:**
- Added `"vercel-build": "next build"` to `apps/web/package.json` — the build now succeeds regardless of Root Directory (repo root → root script with migrate + turbo; `apps/web` → direct `next build`).
- Hardened `scripts/vercel-build.mjs` with `findRepoRoot()` (walks up to `turbo.json`, falls back to script-relative path); all binary resolution, drizzle `cwd`, turbo `cwd`, and the `.next` output check use `REPO_ROOT` instead of `process.cwd()`.

**Prevention:**
Every root-level build/deploy script referenced by `vercel.json` must also exist on the workspace package Vercel may use as Root — verify with `npm run --workspace=@hw/web <script>`. Build scripts must never assume `process.cwd()` is the repo root; resolve it by walking up to a marker file (`turbo.json`).

**Files Affected:**
`apps/web/package.json`, `scripts/vercel-build.mjs`
**Date:** 2026-10-15
**Status:** Active
