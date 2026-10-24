# Development History

> **Metadata**
>
> - last-updated-by: execute-feature-session-27
> - last-verified-against-code: 2026-10-24
> - staleness-policy: historical entries do not go stale

> **Overview:** Chronological log of completed development work. Each sprint ends with a summary entry. Agents add entries after completing tasks. Useful for understanding what has been built, when decisions were made, and what patterns have emerged.

---

## Entry Format

```
## [Date] — [Sprint or Session Title]

**Summary:**
[2-4 sentence overview of what was accomplished]

**Completed:**
- [task 1]
- [task 2]

**Key Changes:**
- [important architectural or behavioural change]

**Next Sprint Focus:**
[What comes next]
```

---

## History

---

## 2026-06-09 — Project Bootstrap

**Summary:**
Homewolves development begins. The v1 `.ai-system/` documentation structure was fully populated with project-specific content derived from DESIGN.md and ROADMAP.md. Design HTML exports (12 screens) complete. Zero application code.

**Completed:**

- Architecture documented — modular monolith, Turborepo, Next.js + NestJS + PostgreSQL
- Design system documented from DESIGN.md
- Task queue and project plan seeded from ROADMAP §9

**Key Changes:**

- Architectural foundations documented: metadata-driven UI, OOP domain model, audit-by-default, RBAC, Hw* wrapper pattern, global types

**Next Sprint Focus:**
Monorepo scaffolding.

---

## 2026-06-10 — Sprint 1: Core Marketplace MVP

**Summary:**
Complete MVP scaffolding and all core features: Turborepo monorepo, NestJS + Next.js apps, Prisma schema, auth flow, listing CRUD, public feed with infinite scroll, property detail page, recently viewed, and save/favorite system.

**Completed:**

- Turborepo monorepo initialized
- `packages/types/` — global zero-import types
- `apps/web/` — Next.js 14 App Router, design tokens in globals.css
- `packages/api/` — NestJS with PrismaModule, AuditService, PlatformConfigService, RbacGuard
- PlatformConfig metadata-driven system
- Authentication — JWT register/login/verifyOtp/refresh/logout
- Listing CRUD — 5-step form, dashboard, agent listing management
- Public Feed & Search — /properties, filter pills, grid/list/map, infinite scroll
- Property Detail — 11 zones, recently viewed, save toggle

**Key Changes:**

- Global TypeScript zero-import pattern established
- Metadata-driven UI with Redis + fallback chain
- Audit by default on all mutations

**Next Sprint Focus:**
Sprint 2 — Agent CRM, dashboard bento grid, real-time messaging, notifications.

---

## 2026-06-10 — Sprint 2: Agent & Communication

**Summary:**
Built agent CRM backend + frontend, bento grid agent dashboard, real-time messaging with Socket.io, and notification pipeline.

**Completed:**

- CRM module — Client, Note, Rating, Inspection models + CRUD + dashboard stats
- Agent Dashboard — 8-cell bento grid matching agent-dashboard.html
- Real-time Messaging — Socket.io gateway, /messages two-pane layout
- Notification system — NotificationsModule, in-app WebSocket dispatch
- Price Drop & Match Alerts — AlertsModule integrated into ListingService

**Key Changes:**

- Socket.io gateway on /ws namespace shared by messaging and notifications

**Next Sprint Focus:**
Sprint 3 — Transaction deal stepper, payment evidence, activity points, admin moderation, blog.

---

## 2026-06-10 — Sprint 3: Transactions & Client Portal

**Summary:**
Complete client portal and deal lifecycle: transaction stepper, payment evidence with admin review, activity points gamification, admin listing moderation, and CMS-driven blog.

**Completed:**

- Transaction module — 5-step deal lifecycle with role-based transitions
- Payment evidence upload + admin approval workflow
- Activity Points system — 9 rules, tier system, leaderboard
- Admin listing moderation queue
- Blog module — BlogPost model, /blog list + detail magazine layout
- Role-aware dashboard sidebar

**Key Changes:**

- 4 new Prisma models: ActivityRule, AgentActivity, AgentPoints, BlogPost
- 3 new backend modules: TransactionsModule, ActivityModule, BlogModule

**Next Sprint Focus:**
Sprint 3 complete. Proceed to Backlog or Phase 2.

---

## 2026-06-16 — Navigation Audit and Route Repairs

**Summary:**
Audited the web app for dead navigation paths and inert CTAs. Rewired landing interactions to real routes and added missing public routes.

**Completed:**

- Wired landing CTAs and hero search into app routes
- Converted mobile bar to route-based navigation
- Added missing public routes (About, Contact, FAQ, Privacy, Terms)

**Next Sprint Focus:**
Continue audit for placeholder interactions; inline-style cleanup.

---

## 2026-06-16 — Build Repair Pass

**Summary:**
Resolved lint/format issues blocking `npm run build`. Build now completes green.

**Completed:**

- Removed unused footer import
- Replaced empty catch blocks
- Removed console noise from websocket client
- Converted agent listings page off inline styles

**Next Sprint Focus:**
Address SWC lockfile warning or proceed with feature work.

---

## 2026-08-05 — v2 ai-system Migration

**Summary:**
Upgraded the development system from v1 `.ai-system/` to the v2 `ai-system/` framework and bootstrapped it to the current project state.

**Completed:**

- Installed v2 framework (protocols, agents, commands, standards, planning, memory, index, testing, checkpoints, summaries)
- Migrated all project content into the new structure
- Preserved design assets and docs inside `ai-system/designs/` + `ai-system/docs/`
- Updated root `ai-context.md`
- Removed the outdated `.ai-system/` directory

