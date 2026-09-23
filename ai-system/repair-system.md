# Repair System — Error Knowledge Base

> **Metadata**
> - last-updated-by: fix-build
> - last-verified-against-code: 2026-09-23
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