**Key Changes:**

- Vendor-neutral, function-based roles (no tool names)
- Mandatory 9-criterion quality gate
- Interruption-safe checkpoints (`in-progress.md` + `resume-session.md`)
- Freshness metadata on every doc

**Next Sprint Focus:**
Prisma regeneration, security/testing/SEO hardening, and Backlog items (WhatsApp, analytics, Expo parity).

---

## 2026-08-10 — Prisma Client Regeneration

**Summary:**
Regenerated the Prisma Client so the Phase 3 models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) are fully typed instead of being accessed through `(this.prisma as any)` casts.

**Completed:**

- Fixed schema: added 7 missing opposite-relation fields (User→agentActivities/agentPoints/blogPosts, Listing→inspections, Transaction→signatureRequests, TransactionDocument→signatureRequests, Subscription↔SubscriptionPlan) that were blocking `prisma validate`
- Regenerated Prisma Client (v5.22.0); new models now typed
- Removed all `(this.prisma as any)` and `db(prisma as any)` casts across 11 services; `db()` helper now returns the typed client
- Fixed type errors surfaced by the typed client (JSON metadata casts, `Notification` type collision in notifications service/gateway, `plan.features` JSON cast)

**Key Changes:**

- `Subscription.plan` relation added to schema — the service already used `include: { plan: true }`, so the relation was intended but missing
- Remaining `as any` casts in services are limited to Prisma `Json` field access (locationJson, preferences, stepsJson) — legitimate JSON payload typing, not stale-client workarounds

**Next Sprint Focus:**
Security pass (REST route guards, rate limiting, input validation), then testing setup.

---

## 2026-08-10 — API Security Pass

**Summary:**
Completed the security pass across all 15 REST controllers: fixed an authentication identity bug, added role-based access control to privileged routes, introduced zod input validation on every DTO, added global rate limiting, and closed unguarded-endpoint gaps.

**Completed:**

- **Identity bug fixed:** `JwtStrategy` returned `{ id, email, role }` but controllers read `req.user.sub` → `sub` was `undefined` on every authenticated request. Strategy now returns `sub` (plus `id` for the notifications controller).
- **RBAC:** New `@Roles(...)` decorator + `RolesGuard` enforced on `listings/admin/pending`, `listings/:id/moderate`, audit (all), config `PUT`, blog mutations, activity `seed`, and transactions `payments/pending`. `platform-config PUT` was previously completely unguarded.
- **Input validation:** New `ZodValidationPipe` + zod schemas for every DTO (auth, listings, transactions, crm, notifications, blog, documents, signatures, subscriptions, messaging, config, recently-viewed) plus inline bodies. Rejects unknown keys (`.strict()`) to prevent mass-assignment. Used the existing `zod` dependency — no new packages.
- **Rate limiting:** Global `RateLimitGuard` (in-memory sliding window, 120 req/min/IP default) registered as `APP_GUARD`; auth endpoints tightened to 10 req/min.
- **Guards added where missing:** `notifications` (was unauthenticated), `platform-config PUT`, `activity seed`, audit role restriction.
- **recently-viewed:** Server now derives `userId` from the JWT (`OptionalJwtGuard`) instead of trusting client-supplied `userId` (was spoofable). Web client updated to send the token.
- **messaging:** `createConversation` now always adds the caller as a participant.
- **GlobalExceptionFilter** wired globally in `main.ts`.
- **Webhook bodies** (subscriptions, signatures) now shape-validated via zod.

**Key Changes:**

- `packages/types/src` generated build artifacts (`.js`/`.d.ts`/`.map`) gitignored + untracked — they regenerate on API builds and reference `@prisma/client`; `global.d.ts` stays tracked.
- `req.user.sub` is now the canonical authenticated-user id across the API.

**Next Sprint Focus:**
Testing setup ([L] task), then SEO, error handling, blog HTML sanitization.

---

## 2026-08-13 — Testing Setup

**Summary:**
Completed the [L] testing task: eliminated all `@hw/api` lint blockers, stood up a 187-test vitest suite (API service specs + web lib/component tests) and 16 Playwright E2E journeys, and passed the full QA gate (test/typecheck/build/lint).

**Completed:**

- **Lint blockers cleared** — `@hw/api` 104 `no-explicit-any` errors → 0 by typing `req` as `AuthenticatedRequest`/`MaybeAuthenticatedRequest` (new `common/types/request.types.ts` with `toActor()`), typed Prisma clauses, typed JSON casts. `@hw/types` lint fixed via `.eslintignore` for generated `.js`/`.d.ts` build artifacts.
- **API unit tests** — 8 new service specs (audit, platform-config, notifications, listing, transactions, crm, blog, auth) on top of the pre-existing referrals/activity specs → 93 tests across 10 files.
- **Web tests** — 7 new lib specs (listings, crm, blog, subscriptions, referrals, activity, notifications) + 2 new component specs (hw-card, hw-input) + hero-section landing test → 94 tests across 13 files.
- **E2E journeys** — guest, auth (register→OTP→profile), agent dashboard, transaction stepper; API stubbed via `page.route` since the Playwright webServer only boots the web app.
- **QA gate** — `npm test` (187), `npm run typecheck`, `npm run build`, `npm run lint` all green.

**Key Changes:**

- Test-driven fixes to real behavior: notifications `updatePreferences` now replaces (not merges) preferences; transaction `complete()` requires `currentStep >= steps.length`.
- Prisma client regenerated (was stale); `packages/types/.eslintignore` added.
- Remaining lint warnings: 3 `no-console` in `@hw/api` (intentional dev/stub logging).

**Next Sprint Focus:**
SEO, blog HTML sanitization, activity-points service wiring, API integration tests, E2E admin journey — see the open `[ ]` items at the top of `planning/task-queue.md`.

## 2026-08-13 — Prisma→Drizzle Migration + Web Audit Rectification

**Summary:**
Migrated `packages/api` from Prisma to Drizzle ORM end-to-end, then ran the `verify-work.md` web audit on `apps/web` and fixed its findings. Both packages green (typecheck/lint/tests/build).

**Completed:**

- **Drizzle schema** — `src/drizzle/schema.ts` (28 tables, 5 enums, relations, `ListingCategory` re-exported); `drizzle.config.ts` + `drizzle/seed.ts`; `DrizzleModule`/`DrizzleService` (`@Global`) with getter-based query chains; all services/DTOs/gateway ported. `@prisma/client` removed; `packages/api/prisma/` + `src/prisma/` deleted.
- **Migration** — `0000_faithful_moira_mactaggert.sql` generated offline via `npm run db:generate` (unapplied; no live DB in CI).
- **Specs** — 10 files / 93 tests rewritten against a shared Drizzle mock (`src/test/drizzle.mock.ts` with `createChain` thenable proxy + `createDrizzleMock`).
- **Web audit fixes** — CategoryBento dead cards → `next/link`s; properties page reads `search`+`category` URL params (fixed `for_sale`→`sale` categoryMap bug that silently broke "For Sale"); footer nav → `next/link`; dashboard notification dropdown rows clickable (mark one read + navigate); `useNotificationBell` exposes `markRead`; `loading.tsx` for `(public)`+`(dashboard)`; hero + landing cards use `next/image` (`images.unsplash.com` added to `remotePatterns`).

**Key Changes:**

- `packages/api/src/test/drizzle.mock.ts` is now the shared pattern for all service specs.
- Drizzle enum consts + query chains are the canonical DB access pattern (no generated client, no stale-client class of bugs).
- Web: navigation/linkability/dead-zone defects from the audit closed.

**Next Sprint Focus:**
Apply `0000` migration + seed on a live Supabase DB; then open `[ ]` items at the top of `planning/task-queue.md` ([M] SEO, [BUG] blog sanitization, [M] activity-points wiring, [M] API integration tests, [M] E2E admin journey). Follow-up `next/image` pass for dashboard/blog/auth dynamic media `<img>` tags.

---

## 2026-09-02 — Hardening: Routing/Icons/SEO/Env Parity (Session 10)

**Summary:**
Executed the `execute-feature` hardening pass against routing/icon/SEO/optimization/DB/auth/compliance drift. Unified canonical URL to `homewolves.com`, consolidated icons to `lucide-react`, hardened SEO metadata/sitemap, migrated gallery/feed to `next/image`, and aligned `.env.example` parity.

**Completed:**
- Routing/SEO: canonical `NEXT_PUBLIC_SITE_URL` → `homewolves.com`, `metadataBase`/`openGraph`/`twitter`/`canonical`/`viewport`, sitemap `take` clamped to 50
- Icons: 15 hand-drawn SVG/emoji → `lucide-react` (PropertyDetailClient, properties feed, dashboard layout, blog/not-found/error, pricing)
- Optimization: `next/image` for gallery/feed/similar/cover, `remotePatterns` extended for Supabase/Cloudinary
- Env parity: `.env.example` aligned to real `.env` (Supabase live keys, Resend, Paystack, DocuSeal, Redis, lockfile quirk)

**Next Sprint Focus:**
Full tightening directive — service wrappers, reversible seed, testing pyramid, project-wide audit.

---

## 2026-09-16 — Tightening Pass: Service Wrappers, Reversible Seed, Full Testing, Audit (Session 11)

**Summary:**
Hardened the platform end-to-end (XL directive): made all external services operational through dedicated wrappers with graceful degradation, rebuilt the seed system with deterministic `seed-` IDs and a reversible delete that leaves post-seed data untouched, closed audit gaps (error boundaries, redundant guards, deadends), and lifted the testing pyramid to 153 API + 100 web + 22 E2E.

**Completed:**
- **Service wrappers:** Added `SmsClient` (Termii, `isConfigured`, `send`/`sendOtp`, simulated fallback) + `StorageClient` (S3/R2, `upload`/`getPublicUrl`/`delete`, simulated fallback) per §17; added `HealthModule` (`GET /health` liveness + `GET /health/ready` readiness with DB + per-integration `configured` flags) and wired into `AppModule`/`IntegrationsModule (@Global)`. All wrappers expose `isConfigured` and never throw in dev when unconfigured.
- **Reversible seed:** New `drizzle/seed.data.ts` (deterministic `seed-` IDs for users/listings/media/blogPosts/activityRules, `SEED_MANIFEST` for keys/slugs) + `drizzle/seed.revert.ts` (FK-ordered delete only `LIKE 'seed-%'` / manifest keys, transactional, leaves post-seed rows intact). Rewrote `drizzle/seed.ts` to seed users, listings+media, blogPosts, activityRules, emailTemplates alongside existing config/plans; added CLI `--revert [--with-config] [--with-users]` and npm scripts `db:seed:revert` / `db:seed:revert:full`.
- **Audit/QA:** Added `(dashboard)/error.tsx` + `(public)/error.tsx` error boundaries (complements root `error.tsx`/`global-error.tsx`), deprecated `RbacGuard` (now alias to `RolesGuard` with deprecation notice), verified no `href="#"`, `TODO`/`FIXME` deadends, and no vendor SDK leakage outside wrappers. Pagination already via limit/offset in all services.
- **Testing:** New specs `sms.client.spec.ts` (6), `storage.client.spec.ts` (6), `health.service.spec.ts` (4), `drizzle.mock` `execute` + `app.e2e` health tests (2) → 153 API tests (was 135). Web 100 tests unchanged. `npm run typecheck` 4/4, `lint` 4/4, `build` 31 pages, `test` green.

**Key Changes:**
- `DrizzleService.execute` added (passthrough to `db.execute`) for health check + raw revert deletes.
- Seed is now idempotent (onConflict) and reversible — the first reversible seed in the project.
- Health endpoints are public (no auth) and provide the single management surface for wrapper status.

**Next Sprint Focus:**
Pick next Backlog item from `planning/task-queue.md` Up Next (WhatsApp integration, Analytics engine, Expo parity, PWA, Push notifications).

---

## 2026-09-23 — fix-build: Production Multi-Issue Repair (Session 17)

**Summary:**
Executed `fix-build.md` against nine production issues on homewolves.com: navbar search duplication, runtime array/null errors, unauth dashboard hang, Google OAuth env surface, email auth 502, config-driven filters/URL params, "All" filter zero results, and test coverage gaps. All fixes verified green: lint, typecheck 4/4, 159 API + 153 web unit tests, 22/22 E2E.

**Completed:**
- Removed navbar/mobile search duplication; array/hydration guards for messaging/dashboard/auth; unauth dashboard → `/auth?redirect=`
- Server-only Google OAuth (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`); GSI container split fixed auth page `removeChild` crash
- Local server-side email/OTP auth (`app/api/v1/auth/[action]` + `lib/server/auth-local.ts`) when NestJS API unreachable; API `verifyOtp` auto-create + `jwtSecret()` empty-string fix
- `lib/property-filters.ts` URL↔pill sync, `appliedKeyRef`, `Array.isArray`-safe parse, extended fallback pills, `verified` listing param
- Hero search converted to native form (progressive enhancement) fixing last E2E failure
- New unit tests (property-filters, auth-local, messaging, use-auth, top-nav, mobile-bar) + E2E selector/wait fixes

**Key Changes:**
- Email auth no longer depends solely on a deployed NestJS API (proxy when `backendOrigin()` set)
- Dashboard unauth behavior is redirect-to-auth (supersedes Session 12 CTA for path (3))
- Google client ID is no longer a `NEXT_PUBLIC_*` env var

**Next Sprint Focus:**
User deploy to verify live; set prod env (`JWT_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `RESEND_API_KEY`, `DATABASE_URL`/`API_ORIGIN`); then pick next Backlog item from `planning/task-queue.md` Up Next.

---

## 2026-09-23 — fix-build: Vercel `postgres` Module Not Found (Session 18)

**Summary:**
Vercel failed compiling Session 17's local auth route: webpack could not resolve `postgres` because it was not a direct `@hw/web` dependency. Declared `postgres` on the web package, marked it `serverComponentsExternalPackages`, and verified a full production build (33 pages) including `ƒ /api/v1/auth/[action]`.

**Completed:**
- Added `postgres@^3.4.9` to `apps/web/package.json` + lockfile
- `experimental.serverComponentsExternalPackages: ['postgres']` in `next.config.js`
- Verified `next build` green, typecheck 4/4, lint 4/4, auth-local tests 15/15
- Logged Module-not-found and `.next/types` typecheck race in `repair-system.md`

**Key Changes:**
- Web package now owns the Postgres driver used by server-side auth (no more root-only hoisting assumption).

**Next Sprint Focus:**
Push and redeploy on Vercel; confirm CI build passes.


---

## 2026-10-14 — execute-feature: Design-System + Nav/Menu Tightening (Session 19)

**Summary:**
Single-session hardening pass over branding, navigation, auth, CRUD, routing, error handling, and responsiveness. Stale hardcoded brand text replaced with config-driven `BrandLogo`/`useBrand`/`FALLBACK_BRAND` everywhere; dead buttons/links wired; null-safety guards added; QA fully green (web 153, api 159, typecheck clean, build 33 routes).

**Completed:**
- BrandLogo everywhere (top-nav, dashboard, admin, properties, detail, footer, metadata) with image-only + derived-initials fallback
- TopNav layout/overlap fix, auth avatar, role-aware MobileBar
- Auth JSON-safe errors, PKCE code exchange, redirect preservation
- New listing edit page closing the `/edit` 404; safe price formatting lib
- Toast/batch-bar/sticky-bar/notification responsive offsets; icon-library compliance

**Key Changes:**
- New modules: `apps/web/lib/format-price.ts`, `apps/web/app/(dashboard)/dashboard/agent/listings/[id]/edit/page.tsx`
- `useListings(params, { enabled })` signature extended (non-breaking optional param)
- `BrandLogo` gains optional `textClassName` prop (non-breaking)

**Next Sprint Focus:**
E2E + visual review; remaining minor debt ( Supabase `actions.ts` dead path, properties replace-loop hardening).

---

## 2026-10-14 — execute-feature: register-password 500 Fix + Form Contrast Audit (Session 20)

**Summary:**
Resolved the production `POST /api/v1/auth/register-password → 500` and audited every input/select/textarea for text legibility. The 500 was a masked config/schema failure (JWT-secret throw + missing `passwordHash` column collapsing into a generic catch); handlers now log structured errors and return split 400/409/503 codes. The audit found undefined CSS tokens (`--color-bg-input`, `--color-text-tertiary`, `--color-danger`) and transparent-glass fields causing invisible text; tokens are now defined per-theme with a global form baseline.

**Completed:**
- Web `auth/[action]` route: `node:crypto` `randomUUID` import (no global `crypto`), per-stage try/catch with `console.error` + `code` field (`DB_LOOKUP_FAILED`, `MISSING_PASSWORD_COLUMN`, `TOKEN_CONFIG`, …), JWT-config failures return 503 not 500
- Drizzle `users` gains nullable `passwordHash` (additive; documents the web fallback's runtime ALTER)
- Nest API gains `register-password` / `login-password` / `forgot-password` / `reset-password` routes + Zod DTOs + scrypt service methods (no new deps) so the same-origin proxy never 404s when a backend origin is configured
- `globals.css`: new tokens per theme + global `input/select/textarea/option/autofill/disabled/focus` contrast baseline
- New reusable `HwSelect`, `HwTextarea`, shared `form-field-config.ts` (`FALLBACK_FORM_FIELD`, `formFieldClassName`); `HwInput` reworked to solid high-contrast + `config`/`error` props (legacy `glass` kept, now implies pill radius)
- QA: web tsc clean, api tsc clean, web UI tests 21/21, api auth tests 21/21, eslint clean on touched UI files

**Key Changes:**
- New modules: `apps/web/components/ui/hw-select.tsx`, `hw-textarea.tsx`, `form-field-config.ts`
- Non-breaking: additive API routes/columns/props only; `HwInput` default visual shifts glass-pill → solid-rounded (intended legibility fix)
- Ops note: production still requires `JWT_SECRET` + `DATABASE_URL`; missing values now surface as 503 `TOKEN_CONFIG` / `Auth requires DATABASE_URL` with server logs instead of opaque 500s

**Next Sprint Focus:**
Deploy and verify live register-password; run `drizzle-kit` migration to materialize `passwordHash` on existing DBs; visual pass over dark-theme form surfaces.

## 2026-10-14 — fix-build: register-password 500 After Migrations + White-on-White Inputs (Session 20c)

**Summary:**
Follow-up to Session 20b: the register-password 500 persisted because `passwordHash` never had migration SQL, and form fields regressed to white-on-white where hardcoded white surfaces met theme-aware text. Both fixed with additive, config-driven changes.

**Completed:**
- Migration `0004_stale_starjammers.sql` + snapshot + journal for `User.passwordHash` (the actual missing piece behind "migrations applied but still 500")
- Register handler: boolean `ensureAuthColumns` with logging, single insert retry, 503 `MISSING_PASSWORD_COLUMN` with ops hint, `isMissingColumnError()` helper
- `FORM_FIELD_SURFACE_STYLE` shared constant; auth/advertise pages off hardcoded `#FFFFFF`; products/services off `bg-white`; baseline enforces token background; Hw* wrappers stop forcing light `colorScheme`
- QA: web tsc 0 errors, web UI 21/21, api auth 21/21 (vitest)

**Key Changes:**
- New: `packages/api/drizzle/migrations/0004_stale_starjammers.sql`, `meta/0004_snapshot.json`
- Rule: schema.ts change must ship with migration SQL in the same PR (`grep <column> drizzle/migrations/*.sql`); form surfaces must pair theme-token text with theme-token backgrounds

**Next Sprint Focus:**
Run migrate for 0004 in production and verify live register-password; dark-theme visual pass.

## 2026-10-15 — fix-build: register-password 500 Round 3 + Seed NULL Password Hashes (Session 20d)

**Summary:**
Third pass on the production `register-password → 500`: ruled out seed NULL hashes as the 500 cause (they produce 401s, not 500s), hardened the Postgres client for Supabase poolers (the likely real cause), made all auth failures coded + greppable, and gave seed accounts working password auth end-to-end.

**Completed:**
- `pgOptionsFor()`: pooler-safe `prepare: false` default (`PG_PREPARE=true` opt-in), `ssl: 'require'` for non-local hosts (`PG_SSL=disable` opt-out)
- `logDbError()` sanitized logging; outer `POST` guard returning coded JSON; `isUniqueViolationError()` → 409 instead of misleading 503
- `SEED_USER_PASSWORD_HASH` (verified scrypt roundtrip) on `SEED_USERS`; `seed.ts` NULL-only backfill; migration `0005_wild_hellion.sql` + snapshot + journal
- QA: npm install clean; web/api tsc 0 errors; web 155/155; api 159/159

**Key Changes:**
- New: `packages/api/drizzle/migrations/0005_wild_hellion.sql`, `meta/0005_snapshot.json`
- Rule: serverless Postgres clients default to `prepare: false` + TLS; auth routes never return uncoded 500s

**Next Sprint Focus:**
Run migrate for 0005 in production, confirm Vercel `DATABASE_URL`/`JWT_SECRET`, verify live register-password + seed password login.

## 2026-10-15 — execute-feature: Vercel build drizzle migrate + auth entry unblocked (Session 20e)

**Summary:**
Unblocked platform entry: Vercel builds now apply Drizzle migrations automatically, and auth no longer depends on reaching an external system — same-site (apex ↔ www) requests are handled locally with fallback, and missing-schema states return actionable 503s instead of opaque 500s.

**Completed:**
- `scripts/vercel-build.mjs` + `npm run vercel-build` + `vercel.json` buildCommand (migrate-then-build, skips gracefully without DATABASE_URL, never fails build on migrate error)
- Same-site proxy fix across web auth route, catch-all route, and next.config rewrites
- `tryProxy()` fallback (5xx → local handling) + 503 `DB_NOT_MIGRATED` for missing tables
- NestJS `DrizzleService` pooler-safe options + `GlobalExceptionFilter` 42703/42P01 → 503
- QA: web/api tsc 0 errors; web 155/155; api 159/159

**Key Changes:**
- New: `scripts/vercel-build.mjs`
- Rule: Vercel build applies `drizzle-kit migrate` when DATABASE_URL is present; auth routes treat apex/www as same-site and never self-proxy

**Next Sprint Focus:**
Verify live register-password after redeploy; remove build-time migrate later if an external DB workflow replaces it.

## 2026-10-15 — execute-feature: Vercel build stall hardened (Session 21)

**Summary:**
The `vercel build` log truncated right after `Running "npm run vercel-build"` with no error — the migrate step could hang indefinitely on an unreachable DB. Hardened the entrypoint so the build always progresses to the web build with actionable logs.

**Completed:**
- `scripts/vercel-build.mjs`: 60s migrate timeout (fail-soft), `SKIP_DB_MIGRATE` escape hatch, postgres-URL validation, repo-local binaries, post-build `apps/web/.next` verification
- `.env.example`: documented `SKIP_DB_MIGRATE`, `VERCEL_MIGRATE_TIMEOUT_MS`
- QA: vercel-build green (skip/no-DB/unreachable-DB modes, 38 pages), typecheck 4/4, tests green

**Key Changes:**
- Rule: build-time migrate is timeout-bounded and never stalls or fails the build; dashboard Root Directory must be the repo root (empty)

**Next Sprint Focus:**
Redeploy on Vercel and confirm `[vercel-build] ... Web build completed.` in the log; use `SKIP_DB_MIGRATE=1` as the emergency unblock while DB reachability is investigated.

## 2026-10-16 — execute-feature: Auth same-origin routing + seed backup/purge/restore (Session 23)

**Summary:**
Fixed the recurring seed-user sign-in failure (constant, near-instant 500) by making all browser `/auth/*` calls same-origin in every environment and loading the repo-root `.env` into the Next.js server runtime. Added full data protection to destructive seed operations: timestamped JSON backups before any revert/purge, a confirmation-gated full purge, and an idempotent restore — plus fixes for two seed-revert bugs (hidden user deletion, shared-key activityRules targeting).

**Completed:**
- `authApiBase()` same-origin auth routing (`lib/api-base.ts`, 12 `use-auth.ts` call sites, `google-auth.ts`)
- `next.config.js` dotenv load of repo-root `.env` (non-overriding; shell/Vercel env authoritative)
- `drizzle/table.registry.ts` (31 tables, FK-safe orders, seed-scope predicates) + `drizzle/seed.backup.ts` (collect/create/restore, versioned JSON, host-only provenance) + 14 specs
- `db:seed:backup` / `db:purge -- --yes` / `db:restore -- <file>` commands; revert/purge backup-first (backup failure aborts)
- Fixed `--with-users` hidden-delete bug + activityRules revert by `seed-` ID
- QA: api 173/173, web 155/155, typecheck 4/4, lint 0 errors, build 38/38 pages

**Key Changes:**
- Rule: browser auth is always same-origin (`authApiBase()` → Next auth route proxy-or-local) — never direct-to-API, in any environment
- Rule: destructive data operations are backup-first, fail-hard on backup error, and full wipes require an explicit `--yes`
- New ops surface: `npm run db:seed:backup` | `db:seed:revert` | `db:purge -- --yes` | `db:restore -- <file>` (backups in gitignored `packages/api/drizzle/backups/`)

**Next Sprint Focus:**
Live-verify sign-in (`admin@homewolves.com` / `Homewolves123!`) with `npm run dev`; first live DB op should be `npm run db:seed:backup`, then exercise revert + restore round-trip; commit the (currently uncommitted) Session 23 changes.

## 2026-10-20 — execute-feature: db migrations applied + silent-skip fixed (Session 24)

**Summary:**
Ran the pending db migrations against production Supabase. Diagnosed and fixed a silent migration skip (hand-forged journal timestamps predate a runtime Date.now() journal row), bypassed a new IPv6-only DNS wall via pooler-region discovery, and verified the end state: journal 6/6, 31 tables, and all 5 seed users backfilled with the demo password hash — seed-user password sign-in is now unblocked end-to-end.

**Completed:**
- Migrations 0000–0005 applied via `drizzle-kit migrate` through pooler `aws-1-eu-west-1.pooler.supabase.com:5432` (session mode) with CLI env override (`.env` untouched)
- `_journal.json`: 0005 `when` 1790116800000 → 1792089600000 (pending-detection fix; migrator compares journal `when` vs remote max `created_at`)
- Verified: 6/6 journal entries, `User.passwordHash` populated for all seed users, 31 tables, row counts unchanged (zero destructive SQL in the whole migration set — scanned)
- Docs: repair-system Session 24 entry, lessons-learned (journal timestamp discipline), task-queue/test-results/session-log/dev-history

**Key Changes:**
- Rule: NEVER hand-set synthetic journal `when` values below a runtime-applied row — the migrator tracks "applied" by timestamp comparison, not hash; "applied successfully" must always be confirmed against `drizzle.__drizzle_migrations`
- Ops knowledge: project pooler = `aws-1-eu-west-1.pooler.supabase.com` (user `postgres.<ref>`; ports 5432 session / 6543 transaction); direct host is IPv6-only and Node/WARP fails ENOTFOUND

**Next Sprint Focus:**
Operator live-verifies seed-user sign-in; optionally commit the `_journal.json` `when` fix.

## 2026-10-20 — execute-feature: Realtime opt-in, design-token/role-aware UI pass, analytics wiring (Session 25)

**Summary:**
Closed the platform-wide WebSocket console failure by making realtime opt-in and routing messaging through REST + polling when disabled. Completed a broad design-token/role-awareness pass across public, agent, client, and admin surfaces; wired real analytics (including a new ADMIN summary endpoint), fixed null/NaN displays, replaced placeholder map/legal content, and closed QA green.

**Completed:**
- Realtime: `lib/realtime.ts` (`isRealtimeEnabled`, `/ws` URL, ref-counted acquire/release), `NEXT_PUBLIC_REALTIME_ENABLED=false` default + `turbo.json` env; `use-notifications`/`use-messaging` no longer hardcode `wss://homewolves.com` and poll only when realtime is off
- Messaging: `POST /messaging/conversations/:id/messages` REST send (zod-validated) + participant profiles hydrated on conversations; full `/messages` UI (search, compose, attach, read receipts, mobile/desktop panes, call/property info)
- Analytics: `getAdminSummary()` + `GET /analytics/admin-summary` (pending/flagged listings, open bugs, active transactions, MTD revenue); `useAdminSummary` + real admin dashboard badges; agent/dashboard and client dashboards use real analytics/transactions, fake chart/commission/lead data removed
- Role-aware UI: TopNav/MobileBar/dashboard nav/admin layout guard; buyers redirected away from agent-only transaction/listing flows
- Design tokens + formatting: admin payments/moderation/bug-reports/email surfaces, agent transaction list/detail, client dashboard, blog/auth/pricing/products/featured/Toast/batch bar tokenized; `formatCurrency`/`formatDate`/`formatFileSize` null-safe; lucide icons replace emoji; global floating `ThemeToggle`
- Content/data: saved listings hydrated with media; property map view groups by city/state; real terms/privacy policies; `EmptyState` component used for centered empty/error states
- QA: API 173/173 (18 files), web 155/155 (21 files), typecheck 4/4, lint 4/4, `next build` 38/38 pages

**Key Changes:**
- Rule: never connect a browser socket unless `NEXT_PUBLIC_REALTIME_ENABLED=true`; serverless deploys must use REST + polling. Socket namespace is `/ws`.
- Rule: role-aware nav/profile links keep stable accessible names (`Profile`, `Post property`) so component tests reflect the user-facing contract.
- New surfaces: `lib/{realtime,messaging,status,toast,analytics,format}.ts`, `components/shared/{empty-state,theme-toggle}.tsx`, `hooks/use-analytics.ts`, `app/(dashboard)/dashboard/admin/layout.tsx`, `POST /messaging/conversations/:id/messages`, `GET /analytics/admin-summary`

**Next Sprint Focus:**
Remaining backlog: WhatsApp integration, PWA/offline, push notifications, referral system; optionally enable realtime once the API has a long-lived WebSocket host.

## 2026-10-21 — execute-feature: design-token readability/visibility hardening + end-to-end keyless map feature (Session 26)

**Summary:**
Completed the design-token compliance directive (readability/visibility conflicts resolved; several semantic colors silently generated no CSS) and shipped the map feature end-to-end using the keyless approach employed in along-app (MapLibre GL JS + OpenFreeMap + server-proxied geocoding, zero API keys).

**Completed:**
- Token infrastructure: tailwind added the used-but-unmapped colors (`elevated`, `canvas`, `glass`, `overlay`, `subtle`, `strong`, `brand` group) — these class names appeared 111/118/134/96/18 times while generating no CSS; new tokens `--color-accent-overlay`, `--color-tag/-bg`, `--color-focus-ring`; dark + high-contrast themes now override all status tokens (`success/warning/error/info` + bg tints, `status-*`, `danger` aliases) and `border-glass`/`border-brand`
- Tokenized hardcoded hex maps: hw-badge variants, CRM client pages (`chipToneStyle`/`CLIENT_STATUS_TONE`), dashboard tier badges (`tierBadgeStyle`), properties pills; fixed dark-illegible overlays (messages timestamps, client unread pill, transactions stepper, properties "All" pill, inspection chips, form focus rings)
- Map stack (keyless): `MapConfig`/`MapGeocodeConfig` types (packages/types), `FALLBACK_MAP_CONFIG` in both config fallbacks, `map_config` PlatformConfig key + `useMapConfig()`, `map_view` feature flag; `lib/map/config.ts` pure helpers (style stack builder, raster style builder, coordinate resolver, query text, marker builder); `components/map/map-canvas.tsx` (react-map-gl/maplibre, style step-down on error, price pins, popups, pick mode); `components/map/hw-map.tsx` (dynamic ssr:false, `data-theme` MutationObserver, skeleton, token-styled fallback card); `app/api/v1/maps/geocode` (Photon → Nominatim proxy, TTL cache, empty-on-failure); `hooks/use-listing-pin.ts` + `hooks/use-property-map-markers.ts` (exact coords first, geocode → approximate)
- Integrations: ListingMapSection on property detail (Zone 7), properties map view with selection-coupled card strip, MapPinPicker on ListingForm (search + click-to-set + use-my-location, flag-gated), JSON-LD `geo`/`hasMap`, Lagos coordinates seeded in FALLBACK_LISTINGS + API seeds
- QA: typecheck 4/4, lint 4/4, tests 172 passed web (23 files; 17 new) + API suite, `next build` 47 routes

**Key Changes:**
- Rule: geocoder upstreams (Photon/Nominatim) are never called browser-direct — server proxy with proper UA + cache; map style failures step down vector → raster → styled fallback card, never a broken white tile grid
- Rule: dark theme must override every status/status-bg token, not assume light values survive; "token exists in :root" ≠ "reachable" — tailwindmapped-ness is verified by class governance, not naming
- Deps added: `maplibre-gl@^4.7.1`, `react-map-gl@^7.1.9` (versions verified against along-app; import via `react-map-gl/maplibre`)
- MapLibre popups/controls are token-styled in globals.css (`--color-bg-elevated` surface); `attributionControl` prop is boolean-typed in v7 — CSS compaction instead

**Next Sprint Focus:**
Backlog unchanged: WhatsApp, PWA/offline, push notifications, referral system; realtime enable once long-lived WS host exists.

## 2026-10-24 — execute-feature: stakeholder feedback round (Session 27)

**Summary:**
Resolved the stakeholder feedback batch: Chat Agent now starts a conversation directly (find-or-create on the API, editable listing-context draft prefilled in the composer), composing a new conversation uses a design-system member directory dropdown instead of a raw user-ID input, the mobile theme toggle was raised so it never coincides with the Chat Agent action bar, and map provider names were removed from the map info tag (credit moved to the README).

**Completed:**
- Deep-link chat flow: `/messages?to=<agentId>&property=<listingId>&context=<title>` from all three Chat Agent entry points on property detail; URL consumed once (ref guard), exact-match conversation reuse or create, editable prefill only (never auto-send); post-sign-in redirect preserves the deep link
- API idempotency + safety: `POST /messaging/conversations` is find-or-create (exact participant set + property), validates participants (404 by name), rejects self-only conversations (400); new guarded `GET /messaging/directory` (JWT, zod, take ≤ 50, privacy-safe minimal fields excluding phone/email)
- Compose modal: `HwSelect` directory dropdown with role labels, selected-user context card (initials, role, Verified), loading/empty/failure states + advanced manual-ID fallback only when the directory is unavailable
- Theme toggle mobile bottom 96px → 152px (clears the 88–140px Chat Agent sticky bar); desktop unchanged
- Map: `attributionControl={false}` on MapLibre canvas so provider names never render on-map; README "Map Providers" credit section (OpenFreeMap, CARTO, OpenStreetMap, Photon/Nominatim)
- QA: typecheck 4/4, lint 4/4, API 180 tests (7 new in `messaging.service.spec.ts`), web suite green (3 new directory tests), `next build` 48 routes

**Key Changes:**
- Rule: conversation creation is idempotent — callers may repeat a listing enquiry safely; duplicates from listing taps are impossible (legacy duplicates untouched).
- Rule: user enumeration stays restricted to the messaging directory (minimal fields, caller excluded); phone/email remain participant-only via conversation profiles.
- Rule: map surfaces carry no provider branding; provider credit lives in README only.
- New surfaces: `GET /messaging/directory`, `fetchMessagingDirectory`/`useMessagingDirectory`, deep-link contract `to|property|context` on `/messages`, `messaging.service.spec.ts`.

**Next Sprint Focus:**
Backlog unchanged: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable once a long-lived WS host exists.
## 2026-10-24 — execute-feature: Along map credit + footer credit polish (Session 28)

**Summary:**
Stakeholder directive: the map info tag now credits the Along project ("Powered by Along" → https://alongng.com — groundwork for a possible future routes-on-listings integration), the footer link columns hold a 3-column grid from the smallest viewport, the footer credit line carries a config-driven "Built by S.D." dev credit, and the footer got mobile scroll-clearance padding so the fixed menu bar never covers the credit line.

**Completed:**
- `MapConfig.credit` (`MapCreditConfig`) type + `BrandConfig.developerCreditLabel/Url` — all optional/non-breaking; defaults in both config fallback copies ("Powered by Along" → alongng.com; "Built by S.D." → sotonye-dagogo.is-a.dev)
- `MapCreditTag` (`components/map/map-credit-tag.tsx`): pure `normalizeMapCredit` (field-level merge over stale/partial DB rows; strict guards — boolean enabled, non-empty label, `https?://` href → malformed configs degrade to tag-absent, `javascript:` never reaches an href), `useMapCredit`, self-contained tag component
- Overlaid bottom-left on the live canvas inside a `pointer-events-none` container (no map-gesture interception) and rendered inline on `MapLocationFallback` cards so the credit survives every fallback path; tile-provider attribution stays off-surface (README only)
- Footer: `grid grid-cols-3` nav columns (mobile-inclusive, `min-w-0` + `truncate` cells), container `pt-16 pb-32 lg:pt-20 lg:pb-20`, credit line = copyright + dev-credit anchor (target=_blank, noopener), stack on mobile / inline on desktop
- QA: turbo typecheck 4/4, lint green, web tests 184 passed (new `footer.test.tsx` ×3; `hw-map.test.tsx` grown to 12 tests), `next build` green (48 routes)

**Key Changes:**
- Rule: credits are config products, not copy — `map_config.credit` and `brand.developerCredit*` are admin-editable/removable without deploys; `enabled: false` (map) or empty label (footer) hides them.
- Rule: extending an existing PlatformConfig key must merge new optional sub-objects field-by-field over possibly-legacy DB rows, and whitelist link URL schemes before any `href`.

**Next Sprint Focus:**
Backlog unchanged: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable once a long-lived WS host exists.
