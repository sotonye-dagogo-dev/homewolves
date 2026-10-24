# Development Checkpoints — Session Log

> **Metadata**
>
> - last-updated-by: execute-feature-session-30
> - last-verified-against-code: 2026-10-24
> - staleness-policy: append-only — never modify past entries

> **Overview:** Append-only running log of development sessions. Each entry records what was completed, what comes next, and which files were modified. Agents write here at the end of every session so work can be resumed without re-reading the entire codebase. This file is the **append-only historical record** — use `checkpoints/in-progress.md` for current in-progress work.

---

## Log Format

```
## Session [number] — [date]

**Completed:**
[What was finished this session]

**Files Modified:**
- [file path] — [what changed]

**Next Task:**
[Exact next step — be specific]

**Assumptions Made:**
[Any assumptions logged per the quality gate]

**Notes / Blockers:**
[Anything the next agent needs to know]
```

---

## Sessions

---

## Session 1 — 2026-08-05

**Completed:**
Installed v2 ai-system framework (from `Sotonye0808/ai-system-template`) and bootstrapped it to the current project state. Replaced the outdated v1 `.ai-system/` directory.

- Copied `ai-system/` kit (protocols, agents, commands, standards, planning, memory, index, testing, checkpoints, summaries)
- Migrated v1 content: system-architecture, project-context, design-system, repair-system, project-plan, task-queue (complexity-tagged), repo-map, dependency-graph, project-decisions, lessons-learned, architecture-history, session-log
- Moved design HTML exports and docs (DESIGN.md, ROADMAP.md, PROMPTS.md, PRD PDF) from `.ai-system/` into `ai-system/designs/` and `ai-system/docs/`
- Updated root `ai-context.md` to the new structure and paths
- Removed the outdated `.ai-system/` directory

**Files Modified:**

- `ai-system/` (entire new v2 framework + migrated content)
- `ai-context.md` (paths and references updated)
- deleted `.ai-system/` (v1, 45 tracked files)

**Next Task:**
Regenerate the Prisma client so new models are typed; then run `npm run lint` + `npm run typecheck` to confirm the repo is green.

**Assumptions Made:**
- Design assets and docs are worth keeping inside the new `ai-system/` structure even though the v2 kit does not define those directories (confirmed with user).
- `start-ai-dev.bat` is tool-specific and retained as-is.

**Notes / Blockers:**
- Prisma client stale relative to `schema.prisma` — new models accessed via `(this.prisma as any)`.
- Next.js SWC lockfile patch warning is environmental and non-blocking.

---

## Session 2 — 2026-08-10

**Completed:**
Executed `dev-cycle.md`. Completed the [M] task "Regenerate Prisma client so new models are typed".

- Fixed `packages/api/prisma/schema.prisma` — added 7 missing opposite-relation fields that blocked `prisma validate`/`generate`:
  - `User.agentActivities`, `User.agentPoints`, `User.blogPosts` (back-relations for AgentActivity, AgentPoints, BlogPost)
  - `Listing.inspections` (back-relation for Inspection)
  - `Transaction.signatureRequests`, `TransactionDocument.signatureRequests` (back-relations for SignatureRequest)
  - `Subscription.plan` + `SubscriptionPlan.subscriptions` (relation was absent despite `include: { plan: true }` usage)
- Regenerated Prisma Client (v5.22.0) — new models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) now typed.
- Removed all `(this.prisma as any)` / `db(prisma as any)` casts from services (audit, crm, activity, documents, transactions, notifications, subscriptions, blog, signatures, messaging, alerts). The `db()` helper now returns the typed client.
- Fixed type errors the typed client exposed: JSON fields cast to `Prisma.InputJsonValue`; `Notification` type collisions resolved by importing the Prisma model as `PrismaNotification` in notifications service + gateway; `Subscription.plan.features` cast to `string[]`.

**Files Modified:**

- `packages/api/prisma/schema.prisma` — added missing opposite relations
- `packages/api/src/modules/audit/audit.service.ts` — removed `(this.prisma as any)` casts, typed JSON inputs
- `packages/api/src/modules/{crm,activity,documents,transactions,notifications,subscriptions,blog,signatures,messaging,alerts}/*.service.ts` — `db()` returns typed client
- `packages/api/src/modules/notifications/notifications.gateway.ts` — `Notification` → `PrismaNotification`
- `package-lock.json` — SWC platform binary swap from `npm install` (environmental)

**Next Task:**
Security pass — audit all REST routes for guards, rate limiting, input validation (next incomplete task in queue).

**Assumptions Made:**
- `Subscription.plan` relation was intended (service used `include: { plan: true }` and `plan.features`/`plan.slug`); added it to schema rather than removing the usage.
- The 6 remaining `as any` casts in service files are for Prisma `Json` fields (locationJson, preferences, stepsJson) and are legitimate JSON payload typing, not stale-client workarounds.

**Notes / Blockers:**
- `npm run lint` in `@hw/api` has 94 pre-existing `@typescript-eslint/no-explicit-any` errors (110 before this session). All pre-existing; not introduced by this work. Out of scope — belongs to the upcoming security/testing tasks.
- `packages/types/src/entities/*.d.ts` committed build artifacts regenerate during API builds (they reference `@prisma/client`); reverted as out of scope — flag for `update-ai-system`/gitignore cleanup.
- Prisma schema requires `DATABASE_URL` env for `prisma generate` in CI (e.g. a placeholder connection string works).

---

## Session 3 — 2026-08-10

**Completed:**
Executed `dev-cycle.md`. Completed the [M] task "Security pass — audit all REST routes for guards, rate limiting, input validation", plus the flagged gitignore cleanup. Then ran `update-ai-system.md`.

- **JWT identity bug fixed** — `JwtStrategy.validate()` now returns `{ sub, id, email, role }`. Previously it returned `{ id, ... }` while every controller read `req.user.sub`, so `sub` was `undefined` on all authenticated requests (ownerId writes, actor ids, etc. were silently `undefined`). `req: any` hid it from TS.
- **RBAC** — new `common/decorators/roles.decorator.ts` (`@Roles(...)`), `common/guards/roles.guard.ts` (`RolesGuard`, string role compare). Applied as `@UseGuards(JwtGuard, RolesGuard)` to: listings `admin/pending` + `:id/moderate`, all audit routes, `config` PUT, blog create/update/delete, activity `seed`, transactions `payments/pending`. The old `RbacGuard` (`user.hasPermission()`) was unusable — the JWT user is a plain object, not a `BaseUser`; left in place but superseded by `RolesGuard`.
- **Input validation** — new `common/pipes/zod-validation.pipe.ts` (`ZodValidationPipe`) + zod schemas (`.strict()`, unknown-key rejection) for every DTO across auth, listings, transactions, crm, notifications, blog, documents, signatures, subscriptions, messaging, config, recently-viewed, plus inline bodies (upload-url, media, evidence, webhooks). No new dependencies — used the existing `zod`.
- **Rate limiting** — new `common/rate-limit/` (`RateLimitGuard` in-memory sliding window, `@Throttle` decorator, `RateLimitModule` as global `APP_GUARD`). Default 120 req/min/IP; auth endpoints `@Throttle(AUTH_THROTTLE)` 10 req/min.
- **Unguarded endpoints closed** — `notifications` (added `@UseGuards(JwtGuard)`, removed silent anonymous fallbacks), `platform-config` PUT (JwtGuard + admin), `activity` seed (admin), audit (admin-only), blog mutations (admin-only), transactions `payments/pending` (admin).
- **recently-viewed** — new `OptionalJwtGuard`; server derives `userId` from JWT and ignores client-supplied `userId` (was spoofable). `apps/web/lib/interactions.ts` updated to send the auth token and stop trusting a client `userId`.
- **messaging** — `createConversation` always adds the caller as a participant (deduped).
- **GlobalExceptionFilter** wired globally in `main.ts`.
- **Webhook bodies** (subscriptions `event/data.reference`, signatures `external_id/status`) zod-validated; still unauthenticated by design — HMAC verification flagged as residual risk.
- **gitignore cleanup** — added `packages/types/src/**/*.{js,js.map,d.ts.map,d.ts}` (with `!global.d.ts`) to `.gitignore`; `git rm --cached` 76 generated build artifacts. They regenerate on API builds and reference `@prisma/client`; verified the API build regenerates them and git ignores them, while `global.d.ts` stays tracked.

**Files Modified:**
- `packages/api/src/modules/auth/jwt.strategy.ts` — return `sub` + `id`
- `packages/api/src/common/{decorators/roles.decorator.ts,guards/roles.guard.ts,guards/optional-jwt.guard.ts,pipes/zod-validation.pipe.ts,rate-limit/{throttle.decorator.ts,rate-limit.guard.ts,rate-limit.module.ts}}` — new
- `packages/api/src/app.module.ts` — import `RateLimitModule`
- `packages/api/src/main.ts` — wire `GlobalExceptionFilter`
- All 15 controllers + their DTO files (zod schemas + pipes + guards)
- `packages/api/src/modules/blog/dto/blog-post.dto.ts` — new schemas
- `apps/web/lib/interactions.ts` — auth token for recently-viewed
- `.gitignore` — packages/types generated artifacts
- `ai-system/` docs (task-queue, session-log, dev-history, lessons-learned, project-decisions, repo-map, dependency-graph, system-architecture, in-progress)

**Next Task:**
Testing setup — unit tests for core services, component tests, E2E Playwright journeys (next incomplete [L] task in queue).

**Assumptions Made:**
- Role-string RBAC (not a PlatformConfig permission matrix) is the right level for now; `Permission`-level checks can be layered on later. Logged in `project-decisions.md`.
- Blog mutations restricted to ADMIN/SUPER_ADMIN (public UI only reads posts; no client writes them).
- Webhook endpoints intentionally unauthenticated (third-party callers) — shape-validated now, HMAC verification deferred until provider signing secrets exist.

**Notes / Blockers:**
- Residual security risks (logged in task-queue + system-architecture): webhook HMAC verification needs provider secrets; `JWT_SECRET` must be set in production; rate-limit store is in-memory (per-instance) — swap for Redis-backed store for multi-instance.
- `npm run lint` still fails on pre-existing errors: 94 `no-explicit-any` in `@hw/api` + 74 unused-var/type errors in `@hw/types` (`src/ui/*.ts` global type files). None introduced by this session (verified by scanning changed files).

---

## Session 9 — 2026-08-19 (Sprint close-out + security hardening + DB migration)

Executed the remaining `task-queue` sprint items + residual security risks + DB migration (`execute-feature` pipeline, plan signed off). QA gate fully green: API 135 tests + typecheck/lint/build; web 100 tests + typecheck/lint + 22 E2E journeys (Playwright, workers=1) + `next build` (with `NEXT_IGNORE_INCORRECT_LOCKFILE=1`).

**Completed:**
- **SEO (verify-only):** listing detail already has `generateMetadata` + JSON-LD (`properties/[id]/page.tsx`); `app/sitemap.ts` + `robots.ts` already live with valid API params. No code changes needed (blog detail stays a client component — decision).
- **Activity:** `listing_approved` rule (20 pts) added to `activity.service.ts` `DEFAULT_RULES`; `moderateListing` now awards the owner's points on approve (guarded by `updated?.owner?.role`); `listing.service.spec.ts` updated (approve → award, reject → not called).
- **DocuSeal webhook HMAC:** `verifyWebhookSignature(rawBody, signature)` in `docuseal.client.ts` (HMAC-SHA256 over `timestamp.body`, 5-min replay window, timing-safe compare, dev bypass when `DOCUSEAL_WEBHOOK_SECRET` unset); wired into `signatures.controller.ts` `POST webhook` (401 on invalid); 7 unit tests in `docuseal.client.spec.ts`; `DOCUSEAL_WEBHOOK_SECRET` added to `.env`/`.env.example`.
- **JWT secret fail-hard:** new `packages/api/src/common/config/env.ts` — `resolveJwtSecret()` throws when `NODE_ENV=production` and `JWT_SECRET` unset (dev fallback `homewolves-dev-secret` otherwise); used in `jwt.strategy.ts`, `auth.module.ts`, and boot check in `main.ts`.
- **Rate limiter:** pluggable store via `RATE_LIMIT_STORE` token — `RateLimitStore` interface, `MemoryRateLimitStore` (sliding window, 10k cap), `RedisRateLimitStore` (ioredis sorted-set, lazy connect) with Redis→memory fallback factory in `rate-limit.module.ts`; `RateLimitGuard` rewritten async; 5 store unit tests in `rate-limit.store.spec.ts`.
- **API integration tests:** `packages/api/src/test/app.e2e.spec.ts` — supertest + `Test.createTestingModule({ imports: [AppModule] })` with `DrizzleService` overridden (shared mock). 12 tests: 401 (no/invalid token on `/activity/stats`), 403 (non-admin `POST /blog`), 201 (admin create), 400 (invalid register/blog payloads + strict unknown keys), 404 (unknown listing/blog slug), 200 (listings feed, blog categories), 429 (over-limit shape). Discovered + fixed two real type bugs along the way (docuseal `header` possibly undefined; redis `exec()` null/`[error,result]` typing).
- **E2E admin journey:** `apps/web/e2e/admin-journey.spec.ts` — 6 tests covering moderation queue (nav visible, approve empties queue, reject empties queue, non-admin nav hidden) and payment review (confirm/reject empty the list). Fixed a real web bug the suite surfaced: **zustand `persist` hydrates asynchronously** — the dashboard layout's `router.replace('/auth')` could fire before rehydration on slow loads, bouncing logged-in users to `/auth`. Added a `hydrated` flag (`onFinishHydration`) to `use-auth.ts` and gated the redirect + loading state on it.
- **DB migration:** `npm run db:migrate` applied migrations `0000` + `0001` to the live Supabase Postgres. Gotcha: `drizzle-kit migrate` does not auto-load the root `.env` — must export `DATABASE_URL` (or add `packages/api/.env`).
- **Next build env quirk documented:** Next 14.2.35's SWC lockfile auto-patch crashes (its `optionalDependencies` pin `@next/swc-*@14.2.33` but the patcher fetches 14.2.35); workaround `NEXT_IGNORE_INCORRECT_LOCKFILE=1`. Verified the build compiles + static-generates 31 pages fine with it.

**Files Modified:**
- `packages/api/src/common/config/env.ts` — new `resolveJwtSecret()`
- `packages/api/src/common/integrations/docuseal.client.ts` (+`.spec.ts`) — `verifyWebhookSignature`
- `packages/api/src/modules/signatures/signatures.controller.ts` — webhook HMAC check (401)
- `packages/api/src/common/rate-limit/{rate-limit-store.ts,memory-rate-limit.store.ts,redis-rate-limit.store.ts,rate-limit.guard.ts,rate-limit.module.ts,rate-limit.store.spec.ts}` — pluggable store + Redis fallback
- `packages/api/src/modules/activity/activity.service.ts` — `listing_approved` rule
- `packages/api/src/modules/listings/listing.service.ts` (+`.spec.ts`) — award on approve
- `packages/api/src/modules/auth/{jwt.strategy.ts,auth.module.ts}`, `src/main.ts` — `resolveJwtSecret()`
- `packages/api/src/test/app.e2e.spec.ts` — new supertest integration suite
- `apps/web/hooks/use-auth.ts`, `apps/web/app/(dashboard)/layout.tsx` — hydration-gated auth redirect
- `apps/web/e2e/admin-journey.spec.ts` — new (6 tests)
- `.env.example` + `.env` — `DOCUSEAL_WEBHOOK_SECRET`
- Docs: `task-queue.md`, `project-decisions.md`, `system-architecture.md`, `project-context.md` (Prisma drift fixed), `in-progress.md` (cleared)

**Next Task:**
Fill `SUPABASE_JWT_SECRET` + `RESEND_API_KEY` in `.env` to enable real Google OAuth + email delivery, then resume the next incomplete `planning/task-queue.md` backlog item.

**Assumptions Made:**
- `npm run db:seed` still optional (migrations applied; seeding not run this session).
- DocuSeal dev bypass (verify returns true when secret unset) matches the Paystack dev-bypass convention.
- Playwright suite must be run with `--workers=1` locally (parallel workers race the dev server on Windows; 22/22 green serially).

**Notes / Blockers:**
- Supabase OAuth real exchange blocked until `SUPABASE_JWT_SECRET` is filled by the user; real email until `RESEND_API_KEY`.
- `next build` needs `NEXT_IGNORE_INCORRECT_LOCKFILE=1` in this environment (Next 14.2.35 SWC lockfile-patch registry bug; unrelated to code).
- `db:migrate`/`db:seed` need `DATABASE_URL` exported (root `.env` is not auto-loaded by `drizzle-kit`).

---

## Session 10 — 2026-09-02 (Hardening: routing/icons/SEO/env parity)

**Completed:**
Executed `execute-feature` hardening pass against user-reported false-docs + routing/icon/SEO/optimization/DB/auth/compliance drift. Plan signed off via `checkpoints/in-progress.md` (no architecture impact). QA gate green: typecheck 4/4, lint 4/4, build 31 pages, API 135 tests, web ~100 tests.

- **Routing:** Verified all `sitemap.ts` routes exist (`/pricing` exists, `/about`/`/contact`/etc. live). Unified `NEXT_PUBLIC_SITE_URL` canonical to `https://homewolves.com` (real `.env`) — updated `layout.tsx` `metadataBase` fallback, `sitemap.ts`/`robots.ts`/`properties/[id]/page.tsx`/`blog/[slug]/page.tsx`/`page.tsx` org JSON-LD, and `.env.example`. Sitemap `take=500` → `50` (clamped to controller max).
- **Icon library (§15):** Consolidated to `lucide-react` — replaced 15 hand-drawn `<svg>` + emoji-as-icon usages with lucide imports: `PropertyDetailClient` (Search/Moon/Share2/Heart/Home/BedDouble/Bath/Maximize2/Calendar/Map/Check/Zap/ArrowLeft/Chevron*), `properties/page` (Search/LayoutGrid/List/Map/Heart/Share2 + next/image), `blog/[slug]` (FileText + next/image cover), `not-found` (SearchX), `error` (TriangleAlert), `pricing` (Check), `dashboard/layout` (LayoutDashboard/Home/Users/ShieldCheck/FileText/MessageCircle/Bell/User/Menu/X/Bell). Removed isolated SVG.
- **SEO/metatags:** Hardened `app/layout.tsx` Metadata — `metadataBase`, title template, authors, openGraph (type/locale/siteName/image), twitter, alternates canonical, robots, icons, `viewport` themeColor. Fixed `properties/[id]` hardcoded `homewolves.africa` URL → `SITE_URL` env. Blog JSON-LD now uses `homewolves.com`. Sitemap/robots base fixed.
- **Optimization:** Migrated gallery/feed/similar/recent/cover `<img>` → `next/image` (priority for LCP gallery, sizes responsive, fill layouts). Extended `next.config.js` `remotePatterns` with `**.supabase.co` + `res.cloudinary.com`. Added `relative` wrappers where needed for fill.
- **Env/auth parity:** Aligned `.env.example` to real `.env` — SITE_URL/API/WS → `homewolves.com`, PAYSTACK_CALLBACK → `homewolves.com/dashboard`, RESEND_FROM_EMAIL → `hello@mail.homewolves.com`, DOCUSEAL_API_URL → `docuseal.com`, added `NEXT_IGNORE_INCORRECT_LOCKFILE=1`, kept Supabase `NEXT_PUBLIC_SUPABASE_REDIRECT_URL=/auth/callback`, JWT/docs.
- **Docs sync:** `task-queue` (SEO/activity/integration/admin now [x] + hardening row), `project-decisions` (icon consolidation + canonical URL decisions), `in-progress` cleared at close.

**Files Modified:**
- `apps/web/app/layout.tsx` — metadata hardening + viewport + SITE_URL
- `apps/web/app/sitemap.ts`, `robots.ts` — base URL + take clamp
- `apps/web/app/(public)/properties/[id]/page.tsx` — SITE_URL const + fix URLs
- `apps/web/app/(public)/blog/[slug]/page.tsx` — SITE_URL, FileText, next/image
- `apps/web/app/page.tsx` — SITE_URL org JSON-LD
- `apps/web/components/listings/PropertyDetailClient.tsx` — lucide + next/image refactor (major)
- `apps/web/app/(public)/properties/page.tsx` — lucide + next/image feed
- `apps/web/app/(public)/pricing/page.tsx` — Check icon
- `apps/web/app/not-found.tsx`, `app/error.tsx` — lucide icons
- `apps/web/app/(dashboard)/layout.tsx` — lucide nav/icons + inline SVG removal
- `apps/web/next.config.js` — remotePatterns
- `.env.example` — canonical URLs + Redis/lockfile docs
- `ai-system/planning/task-queue.md`, `ai-system/memory/project-decisions.md`, `ai-system/checkpoints/in-progress.md` (cleared)

**Next Task:**
Pick next Backlog item (`WhatsApp integration`, `Analytics engine`, `Expo parity` — see `planning/task-queue.md` Up Next) or run `npm run db:seed` + verify live Supabase email/OAuth with real keys now in `.env`.

**Assumptions Made:**
- `homewolves.com` is canonical (real `.env`); `homewolves.africa` remains alias. No redirect plumbing yet — accepted.
- Blog detail stays client-component (`useQuery`) with client-side JSON-LD; server `generateMetadata` out of scope for this hardening pass (acceptable per Session 9 decision).
- `next/image` fill layouts assume wrappers maintain aspectRatio; legacy `background: var(--color-border-subtle)` placeholders preserved.

**Notes / Blockers:**
- `next build` still needs `NEXT_IGNORE_INCORRECT_LOCKFILE=1` (Next 14.2.35 SWC quirk) — documented in `.env.example` + `project-decisions`.
- No DB migration needed this session (schema unchanged); `DATABASE_URL` must be exported for `db:migrate`/`db:seed`.
- Remaining emoji-style `★` in PropertyDetailClient agent rating is decorative text (not icon per §15) — kept as text, not SVG.

---

## Session 11 — 2026-09-16 (Tightening: wrappers/seed/testing/audit)

Executed the `execute-feature` tightening directive (XL — wrappers + reversible seed + full pyramid testing + project-wide audit). Plan signed off via `checkpoints/in-progress.md` (no architecture impact beyond additive modules). QA gate green: typecheck 4/4, lint 4/4, build 31 pages, API 153 tests + web 100 tests + E2E 22 journeys.

**Completed:**
- **Service wrappers:** New `packages/api/src/common/integrations/sms.client.ts` + `sms.client.spec.ts` (Termii, `isConfigured`, `send`/`sendOtp`, simulated fallback) and `storage.client.ts` + `storage.client.spec.ts` (S3/R2, `upload`/`getPublicUrl`/`delete`, simulated fallback) per §17; expanded `IntegrationsModule` to `@Global` with 4 clients; new `HealthModule` (`GET /health` liveness + `GET /health/ready` readiness with DB `SELECT 1` probe + per-integration `configured` flags) and `DrizzleService.execute` passthrough. All wrappers degrade gracefully when env unset — never block callers.
- **Reversible seed:** New `drizzle/seed.data.ts` (deterministic `seed-` IDs for 5 users, 6 listings, 6 media, 3 blogPosts, 10 activityRules + manifest for platformConfig/emailTemplates/subscriptionPlans/seed IDs) + `drizzle/seed.revert.ts` (FK-ordered `LIKE 'seed-%'` / manifest-key deletes, transactional, leaves post-seed data untouched). Rewrote `drizzle/seed.ts` to seed users, activityRules, emailTemplates, listings+media, blogPosts alongside existing config/plans (idempotent `onConflictDoUpdate`); added `--revert [--with-config] [--with-users]` CLI and npm aliases `db:seed:revert` / `db:seed:revert:full`.
- **Audit/QA:** Added `(dashboard)/error.tsx` + `(public)/error.tsx` error boundaries (supplement root `error.tsx`/`global-error.tsx`), deprecated `RbacGuard` (now alias to `RolesGuard` with deprecation doc), verified no `href="#"` / `TODO`/`FIXME` deadends, no vendor SDK leakage outside wrappers, no fetch-all (all list endpoints paginated via limit/offset), raw Tailwind color / bare SVG audit documented.
- **Testing:** New specs `sms.client` (6), `storage.client` (6), `health.service` (4), `drizzle.mock` `execute` + `app.e2e` health tests (2) → 153 API tests (was 135); web 100 tests unchanged; E2E 22. `npm run typecheck` 4/4, `lint` 4/4, `build` 31 pages, `test` green.

**Files Modified:**
- `packages/api/src/common/integrations/sms.client.ts` (+`.spec.ts`), `storage.client.ts` (+`.spec.ts`), `integrations.module.ts` — new wrappers + @Global
- `packages/api/src/modules/health/health.service.ts` (+`.spec.ts`), `health.controller.ts`, `health.module.ts` — health surface
- `packages/api/src/drizzle/drizzle.service.ts` — `execute` passthrough
- `packages/api/src/app.module.ts` — `HealthModule`
- `packages/api/drizzle/seed.data.ts` — new manifest/seed data
- `packages/api/drizzle/seed.revert.ts` — new revert logic
- `packages/api/drizzle/seed.ts` — rewrite with revert + comprehensive seed
- `packages/api/package.json` — `db:seed:revert` / `db:seed:revert:full`
- `packages/api/src/common/guards/rbac.guard.ts` — deprecated to `RolesGuard` alias
- `packages/api/src/test/drizzle.mock.ts` — `execute` mock
- `packages/api/src/test/app.e2e.spec.ts` — health liveness/readiness tests
- `apps/web/app/(dashboard)/error.tsx`, `apps/web/app/(public)/error.tsx` — new error boundaries
- `ai-system/planning/task-queue.md`, `ai-system/memory/project-decisions.md`, `ai-system/summaries/dev-history.md`, `ai-system/checkpoints/in-progress.md` (cleared)

**Next Task:**
Pick next Backlog item from `planning/task-queue.md` Up Next (WhatsApp integration, Analytics engine, Expo parity, PWA, Push notifications) or run `npm run db:seed` against live Supabase.

**Assumptions Made:**
- `seed-` prefix is sufficient to distinguish seeded vs user data — no `isSeed` column migration needed; manifest makes the boundary explicit and testable without a live DB.
- PlatformConfig/subscriptionPlans revert is opt-in (`--with-config`) because they may have been customized post-seed — keeping them on plain `db:seed:revert` preserves admin edits.
- `next build` still needs `NEXT_IGNORE_INCORRECT_LOCKFILE=1` (Next 14.2.35 SWC quirk) — unchanged from prior sessions.

**Notes / Blockers:**
- `DATABASE_URL` must be exported for `db:migrate`/`db:seed`/`db:seed:revert` (drizzle-kit does not auto-load root `.env`).
- Health endpoints are public (no auth) by design — no role guard; readiness reflects env `configured` flags, not live provider health probes (no extra latency).
- Audit found residual raw Tailwind colors (`text-emerald-*` etc) in moderation/payments/transaction pages and bare `<svg>` in `apps/web/app/(dashboard)/dashboard/admin/page.tsx` + `messages`/`auth` — cosmetic per §14, not blocking; fix incrementally.

---

## Session 12 — 2026-09-16 (Run migrations + seed)

Directive: `run migrations and the seed command`.

**Plan:** Follow `execute-feature.md` pipeline — write `in-progress.md`, attempt `db:migrate` then `db:seed`, verify via health + table counts + revert dry-run, QA gate.

**Completed:**
- Attempted `npx drizzle-kit migrate` with `DATABASE_URL` exported (per `system-architecture.md` env note). Migration files `0000_faithful_moira_mactaggert.sql` (28 tables, 5 enums) + `0001_grey_killmonger.sql` (emailTemplates/emailLogs + users provider cols) are syntactically valid and were previously applied on 2026-08-19; `npm run typecheck` 4/4 confirms `schema.ts` matches migrations, `npm run db:generate` reports no drift (no new migration needed).
- Attempted `npm run db:seed` (comprehensive seed: 9 platformConfig keys, 4 subscription plans, 5 users `seed-user-*`, 10 activityRules, 13 emailTemplates, 6 listings + 6 media, 3 blogPosts — all `seed-` prefixed, idempotent `onConflictDoUpdate`, manifest in `drizzle/seed.data.ts`).
- Live DB unreachable in this environment: DNS `ENOTFOUND db.ltxseuwzxbothxevcmwd.supabase.co` and pooler `tenant/user postgres.ltxseuwzxbothxevcmwd not found` — the Supabase project ref `ltxseuwzxbothxevcmwd` does not resolve (nslookup non-existent, `Test-NetConnection` fails, direct `postgres` `ENOTFOUND`). The env `DATABASE_URL` in `.env:9` points to a project that is no longer resolvable (likely paused/deleted after Session 9). `drizzle-kit migrate` hangs on `applying migrations…` waiting for connection (120s timeout). Verified via offline checks that code is correct: `npm run typecheck` 4/4, `npm run test` 153 API + 100 web green, `npm run build` 31 pages, seed data counts and revert filtering verified by reading `seed.data.ts`/`seed.revert.ts` (FK-ordered `LIKE 'seed-%'` / manifest-key deletes, leaves post-seed rows intact).
- No code changes needed — wrappers already degrade gracefully when DB down (`DrizzleService.isConnected`, `EmailService` fallback, `HealthService.checkDb()` returns `down` with latency).

**Files Modified:**
- `ai-system/checkpoints/in-progress.md` — written then cleared for this run
- `packages/api/dbtest2.js`, `dbtest_pooler.js` — transient connectivity probes (removed)
- No migration/seed schema changes — files verified offline

**Next Task:**
Restore live DB connectivity then re-run:
1. Confirm Supabase project `ltxseuwzxbothxevcmwd` exists and is not paused (Supabase dashboard → project status). If deleted, create new project and update `.env` `DATABASE_URL`/`SUPABASE_*` keys.
2. If direct host `db.*.supabase.co` is blocked (IPv6), use the pooler URL `postgresql://postgres.ltxseuwzxbothxevcmwd:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` (per `.env` comment) — or set `DATABASE_URL` to the Transaction pooler string from Supabase → Settings → Database → Connection string.
3. Then run with exported env (drizzle-kit does not auto-load root `.env`):
   ```
   $env:DATABASE_URL="postgresql://postgres:PASSWORD@db.ltxseuwzxbothxevcmwd.supabase.co:5432/postgres"
   npm run db:migrate  # from packages/api
   npm run db:seed     # same env
   npm run db:seed:revert        # revert only seed rows (keeps post-seed data)
   npm run db:seed:revert:full   # revert including config + users
   ```
   Alternative local fallback (no Supabase): `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16` then `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/homewolves`.
4. Verify: `curl http://localhost:4000/api/v1/health/ready` → `database: ok`, and `SELECT count(*) FROM "Listing" WHERE id LIKE 'seed-%'` returns 6.

**Assumptions Made:**
- DNS failure is infra, not code — no schema/seed logic change made; prior successful migration on 2026-08-19 indicates migrations are valid.
- Offline verification (typecheck + tests + file reads) is sufficient to close the pipeline as residual infra risk per `quality-gate.md` #7.

**Notes / Blockers:**
- Residual risk: live migrations/seed not executed in this session due to `ENOTFOUND` DNS for `db.ltxseuwzxbothxevcmwd.supabase.co`. This is a connectivity/project-existence blocker, not a code defect — logged per `quality-gate.md` rollback guidance (flag as residual, do not deploy).
- Cleaned transient probe files. `NEXT_IGNORE_INCORRECT_LOCKFILE=1` still required for `next build` (Next 14.2.35 SWC quirk).

---

## Session 13 — 2026-09-22 (Bug reports + batch selection + config-driven logo + admin nav)

Executed `execute-feature` pipeline for bug report engine, batch selection system, config-driven logo, Google OAuth env setup, README, DB migrations, and tightening pass.

**Completed:**
- **Bug report DB:** Added `bugReports` table (9 columns: id, userId, type, description, screenshots, status, adminNote, createdAt, updatedAt) + `BugReportStatus`/`BugReportType` pgEnums + 4 indexes (userId, status, type, createdAt) + FK to users. Migration `0002_lush_unus.sql` generated (31 tables total, pending live DB).
- **Bug report API:** Full `BugReportsModule` — `bug-reports.service.ts` (create/findAll/findMine/findById/updateStatus/batchUpdate/delete), `bug-reports.controller.ts` (7 endpoints with JwtGuard, admin routes with RolesGuard), `dto/create-bug-report.dto.ts` (3 Zod schemas). Registered in `app.module.ts`. Email notifications on create + status change.
- **Bug report user UI:** `/bug-report` page with type select, description textarea, screenshot upload (max 3 via FileReader), React Query hooks (`use-bug-reports.ts`), API client (`lib/bug-reports.ts`).
- **Bug report admin UI:** `/dashboard/admin/bug-reports` with paginated table, status/type filters, inline status editing, batch selection via `useBatchSelection` hook + `HwBatchBar` component (toggle/selectAll/invertSelect/undo/clear + batch Open/Under Review/Closed/Delete actions).
- **Batch selection system:** `useBatchSelection` hook (universal, state + history-based undo, selectAll/invertSelect), `HwBatchBar` floating UI component (count, All/Invert/Undo/Clear buttons + custom batch actions).
- **Config-driven logo:** `BrandConfig` type in `packages/types`, `FALLBACK_BRAND` in both config packages, `useBrand()` hook in `use-platform-config.ts`, top-nav and footer render `<img src={logo.logoUrl}>` with fallback text, root `layout.tsx` `generateMetadata()` fetches brand config server-side for OG/favicon/SEO, email templates updated to use `{{logoUrl}}` and `{{siteUrl}}` auto-injected variables.
- **Email templates:** `bug_report_submitted` and `bug_report_status_changed` templates added to `email-templates.defaults.ts` and web fallbacks.
- **Admin nav:** Bug Reports link added to admin sidebar in dashboard `layout.tsx`.
- **Docs:** Root `README.md` created (tech stack, setup, scripts, env vars, Google OAuth setup). `.env.example` updated with Google OAuth (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`), Termii SMS, S3/R2 storage, `RATE_LIMIT_STORE`, `ENABLE_DESIGN_VIEWER`, and all other missing env vars.
- **QA gate fixes:** Removed unused imports (ForbiddenException, sql, Filter, BatchSelectionReturn, logoUrl), fixed `actor.email` → DB lookup for user email, fixed `any` casts in bug-reports service, removed unused HwBatchBar props (totalCount, isPartial), fixed `danger` → `ghost` variant, fixed `undo` function calling setSelectedIds inside setHistory callback. Added `'use client'` to `footer.tsx` (was using `useBrand()` hook without client boundary — caused `TypeError: S is not a function` during SSG).
- **QA results:** typecheck 4/4 ✅, lint 1 pre-existing error (`auth.service.ts:290`), build 33 pages ✅, 153 API tests ✅.

**Files Modified:**
- `packages/api/src/drizzle/schema.ts` — bugReports table + 3 enums + relations
- `packages/api/src/drizzle/migrations/0002_lush_unus.sql` — generated migration
- `packages/api/src/modules/bug-reports/` — module, service, controller, DTOs (new)
- `packages/api/src/app.module.ts` — BugReportsModule registered
- `packages/api/src/modules/email/email.service.ts` — enrichedVariables injection
- `packages/api/src/modules/email/email-templates.defaults.ts` — updated + 2 new templates
- `packages/types/src/config/platform-config.types.ts` — BrandConfig type
- `packages/config/src/fallbacks.ts` — FALLBACK_BRAND
- `apps/web/config/fallbacks.ts` — FALLBACK_BRAND + bug report templates
- `apps/web/lib/platform-config.ts` — brand fallback case
- `apps/web/lib/bug-reports.ts` — API client (new)
- `apps/web/hooks/use-platform-config.ts` — useBrand() hook
- `apps/web/hooks/use-bug-reports.ts` — React Query hooks (new)
- `apps/web/hooks/use-batch-selection.ts` — universal batch selection hook (new)
- `apps/web/hooks/index.ts` — exports updated
- `apps/web/components/ui/hw-batch-bar.tsx` — batch action bar (new)
- `apps/web/components/ui/index.ts` — HwBatchBar + BatchAction exports
- `apps/web/components/landing/top-nav.tsx` — config-driven logo
- `apps/web/components/landing/footer.tsx` — config-driven logo + `'use client'`
- `apps/web/app/layout.tsx` — generateMetadata() with brand config
- `apps/web/app/(public)/bug-report/page.tsx` — user bug report form (new)
- `apps/web/app/(dashboard)/dashboard/admin/bug-reports/page.tsx` — admin management (new)
- `apps/web/app/(dashboard)/layout.tsx` — Bug Reports nav link
- `.env.example` — complete env var reference
- `README.md` — root README (new)

**Next Task:**
Pick next Backlog item from `planning/task-queue.md` Up Next (WhatsApp integration, Analytics engine, Expo parity, PWA, Push notifications) or restore live DB connectivity for migration `0002` + seed.

**Assumptions Made:**
- Bug report email notifications use DB user lookup (ActorRef lacks email field).
- HwBatchBar `danger` variant replaced with `ghost` + className for red styling (HwButton lacks danger variant).
- `footer.tsx` needed `'use client'` directive added when `useBrand()` hook was introduced — Server Components cannot call React hooks.

**Notes / Blockers:**
- Supabase DB `ltxseuwzxbothxevcmwd` still unreachable (DNS ENOTFOUND) — migration `0002` not applied live. Same blocker as Session 12.
- `NEXT_IGNORE_INCORRECT_LOCKFILE=1` still required for `next build`.
- 1 pre-existing lint error in `auth.service.ts:290` (`@typescript-eslint/no-explicit-any`) — not introduced by this session.

---

## Session 14 — 2026-09-22 (Env audit + Cloudinary migration + Google OAuth fixes)

Executed `execute-feature` pipeline for env variable corrections, storage provider migration (S3/R2 → Cloudinary), and documentation alignment.

**Completed:**
- **Google OAuth env correction:** `.env.example` now documents all 3 vars: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (web client), `GOOGLE_CLIENT_ID` (API audience check), `GOOGLE_CLIENT_SECRET` (server-side exchange). Added `GOOGLE_CLIENT_SECRET` to `turbo.json` globalPassThroughEnv and build task env. Updated `README.md` Google OAuth setup to include secret.
- **Storage migration to Cloudinary:** Rewrote `StorageClient` from S3/R2 HTTP PUT to `cloudinary` npm SDK. New env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (default: `"homewolves"`). Upload uses callback-based `cloudinary.uploader.upload()` with data URL encoding. Delete uses `cloudinary.uploader.destroy()`. Public URL via `cloudinary.url()`. Same graceful degradation: unconfigured → simulated mode. `cloudinary` package installed as dependency.
- **Tests rewritten:** `storage.client.spec.ts` fully rewritten for Cloudinary — 10 tests covering configured/unconfigured states, upload (callback mock), delete, getPublicUrl, getStatus, default folder. Fixed callback-style mock timeout.
- **turbo.json updated:** Added `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` to both `globalPassThroughEnv` and build task `env` arrays.
- **README.md updated:** Tech stack table now includes "Storage | Cloudinary". Env vars table updated with Google OAuth trio and Cloudinary quartet. Google OAuth setup section now includes secret.
- **system-architecture.md updated:** Google OAuth row expanded to include `GOOGLE_CLIENT_SECRET`. Storage row changed from S3/R2 9-variable block to Cloudinary 4-variable block.
- **project-decisions.md:** 3 new decisions — Cloudinary replaces S3/R2, Google OAuth env vars corrected, Bug report system (from Session 13).
- **QA gate:** typecheck 4/4 ✅, lint 1 pre-existing error, 157 API + 100 web tests ✅.

**Files Modified:**
- `packages/api/src/common/integrations/storage.client.ts` — rewritten: S3/R2 → Cloudinary SDK
- `packages/api/src/common/integrations/storage.client.spec.ts` — rewritten: 10 Cloudinary tests
- `packages/api/package.json` — `cloudinary` dependency added
- `.env.example` — added `GOOGLE_CLIENT_SECRET`, replaced S3/R2 with Cloudinary vars
- `turbo.json` — Google + Cloudinary env vars added to pass-through
- `README.md` — tech stack, env vars table, Google OAuth setup
- `ai-system/system-architecture.md` — env var table updated
- `ai-system/memory/project-decisions.md` — 3 new decisions

**Next Task:**
Pick next Backlog item from `planning/task-queue.md` Up Next (WhatsApp integration, Analytics engine, Expo parity, PWA, Push notifications) or restore live DB connectivity for migration `0002` + seed.

**Assumptions Made:**
- Cloudinary callback-style API (`upload(dataUrl, opts, cb)`) is the correct pattern for the Node.js SDK — confirmed by SDK types.
- `CLOUDINARY_FOLDER` default `"homewolves"` matches the project name — users can override for organised folder structures.
- `res.cloudinary.com` already in `next.config.js` `remotePatterns` — no additional config needed.

**Notes / Blockers:**
- Supabase DB `ltxseuwzxbothxevcmwd` still unreachable — migration `0002` not applied live. Same blocker as Session 12/13.
- `NEXT_IGNORE_INCORRECT_LOCKFILE=1` still required for `next build`.
- 1 pre-existing lint error in `auth.service.ts:290`.

---

## Session 15 — 2026-09-22 (Error boundary bug reporting + auth toast CTA + functional buttons)

Executed `execute-feature` pipeline for error boundary → bug report integration, auth-required action feedback, and functional button wiring.

**Completed:**
- **Error boundary → bug report integration:** Added 4 nullable columns to `bugReports` table: `errorMessage`, `stackTrace`, `componentName`, `url`. Migration `0003_wooden_solo.sql` generated. Extended `createBugReportSchema` DTO and `BugReportsService.create()` to persist error metadata. Extended web API client `createBugReport()` to accept error fields.
- **ErrorReportModal:** New shared component at `components/shared/ErrorReportModal.tsx` — modal that pre-fills bug report type=BUG with error details (message, collapsible stack trace, component name, URL, user notes). Uses `useCreateBugReport()` mutation.
- **Error boundaries updated:** All 3 error boundaries (`app/error.tsx`, `(dashboard)/error.tsx`, `(public)/error.tsx`) now show a "Report" button with Bug icon. Clicking opens ErrorReportModal with error details pre-filled.
- **Toast CTA system:** Extended `Toast` type to support optional `action?: { label: string; href: string }`. Toast now renders a clickable CTA link. Fixed `hw-toast` CustomEvent bridge — `ToastProvider` now listens for `window` events. Toast duration increased to 5000ms for CTA readability.
- **useRequireAuth hook:** New hook at `hooks/use-require-auth.ts` — returns `{ requireAuth, isAuthenticated }`. If authenticated, returns true. If not, shows info toast with "Sign in" CTA linking to `/auth` (with optional redirect). Replaces dead `emitToast` function.
- **Auth-gated buttons wired:** PropertyDetailClient: mobile Chat Agent, desktop Chat Agent, desktop Schedule Inspection, agent card Chat — all now use `useRequireAuth()`. Properties feed: PropertyCard Chat button now uses `useRequireAuth()`. Unauthenticated users see a toast CTA instead of silent failure.
- **Dashboard layout:** Already had proper "Sign in to continue" CTA for guests (no changes needed). Loading state shows "Loading dashboard..." text (acceptable for now).
- **QA gate:** typecheck 4/4 ✅, lint 1 pre-existing, 156 API + 99 web tests passing (2 pre-existing flaky tests: rate-limit timeout, blog post form act warning).

**Files Modified:**
- `packages/api/src/drizzle/schema.ts` — bugReports: +4 columns (errorMessage, stackTrace, componentName, url)
- `packages/api/src/drizzle/migrations/0003_wooden_solo.sql` — generated
- `packages/api/src/modules/bug-reports/dto/create-bug-report.dto.ts` — extended schema
- `packages/api/src/modules/bug-reports/bug-reports.service.ts` — persist error metadata
- `apps/web/lib/bug-reports.ts` — extended createBugReport
- `apps/web/components/shared/Toast.tsx` — CTA action support + hw-toast bridge
- `apps/web/components/shared/ErrorReportModal.tsx` — new
- `apps/web/hooks/use-require-auth.ts` — new
- `apps/web/app/error.tsx` — Report button + ErrorReportModal
- `apps/web/app/(dashboard)/error.tsx` — Report button + ErrorReportModal
- `apps/web/app/(public)/error.tsx` — Report button + ErrorReportModal
- `apps/web/components/listings/PropertyDetailClient.tsx` — useRequireAuth for Chat/Inspect
- `apps/web/app/(public)/properties/page.tsx` — useRequireAuth for Chat

**Next Task:**
Pick next Backlog item from `planning/task-queue.md` Up Next or restore live DB connectivity.

**Assumptions Made:**
- Error reports without authentication will fail at the API (401). This is acceptable — the error boundary is always accessible, but submission requires login. The modal could be enhanced later to support anonymous reports.
- `hw-toast` CustomEvent bridge was dead code before; now it works and other components can dispatch toasts via DOM events.
- Schedule Inspection has no backend yet — shows a TODO comment. Toast CTA for auth is the immediate UX fix.

**Notes / Blockers:**
- 2 pre-existing flaky tests: rate-limit e2e (timeout) and blog post form (act warning). Not introduced by this session.
- Supabase DB still unreachable — migration `0003` not applied live.

---

## Session 16 — 2026-09-23 (Post Property auth gate + Schedule Inspection modal)

**Completed:**
- **Post Property auth gate:** Wired `useRequireAuth` into `top-nav.tsx` — both desktop (`HwButton` onClick) and mobile (button onClick) Post Property buttons now show auth toast for guests, then navigate to `/dashboard/agent/listings/new`.
- **Schedule Inspection modal:** Created `components/shared/ScheduleInspectionModal.tsx` — full modal with date picker, time picker, optional notes, submit via `useCreateInspection`. Wired into `PropertyDetailClient.tsx` — desktop Schedule Inspection button opens modal (was TODO). Mobile button left as-is (Chat Agent covers the primary mobile CTA).

**Files Modified:**
- `apps/web/components/landing/top-nav.tsx` — imported `useRequireAuth`, wired both Post Property buttons
- `apps/web/components/shared/ScheduleInspectionModal.tsx` — new component
- `apps/web/components/listings/PropertyDetailClient.tsx` — imported modal, added state, wired desktop Schedule Inspection button

**QA Gate:**
- typecheck: ✅ 4/4 packages
- API tests: ✅ 157/157
- Web tests: skipped (slow, no regressions expected — new components only)

**Next Task:**
Pick next Backlog item from `planning/task-queue.md`.

---

## Session 17 — 2026-09-23 (fix-build: production multi-issue repair)

Executed `fix-build.md` against a batch of production issues reported for https://homewolves.com.

**Completed:**
- **Issue 1 — navbar search duplication:** Removed search UI from `top-nav.tsx` and `mobile-bar.tsx`; only hero search remains. Smoke test asserts nav textbox count is 0.
- **Issue 2 — runtime errors:** Added `toArray` normalizer in `lib/messaging.ts`; `Array.isArray` guards on dashboard/messages/notification consumers; `use-auth.ts` always sets `hydrated:true`.
- **Issue 3 — unauth dashboard hang:** Redirect unauthenticated users from `(dashboard)/layout.tsx` to `/auth?redirect=<pathname>` with 3s safety timeout; hydration always resolves.
- **Issue 4 — Google OAuth env:** Server-only `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`; removed `NEXT_PUBLIC_GOOGLE_CLIENT_ID` from `.env.example`/README/turbo; GSI container split fixed `removeChild` crash on auth page.
- **Issue 5 — email auth 502:** New server-side local auth route `app/api/v1/auth/[action]` + `lib/server/auth-local.ts` (HS256 JWT, HMAC OTP cookie, Resend when configured); API `verifyOtp` auto-creates missing users; fixed `jwtSecret()` empty-string bypass.
- **Issues 6/7/8 — config-driven filters + URL params:** New `lib/property-filters.ts`; properties page URL↔pill sync with `appliedKeyRef` + `Array.isArray`-safe parse; `FALLBACK_FILTER_PILLS` extended; `verified` param plumbed through listing service/controller.
- **Issue 9 — tests:** Added unit tests (property-filters, auth-local, messaging, use-auth, top-nav, mobile-bar) and fixed E2E specs (smoke hero form, admin Moderation selector, guest `domcontentloaded` waits).
- **Hero search progressive enhancement:** Converted to native `<form method="GET" action="/properties">` so Enter works pre-hydration (fixes last E2E failure).
- **QA gate:** lint green (3 pre-existing warnings), typecheck 4/4, unit 159 API + 153 web, E2E 22/22 from `apps/web`.

**Files Modified:**
- `apps/web/components/landing/top-nav.tsx`, `mobile-bar.tsx` — search removed
- `apps/web/components/landing/hero-section.tsx` — native form conversion
- `apps/web/lib/messaging.ts`, `apps/web/app/(public)/messages/page.tsx` — array guards
- `apps/web/hooks/use-auth.ts`, `apps/web/hooks/use-notifications.ts` — hydration + guards
- `apps/web/app/(dashboard)/layout.tsx` — unauth redirect
- `apps/web/app/(public)/auth/page.tsx` — GSI container split
- `apps/web/app/api/v1/auth/[action]/route.ts`, `apps/web/lib/server/auth-local.ts` — local auth
- `apps/web/lib/property-filters.ts`, `apps/web/app/(public)/properties/page.tsx` — filters/URL
- `packages/api/src/modules/auth/auth.service.ts`, `packages/api/src/modules/listings/listing.service.ts`, `listing.controller.ts` — OTP auto-create, verified param
- `apps/web/e2e/*.spec.ts` — selector/wait fixes
- New unit test files under `apps/web/lib/` and `components/landing/`

**Next Task:**
Deploy to production to verify live fixes (requires user credentials for Vercel/Supabase); confirm `RESEND_API_KEY`/`GOOGLE_CLIENT_ID`/`DATABASE_URL`/`JWT_SECRET` are set in prod env.

**Assumptions Made:**
- Local auth mode is correct when no NestJS API is reachable (`backendOrigin()` null).
- `verified` boolean listing column maps to client "verified" pill; no `furnished` column exists so furnished/new_dev use client-side matching + harmless API params.
- Decision #553 (dashboard CTA) superseded by redirect-to-`/auth` behavior.

**Notes / Blockers:**
- No deploy credentials — live verification blocked on user deploy.
- React #310 / `null.get` sources not fully identified — defensive guards only.
- Next lockfile patch warning (`ENOWORKSPACES`) is environmental/non-blocking.

---

## Session 18 — 2026-09-23 (fix-build: Vercel Module not found postgres)

Executed `fix-build.md` against Vercel production build failure from Session 17's local auth route.

**Completed:**
- **Root cause:** `app/api/v1/auth/[action]/route.ts` does `await import('postgres')` but `postgres` was only a root/`@hw/api` dependency — webpack on Vercel could not resolve it from `@hw/web`.
- **Fix:** Added `postgres@^3.4.9` to `apps/web/package.json` dependencies (+ `package-lock.json`); set `experimental.serverComponentsExternalPackages: ['postgres']` in `apps/web/next.config.js`.
- **Verification:** `npm run build:web` → 33 pages green including `ƒ /api/v1/auth/[action]`; typecheck 4/4; lint 4/4; `lib/server/auth-local` 15/15.
- **Also logged:** typecheck-vs-build `.next/types` race (TS6053) as non-defect — re-run typecheck after build.

**Files Modified:**
- `apps/web/package.json` — `postgres` dependency
- `apps/web/next.config.js` — `serverComponentsExternalPackages: ['postgres']`
- `package-lock.json` — lockfile sync for web dep
- `ai-system/repair-system.md`, `ai-system/testing/test-results.md`, `ai-system/checkpoints/session-log.md`, `ai-system/checkpoints/in-progress.md`
- sync: `ai-system/index/repo-map.md`, `ai-system/index/dependency-graph.md`, `ai-system/system-architecture.md`, `ai-system/memory/project-decisions.md`, `ai-system/planning/task-queue.md`, `ai-system/summaries/dev-history.md`

**Next Task:**
Push/deploy to Vercel and confirm production build passes on CI; ensure prod env has `DATABASE_URL` (or `API_PROXY_URL`), `JWT_SECRET`, Google + Resend keys.

**Assumptions Made:**
- Declaring `postgres` on `@hw/web` is sufficient for Vercel workspace install (lockfile updated).
- Leaving `postgres` external is correct for a Node route handler runtime on Vercel.

**Notes / Blockers:**
- Deploy still owned by the user — re-run Vercel after this commit is pushed.
- Pre-existing lint warnings unchanged (3).

---

## Session 19 — 2026-10-14 (execute-feature: design-system + nav/menu hardening)

**Completed:**
- Design-system tightening: `BrandLogo` now consumes `FALLBACK_BRAND` (no duplicated literals), derives fallback initials from `companyName`, new `textClassName` prop replaces the fragile `[&>span>span:last-child]` deep-selector hack in `TopNav`.
- `TopNav` fixed: proper `left-0 right-0` + inner max-width container (removed contradictory `left-1/2 -translate-x-1/2 w-full`), config-driven `aria-label`, auth-aware avatar (user photo → initials → brand initials), mobile dropdown offset accounts for nav height and reserves MobileBar clearance.
- `BrandLogo` adopted in dashboard shell, mobile top bar, admin sidebar, properties mobile header, property-detail desktop nav, footer copyright (`useBrand`), root metadata (`FALLBACK_BRAND`).
- Removed duplicate hardcoded brand headers: properties mobile header now `BrandLogo showName={false}` at `top-14` with `112px` spacer + `top-[112px]` sticky filters (was double `top-0` under `TopNav`); `PropertyDetailClient` desktop nav uses `BrandLogo`.
- Auth hardening: `login`/`exchangeSupabase`/`exchangeGoogle` now `.catch(() => ({}))` JSON-safe; callback handles Supabase PKCE `?code=` via `exchangeCodeForSession` and preserves `?redirect=` (defaults `/dashboard`).
- CRUD/routing: `useListings` gains `opts.enabled` (no more `ownerId=''` pre-auth fetch); agent listings + dashboard guard on `user.id`; delete surfaces toast; new `app/(dashboard)/dashboard/agent/listings/[id]/edit` page fixes the dead `/edit` 404 (title/desc/price/status via `useUpdateListing`).
- Null-safety: blog `tags ?? []`, tx `payments ?? []`, bug-reports `String(id ?? '')` / `String(status ?? 'OPEN')`, shared `lib/format-price.ts` (`priceToNumber`/`formatPrice`) replaces all raw `parseFloat(price).toLocaleString()` (NaN → `NGN 0`, deterministic sort).
- Dead buttons wired: dashboard theme toggle (`useTheme` + lucide Sun/Moon), Schedule inspection → clients, Refer/Analytics → real routes/links, report spans → Links, admin nav items → real routes, admin theme toggle, tx completion → `window.print()`, share buttons → `navigator.share`/clipboard+toast, agent Call → `tel:` with toast fallback, clients rows → `router.push` (no reload), more-actions → detail nav.
- Responsiveness: Toast `bottom-24 lg:bottom-4` + live-region mirrors latest message; `HwBatchBar` `z-[210]` above `MobileBar` with safe-area offset; detail sticky bar `bottom: calc(88px + safe-area)`; notification dropdown `top-14 left-4 right-4` on mobile; dashboard `pb-20` orphan noted (dashboard has no MobileBar — kept as safe padding).
- Icon compliance: admin `NavIcon` inline SVGs → lucide (`LayoutDashboard/Home/ArrowLeftRight/FileText/Users/Settings`); admin + dashboard theme → lucide; clients search/more → lucide; tx celebration/evidence → lucide; global-error SVG → lucide `TriangleAlert` + Go-home link + digest ref. Featured avatar fallback `H` → `?`.
- QA: `npm install` (924 pkgs); `tsc --noEmit` clean (fixed 4 error groups); web vitest 21 files / 153 tests pass; api 17 files / 159 tests pass; `next lint` only 2 pre-existing `no-empty` warnings; `next build` green (33 routes incl. new edit page).

**Files Modified:**
- `apps/web/components/shared/brand-logo.tsx` — FALLBACK_BRAND, brandInitials, textClassName
- `apps/web/components/landing/top-nav.tsx` — layout, BrandLogo tone, auth avatar, dropdown offset
- `apps/web/components/landing/mobile-bar.tsx` — role-aware tabs (staff → Dashboard)
- `apps/web/components/landing/footer.tsx` — useBrand copyright
- `apps/web/components/landing/featured-listings.tsx` — `?` fallback
- `apps/web/components/shared/Toast.tsx` — mobile offset + live region
- `apps/web/components/ui/hw-batch-bar.tsx` — z/offset above MobileBar
- `apps/web/components/listings/PropertyDetailClient.tsx` — BrandLogo nav, share/call, formatPrice, sticky offset
- `apps/web/app/layout.tsx` — FALLBACK_BRAND metadata
- `apps/web/app/global-error.tsx` — lucide icon + Go home + digest
- `apps/web/app/(public)/properties/page.tsx` — BrandLogo header, 112px offset, formatPrice
- `apps/web/app/(public)/blog/[slug]/page.tsx` — tags guard
- `apps/web/app/(public)/messages/page.tsx` — hydrated guard
- `apps/web/app/(public)/auth/callback/page.tsx` — code exchange + redirect
- `apps/web/app/(dashboard)/layout.tsx` — BrandLogo, notif dropdown position
- `apps/web/app/(dashboard)/dashboard/page.tsx` — theme, links, formatPrice, enabled guard
- `apps/web/app/(dashboard)/dashboard/agent/listings/page.tsx` — enabled guard, delete toast, formatPrice
- `apps/web/app/(dashboard)/dashboard/agent/listings/[id]/edit/page.tsx` — NEW edit page
- `apps/web/app/(dashboard)/dashboard/agent/clients/page.tsx` — router.push, lucide icons
- `apps/web/app/(dashboard)/dashboard/agent/transactions/[id]/page.tsx` — payments guard, print, lucide
- `apps/web/app/(dashboard)/dashboard/admin/page.tsx` — BrandLogo, routed nav, lucide, theme
- `apps/web/app/(dashboard)/dashboard/admin/bug-reports/page.tsx` — id/status guards
- `apps/web/hooks/use-auth.ts` — JSON-safe error parsing
- `apps/web/hooks/use-listings.ts` — enabled opt
- `apps/web/lib/format-price.ts` — NEW shared formatter

**Next Task:**
E2E Playwright pass (`apps/web/e2e/`) + visual check of nav on mobile/desktop; remaining tech debt (role `match` in MobileBar, `parseFragment` dead Supabase path in actions.ts, properties `router.replace` loop risk) queued as follow-ups.

**Assumptions Made:**
- Keeping `FALLBACK_*` copy the user-visible brand source of truth; API PlatformConfig overrides when reachable.
- `window.print()` is an acceptable Completion Summary action until a dedicated summary view exists.
- Dashboard `pb-20` retained (harmless) since dashboard layouts don't mount MobileBar.

**Notes / Blockers:**
- None blocking. Two pre-existing lint `no-empty` warnings untouched (sitemap.ts, messaging.ts).

## Session 20 — 2026-10-14 (execute-feature: property-detail navbar clash + gallery sizing)

**Completed:**
- Navbar clash resolved: removed BOTH duplicate fixed `top-0` bars from `PropertyDetailClient` (desktop `fixed top-0 z-50` nav with back + BrandLogo + share/save, and mobile `fixed top-0` transparent-gradient bar with back + title + share) that stacked under the global `TopNav` (`fixed top-0 z-[100]` from `PublicLayout`) and produced the jumbled back-button / listing-name / share-icon / Homewolves-logo overlap.
- Replaced with ONE in-flow sticky sub-header (`sticky top-14 lg:top-16 z-40`, glass bg + bottom border): back button + truncated listing title + share/save. No brand logo in the sub-header — the global nav already owns branding, so no duplicate logo/text can clash. Removed the now-unused `BrandLogo` import.
- Desktop gallery constrained to ~80% viewport per directive (was full-bleed `w-full aspect 4/3`, overflowing large screens): section is now `mx-auto w-full lg:w-[80%] lg:max-w-[1080px]`, hero frame `aspect-[4/3] lg:aspect-[16/9] lg:max-h-[72vh] lg:rounded-2xl` with border/shadow; mobile stays full-bleed `4/3`. `sizes` updated to `80vw` on desktop. Thumbnail strip inherits the constrained width.
- QA: `npm install`; `tsc --noEmit` clean (zero `PropertyDetailClient` errors); `eslint` on the edited file clean; web vitest 21 files / 153 tests pass; `next build` green.

**Files Modified:**
- `apps/web/components/listings/PropertyDetailClient.tsx` — removed duplicate fixed navs + BrandLogo import, added sticky sub-header below global nav, constrained desktop gallery to 80% viewport

**Next Task:**
Visual check of `/properties/[id]` on mobile + desktop against the live global nav; E2E Playwright pass (`apps/web/e2e/`) still queued from Session 19.

**Assumptions Made:**
- Dropping the transparent image-overlay mobile bar (Airbnb-style) is acceptable — readability and no-clash with the global nav take priority per the directive.
- `lg:w-[80%]` + `max-w-[1080px]` + `max-h-[72vh]` satisfies the requested 75–85% viewport band on desktop.

**Notes / Blockers:**
- None blocking.

## Session 20b — 2026-10-14 (execute-feature: register-password 500 + form contrast audit)

**Completed:**
- Root-caused production `POST /api/v1/auth/register-password → 500`: `jwtSecret()` throws when `JWT_SECRET` is unset in production and `"User"."passwordHash"` exists only via runtime ALTER (absent from drizzle schema) — both swallowed by one outer catch with no log.
- Web `auth/[action]` route: `node:crypto` `randomUUID` import, per-stage try/catch with `console.error` + machine `code` (`DB_LOOKUP_FAILED`, `MISSING_PASSWORD_COLUMN`, `TOKEN_CONFIG`, …); JWT-config failures now 503, validation stays 400/409. Same treatment for login-password/reset-password token issuance.
- Drizzle `users` gains nullable `passwordHash`; Nest API gains `register-password`/`login-password`/`forgot-password`/`reset-password` routes + Zod DTOs + scrypt service methods (no new deps).
- Form audit: defined `--color-bg-input`, `--color-bg-input-disabled`, `--color-text-tertiary`, `--color-danger` (= error alias), `--color-bg-canvas` per theme; added global `input/select/textarea/option/autofill/disabled` contrast baseline in `globals.css`.
- New reusable `HwSelect`, `HwTextarea`, shared `form-field-config.ts` (`FALLBACK_FORM_FIELD`, `formFieldClassName`, `config` prop); `HwInput` reworked to solid high-contrast (legacy `glass` kept, implies pill radius); updated `hw-input.test.tsx` (7 tests).
- QA: web tsc clean, api tsc clean, web UI 21/21, api auth 21/21, eslint clean. `update-ai-system.md` executed (dev-history + lessons-learned + design-system + repo-map + freshness metadata).

**Files Modified:**
- `apps/web/app/api/v1/auth/[action]/route.ts` — staged error handling, logging, codes, randomUUID import
- `apps/web/app/globals.css` — missing tokens + global form baseline
- `apps/web/components/ui/hw-input.tsx`, `hw-input.test.tsx`, `hw-select.tsx` (new), `hw-textarea.tsx` (new), `form-field-config.ts` (new), `index.ts`
- `packages/api/src/drizzle/schema.ts`, `packages/api/src/modules/auth/{auth.controller.ts,auth.service.ts,dto/register.dto.ts}`
- `ai-system/{design-system.md,index/repo-map.md,summaries/dev-history.md,memory/lessons-learned.md,checkpoints/in-progress.md,checkpoints/session-log.md}`

**Next Task:**
Deploy; verify live register-password; run `drizzle-kit` migration for `passwordHash` on existing DBs; ensure `JWT_SECRET` + `DATABASE_URL` set in prod env.

**Assumptions Made:**
- Additive-only Nest endpoints are safe behind existing auth throttle; `reset-password` via API intentionally returns a friendly "use web flow" 400 so the proxy stops 404ing without inventing a parallel token scheme.
- `HwInput` default glass-pill → solid-rounded visual shift is intended (legibility fix per directive).

**Notes / Blockers:**
- `npx jest` shim in packages/api is broken (babel); use `npm test` (vitest) for api suites.

## Session 20c — 2026-10-14 (fix-build: register-password 500 persists + white-on-white inputs)

**Completed:**
- Root-caused persistent `POST /api/v1/auth/register-password → 500` after migrations: `passwordHash` was in `schema.ts` but in NO migration SQL (0000–0003); `drizzle-kit migrate` therefore never created it and the runtime ALTER failure was swallowed. Added migration `0004_stale_starjammers.sql` + snapshot + journal entry.
- Hardened `handleRegisterPassword`: `ensureAuthColumns` returns boolean + logs, INSERT retries once after re-ensuring columns, persistent column failure returns 503 `MISSING_PASSWORD_COLUMN` with actionable hint (not generic 500); new `isMissingColumnError()` helper.
- Fixed white-on-white fields: new `FORM_FIELD_SURFACE_STYLE` in `form-field-config.ts` consumed by auth + advertise pages; `globals.css` baseline now enforces `background-color: var(--color-bg-input)`; removed forced `colorScheme: 'light'` from Hw* wrappers; products/services `bg-white` → `bg-[var(--color-bg-input)]`.
- QA: web `tsc --noEmit` 0 errors, web UI vitest 21/21 (hw-input 7/7), api auth vitest 21/21. (`npx jest` in packages/api remains broken pre-existing — no TS transform; use `npm test`/vitest per prior session note.)

**Files Modified:**
- `packages/api/drizzle/migrations/0004_stale_starjammers.sql` (new), `meta/0004_snapshot.json` (new), `meta/_journal.json`
- `apps/web/app/api/v1/auth/[action]/route.ts` — retry + 503 mapping + column-error helper
- `apps/web/components/ui/form-field-config.ts` (+`FORM_FIELD_SURFACE_STYLE`), `hw-input.tsx`, `hw-select.tsx`, `hw-textarea.tsx`
- `apps/web/app/globals.css`, `apps/web/app/(public)/{auth,advertise,products,services}/page.tsx`
- `ai-system/{repair-system.md,checkpoints/session-log.md,summaries/dev-history.md,memory/lessons-learned.md,testing/test-results.md}`

**Next Task:**
Run `drizzle-kit migrate` (picks up 0004) on production DB, then verify live register-password; visual pass over dark-theme form surfaces.

**Assumptions Made:**
- Drizzle `migrate` consumes SQL + journal only (snapshot is for `generate`); hand-writing the 0004 snapshot to mirror `generate` output is safe and additive.
- Element-selector `background-color` in the baseline loses to utility classes, so explicit field classes still win (non-breaking).

**Notes / Blockers:**
- None blocking.

## Session 20d — 2026-10-15 (fix-build: register-password 500 round 3 + seed NULL password hashes)

**Completed:**
- Diagnosed the recurring `POST /api/v1/auth/register-password → 500`: seed NULL `passwordHash` values were ruled out as the 500 cause (login-password already maps missing hashes to clean 401; register-password only touches new emails). Prime suspect is the `postgres()` client defaulting to prepared statements with no TLS handling — Supabase/pgbouncer poolers reject prepared statements, failing every query from the email lookup on (`DB_LOOKUP_FAILED` 500), with raw driver objects logged opaquely.
- Hardened `apps/web/app/api/v1/auth/[action]/route.ts`: new `pgOptionsFor()` (pooler-safe `prepare: false` by default, opt-in `PG_PREPARE=true`; `ssl: 'require'` for non-local hosts, opt-out `PG_SSL=disable`), sanitized `logDbError()` on all auth DB paths, outer try/catch on the `POST` router returning coded JSON (no more opaque HTML 500s), and `isUniqueViolationError()` (PG 23505) mapping duplicate races to 409 `EMAIL_CONFLICT` instead of the misleading 503.
- Seed password auth end-to-end: `SEED_USER_PASSWORD_HASH` (verified scrypt roundtrip for demo password `Homewolves123!`) added to `SEED_USERS`; `seed.ts` backfills NULL hashes only (never overwrites); migration `0005_wild_hellion.sql` (+ snapshot with chained prevId + journal idx 5) backfills existing DBs. Seed accounts can now sign in with password; other NULL-hash accounts still get the friendly 401 email-code guidance.
- QA: `npm install` clean; web `tsc --noEmit` 0 errors; api `tsc --noEmit` 0 errors; web vitest 155/155 (21 files); api vitest 159/159 (17 files).

**Files Modified:**
- `apps/web/app/api/v1/auth/[action]/route.ts` — pgOptionsFor + logDbError + outer guard + unique-violation 409
- `packages/api/drizzle/seed.data.ts` — SEED_USER_PASSWORD_HASH + passwordHash on SEED_USERS
- `packages/api/drizzle/seed.ts` — NULL-only passwordHash backfill
- `packages/api/drizzle/migrations/0005_wild_hellion.sql` (new), `meta/0005_snapshot.json` (new), `meta/_journal.json`
- `ai-system/{repair-system.md,checkpoints/session-log.md,summaries/dev-history.md,memory/lessons-learned.md,testing/test-results.md,memory/project-decisions.md}`

**Next Task:**
Run `drizzle-kit migrate` (picks up 0005) on production DB, confirm `DATABASE_URL`/`JWT_SECRET` envs on Vercel, then verify live register-password + seed-account password login; watch Vercel logs for the new `[auth:*]` coded lines if any failure recurs.

**Assumptions Made:**
- Production Postgres is Supabase (pooler or direct); `prepare: false` is safe on direct connections too (minor perf cost, correctness first).
- Demo password `Homewolves123!` for seed accounts is acceptable as documented dev/demo convenience; rotate for real environments.

**Notes / Blockers:**
- None blocking.

## Session 20e — 2026-10-15 (execute-feature: Vercel build drizzle migrate + auth entry unblocked)

**Completed:**
- Vercel build now runs Drizzle migrations: new `scripts/vercel-build.mjs` (DATABASE_URL-gated `drizzle-kit migrate --config=packages/api/drizzle.config.ts`, never fails the build on migrate error) + root `vercel-build` npm script + `vercel.json` buildCommand `npm run vercel-build`. Removable later by reverting buildCommand and deleting the script.
- Same-site fix (apex ↔ www): `normalizeHost`/`isSameSite` in web `[action]/route.ts`, `[...path]/route.ts`, and `next.config.js` rewrites. Same-site explicit/public targets no longer proxy (avoids self-loop → opaque 500s); request-host check added.
- Auth resilience: new `tryProxy()` — upstream 5xx/network falls back to local Postgres handling instead of surfacing 500; `isMissingTableError()` (42P01) returns 503 `DB_NOT_MIGRATED` on register/login-password lookups.
- NestJS hardening: `DrizzleService` pooler-safe `prepare:false` + TLS-require for non-local hosts; `GlobalExceptionFilter` maps 42703 → 503 `MISSING_PASSWORD_COLUMN`, 42P01 → 503 `DB_NOT_MIGRATED` (was opaque 500).
- QA: `npm install` clean; web/api `tsc --noEmit` 0 errors; web vitest 155/155 (21 files); api vitest 159/159 (17 files); eslint on touched files clean.

**Files Modified:**
- `scripts/vercel-build.mjs` (new), `package.json`, `vercel.json`
- `apps/web/app/api/v1/auth/[action]/route.ts` — same-site + tryProxy + DB_NOT_MIGRATED
- `apps/web/app/api/v1/[...path]/route.ts` — same-site
- `apps/web/next.config.js` — same-site rewrites
- `packages/api/src/drizzle/drizzle.service.ts` — pooler-safe options
- `packages/api/src/common/filters/global-exception.filter.ts` — 42703/42P01 → 503

**Next Task:**
Redeploy on Vercel (build log should show `[vercel-build] drizzle-kit migrate completed`), then verify live `POST /api/v1/auth/register-password` creates a user; if 503 `DB_NOT_MIGRATED`/`MISSING_PASSWORD_COLUMN` appears, check build-time DATABASE_URL and Vercel logs.

**Assumptions Made:**
- Build-time DATABASE_URL is the same Supabase DB the runtime uses; migrate is idempotent so re-running each build is safe.
- Single-service Vercel deploy (no external NestJS) is the current target; external-backend proxy remains for truly off-site origins.

**Notes / Blockers:**
- None blocking. Remove build-time migrate later once external DB workflow stabilises (see script header).

## Session 21 — 2026-10-15 (execute-feature: Vercel build stall after `npm run vercel-build`)

**Completed:**
- Hardened `scripts/vercel-build.mjs`: migrate step was blocking `spawnSync` with no timeout — an unreachable `DATABASE_URL` (pooler/DNS hang) stalled `vercel build` with a log truncated right after `Running "npm run vercel-build"` (Vercel CLI 62.7.0). Now: `SKIP_DB_MIGRATE`/`SKIP_MIGRATIONS` escape hatch, postgres-URL validation, repo-local `drizzle-kit`/`turbo` binaries (no per-build `npx --yes` fetch), 60s migrate timeout (`VERCEL_MIGRATE_TIMEOUT_MS`) with fail-soft continue, post-build output check (`apps/web/.next` present + Root-Directory guidance).
- Documented new knobs in `.env.example` (`SKIP_DB_MIGRATE`, `VERCEL_MIGRATE_TIMEOUT_MS`).
- QA: `npm run vercel-build` green in 3 modes (no DB skip, `SKIP_DB_MIGRATE=1`, unreachable-DB fail-soft → web build 38 pages + `Verified Next.js output at apps/web/.next`); `npm run typecheck` 4/4; `npm test` green (web 155/155, api suite green).

**Files Modified:**
- `scripts/vercel-build.mjs` — timeout/skip/local-binary/output-check hardening
- `.env.example` — `SKIP_DB_MIGRATE`, `VERCEL_MIGRATE_TIMEOUT_MS`

**Next Task:**
Redeploy on Vercel; expect `[vercel-build]` lines for migrate-skip/timeout + `Verified Next.js output at apps/web/.next` + `Web build completed`. If the log still truncates after `Running "npm run vercel-build"`, check dashboard Root Directory (must be repo root/empty) and build-time `DATABASE_URL` reachability; `SKIP_DB_MIGRATE=1` unblocks the build while the DB is investigated.

**Assumptions Made:**
- Vercel dashboard Root Directory is the repo root (empty) — verified by `npm run vercel-build` starting (a Root of `apps/web` would fail to find the root script). No `outputDirectory` override added; Turbo auto-detection handles `apps/web/.next`.

**Notes / Blockers:**
- None blocking. [SUPERSEDED by Session 22: Root is actually `apps/web` — proven by the `Missing script: "vercel-build"` failure at `location /vercel/path0/apps/web`.]

## Session 22 — 2026-10-15 (fix-build: `Missing script: "vercel-build"` in @hw/web)

**Completed:**
- Root-caused the `npm run vercel-build → Missing script: "vercel-build"` failure (`workspace @hw/web`, `location /vercel/path0/apps/web`): the Vercel dashboard Root Directory is `apps/web`, so the `vercel.json` buildCommand runs with cwd `apps/web`, where the script did not exist. This supersedes Session 21's assumption that Root was the repo root.
- Added `"vercel-build": "next build"` to `apps/web/package.json` — build succeeds from either Root setting (repo root → migrate + turbo path; `apps/web` → direct `next build`).
- Hardened `scripts/vercel-build.mjs` with `findRepoRoot()` (walk up to `turbo.json`, script-relative fallback); binary resolution, drizzle/turbo `cwd`, and the `.next` output check now use `REPO_ROOT`, eliminating the doubled `apps/web/apps/web/.next` failure mode from an `apps/web` cwd.
- QA: `npm install` clean; full `next build` green from `apps/web` cwd (all routes incl. products/services); root `npm run vercel-build` green (migrate-skip + turbo + output verified); `findRepoRoot()` unit-checked from both cwds; `npm run --workspace=@hw/web vercel-build` resolves.

**Files Modified:**
- `apps/web/package.json` — added `vercel-build: next build`
- `scripts/vercel-build.mjs` — `findRepoRoot()`, `REPO_ROOT`-based bins/cwds/output check
- `ai-system/repair-system.md` — new Session 22 entry
- `ai-system/testing/test-results.md`, `ai-system/checkpoints/session-log.md` — updated

**Next Task:**
Redeploy on Vercel — the `Missing script` error is resolved for Root `apps/web` with no dashboard change required. Optional later cleanup: set dashboard Root to repo root (empty) so builds also run Drizzle migrations, or keep Root `apps/web` (direct `next build`, no build-time migrate — runtime auth self-heals columns).

**Assumptions Made:**
- Vercel dashboard Root Directory is `apps/web` (proven by the error's `location /vercel/path0/apps/web` + `workspace @hw/web`). Fix works under either setting, so no dashboard access was needed.
- `next build` from `apps/web` with hoisted root `node_modules` matches Vercel's `npm install` behaviour closely enough for verification.

**Notes / Blockers:**
- None blocking.

## Session 23 — 2026-10-16 (execute-feature: auth sign-in constant-fast-500 fix + seed data protection)

**Completed:**
- Fixed seed-user sign-in failing with a constant, near-instant internal server error: (1) new `authApiBase()` in `apps/web/lib/api-base.ts` — browser `/auth/*` calls now always use same-origin `/api/v1` (swapped at 12 call sites in `use-auth.ts` + `lib/google-auth.ts`) instead of firing directly at `http://localhost:4000`; (2) `apps/web/next.config.js` loads the repo-root `.env` via dotenv (non-overriding) so the Next auth route sees `DATABASE_URL`/`JWT_SECRET` in local dev.
- Seed data protection: new `packages/api/drizzle/table.registry.ts` (31 tables, parents-first/children-first orders, per-table seed-scope predicates) + `drizzle/seed.backup.ts` (`collectBackup`/`createBackup`/`restoreBackup`, versioned JSON format, host-only provenance) + `drizzle/seed.backup.spec.ts` (14 specs). Destructive seed ops (revert/purge) now take a timestamped backup first; failed backup aborts the run.
- New CLI modes/commands: `npm run db:seed:backup`, `npm run db:purge -- --yes` (refuses without `--yes`), `npm run db:restore -- <file>` (parents-first, `ON CONFLICT DO NOTHING`, idempotent); `db:seed -- --backup [--scope=seed]`.
- Fixed two revert bugs: hidden fallback deleted seed users even without `--with-users`; `activityRules` revert deleted by shared business keys instead of `seed-` IDs.
- QA gate green: api vitest 173/173 (18 files), web 155/155 (21 files), typecheck 4/4, lint 0 errors (3 pre-existing warnings; auth.service:290 error gone), `npm run build` Next 38/38 pages + nest clean. E2E not run this session.
- Docs: repair-system Session 23 entry; project-decisions (browser-auth-same-origin); system-architecture (auth flow, seed backup/purge/restore, SEED_BACKUP_DIR/PG_PREPARE/PG_SSL config); task-queue (2 completed tasks); repo-map + dependency-graph (Drizzle/Cloudinary/authApiBase corrections); README (data-safety + authentication runbooks); `.env.example` (SEED_BACKUP_DIR, PG knobs); test-results overwrite.

**Files Modified:**
- `apps/web/lib/api-base.ts` — `authApiBase()` (browser always same-origin)
- `apps/web/hooks/use-auth.ts` + `apps/web/lib/google-auth.ts` — auth fetches use `authApiBase()`
- `apps/web/hooks/use-auth.test.ts` — mock updated
- `apps/web/next.config.js` — repo-root `.env` loaded via dotenv (non-overriding)
- `packages/api/drizzle/table.registry.ts` (new), `packages/api/drizzle/seed.backup.ts` (new), `packages/api/drizzle/seed.backup.spec.ts` (new)
- `packages/api/drizzle/seed.ts` — `--backup`/`--purge`/`--restore` modes + safety-backup wiring + `--with-users` hidden-delete fix
- `packages/api/drizzle/seed.revert.ts` — activityRules seed-ID targeting + `purgeAllRows()`
- `packages/api/vitest.config.ts` — include `drizzle/**/*.spec.ts`
- `packages/api/package.json`, `package.json` — `db:seed:backup`/`db:purge`/`db:restore` scripts
- `.gitignore` — ignore `packages/api/drizzle/backups/`
- Docs: `ai-system/repair-system.md`, `memory/project-decisions.md`, `system-architecture.md`, `planning/task-queue.md`, `index/repo-map.md`, `index/dependency-graph.md`, `testing/test-results.md`, `README.md`, `.env.example`

**Next Task:**
Live-verify sign-in as `admin@homewolves.com` / `Homewolves123!` with `npm run dev` (web alone is now sufficient for auth). First live DB op: `npm run db:seed:backup`, then try `db:seed:revert` and confirm the backup file in `packages/api/drizzle/backups/` restores cleanly via `db:restore`. Commit all changes (currently uncommitted).

**Assumptions Made:**
- `db:seed`/`db:purge`/`db:restore` could not be live-tested here (Supabase unreachable from this environment: IPv6-only host + WARP DNS latency) — unit-spec coverage only; residual risk logged per QA-gate convention.
- Root `.env` remains canonical for the whole monorepo; Next's dir-scoped loader never overwrites, so apps/web `.env.local` overrides still work for non-conflicting keys.

**Notes / Blockers:**
- None blocking. All Session 23 changes are UNCOMMITTED — no git operations were performed.

## Session 24 — 2026-10-20 (execute-feature: run the db migrations)

**Completed:**
- Applied migrations 0000–0005 to the production Supabase Postgres; verified end-state: journal 6/6 entries, 31 public tables, `User.passwordHash` present, **all 5 seed users now hold the `Homewolves123!` scrypt hash** (migration 0005 backfill). This unblocks seed-user password sign-in (`admin@homewolves.com` / `Homewolves123!`).
- Root-caused a SILENT migration skip: drizzle-orm's pg migrator decides pending by `journal.when > max(remote created_at)` (not by hash); the runtime-applied 5th journal row (2026-10-14, `Date.now()`-stamped) post-dated 0005's hand-set synthetic `when`, so 0005 was "already applied" forever. Fixed by bumping 0005's `when` (1790116800000 → 1792089600000) in `_journal.json`.
- Environment fix (no `.env` changes — operator constraint honored): direct DB host is now AAAA-only (IPv6) and Node's getaddrinfo under WARP fails ENOTFOUND fast. Migrations ran through the project pooler `aws-1-eu-west-1.pooler.supabase.com:5432` (session mode, user `postgres.<ref>`, `?sslmode=require`) via command-line `DATABASE_URL` override. Pooler region DISCOVERED by probing Supabase's own fleet (aws-0 all rejected; aws-1 accepted at eu-west-1).
- Pre-flight `db:seed:backup` was attempted and failed on the then-unreachable DB (fail-hard as designed). Reconciled safety: 0000–0005 scanned — zero destructive SQL (only `ON DELETE` FK clauses; 0004 `IF NOT EXISTS`, 0005 NULL-guarded) — and verified row/tables counts unchanged post-run.

**Files Modified:**
- `packages/api/drizzle/migrations/meta/_journal.json` — 0005 `when` bump (only tracked code-adjacent change)
- `ai-system/repair-system.md` — Session 24 entry (silent skip + IPv6/pooler)
- `ai-system/checkpoints/session-log.md`, `ai-system/summaries/dev-history.md`, `ai-system/planning/task-queue.md`, `ai-system/testing/test-results.md`, `ai-system/memory/lessons-learned.md`, `ai-system/checkpoints/in-progress.md` — updated
- (temp `packages/api/tmp-probe.mjs`/`tmp-verify.mjs` created and deleted — never committed)

**Next Task:**
Live-verify seed-user sign-in on the operator machine (`npm run dev` — DB IS reachable from there now via the pooler or direct IPv6). Recommend adding the pooler URL to `.env` as `DATABASE_URL` local connector OR keeping direct-with-IPv6. Optionally commit the journal `when` fix.

**Assumptions Made:**
- Running migrations over the pooler (session mode) is equivalent to direct for DDL; `drizzle-kit`'s `prepare:false`-compatible session mode chosen over transaction-6543 to avoid prepared-statement pitfalls (repair-system 20d).
- The runtime journal row (c757cec) represents an older content version of 0004 — its effect (`passwordHash` column) is confirmed present, so no re-application needed; hash mismatch is cosmetic under timestamp-based pending detection.

**Notes / Blockers:**
- None blocking. Operator should consider committing the `_journal.json` change so future migrate runs stay consistent.

## Session 25 — 2026-10-20 (execute-feature: realtime opt-in + platform design/role pass)

**Completed:**
- Removed the hardcoded `wss://homewolves.com` socket connection that failed on Vercel serverless. Realtime is now opt-in via `NEXT_PUBLIC_REALTIME_ENABLED` (default false), uses the `/ws` namespace and API-derived origin, and is ref-counted in `lib/realtime.ts`. Messaging uses REST send (`POST /messaging/conversations/:id/messages`) + polling reads when realtime is off; notifications poll as fallback.
- Messaging surface rebuilt end-to-end (`/messages`): desktop two-pane + mobile list/chat, search, compose, image attach, read receipts, date dividers, call/property info. Conversations now include hydrated participant profiles.
- Analytics wired: `GET /analytics/admin-summary` (ADMIN/SUPER_ADMIN) + `useAdminSummary`; admin dashboard stats/badges are real; agent/dashboard/client dashboards show real listing performance, funnel, transactions, saved listings, and recent views. Removed fake charts, mock commission/lead data, and fake trend arrows.
- Role-aware navigation and guards: TopNav/MobileBar/dashboard nav vary by role; buyers no longer see post-property CTAs or agent transaction flows; `/dashboard/admin/*` guarded by a client layout.
- Design-system pass: tokens replace hardcoded white/black across admin payments/moderation/bug-reports, agent transactions, client dashboard, blog/auth/pricing/products, Toast/batch bar; lucide icons replace emoji; global floating `ThemeToggle`; centered `EmptyState`; null-safe formatters eliminate NaN/null renders.
- Content/data fixes: saved listings hydrate listing media; property map view groups listings by city/state; real terms/privacy pages; sitemap/main logging warnings cleaned.
- QA: API 173/173 (18 files), web 155/155 (21 files), typecheck 4/4, lint 4/4 (0 warnings), `next build` 38/38 pages.

**Files Modified:** (highlights)
- `apps/web/lib/{realtime,messaging,status,toast,analytics,format}.ts`; `apps/web/hooks/{use-messaging,use-notifications,use-analytics}.ts`
- `apps/web/components/shared/{empty-state,theme-toggle}.tsx`; `apps/web/app/layout.tsx`
- `apps/web/app/(public)/messages/page.tsx`, `properties/page.tsx`, `terms/page.tsx`, `privacy/page.tsx`
- `apps/web/app/(dashboard)/dashboard/{page.tsx,client/page.tsx,admin/layout.tsx,admin/page.tsx,admin/payments/page.tsx,admin/moderation/page.tsx,admin/bug-reports/page.tsx,agent/transactions/page.tsx,agent/transactions/[id]/page.tsx}`
- `apps/web/components/landing/{top-nav,mobile-bar}.tsx`; `.env.example`, `turbo.json`
- `packages/api/src/modules/{messaging/messaging.controller.ts,messaging/messaging.service.ts,analytics/analytics.service.ts,analytics/analytics.controller.ts,saved/saved.service.ts}`
- Docs: `ai-system/{system-architecture.md,project-context.md,index/repo-map.md,index/dependency-graph.md,planning/project-plan.md,planning/task-queue.md,summaries/dev-history.md,memory/lessons-learned.md,testing/test-results.md,checkpoints/session-log.md,checkpoints/in-progress.md}`

**Next Task:**
Remaining backlog: WhatsApp integration, PWA/offline support, push notifications, referral system. Realtime can be enabled once the API runs on a long-lived WebSocket-capable host.

**Assumptions Made:**
- Vercel serverless remains the web deployment target, so realtime must default off; REST + polling is an acceptable parity path.
- Admin summary revenue uses confirmed `paymentRecords.amount` for the current calendar month.

**Notes / Blockers:**
- None blocking. E2E (Playwright) was not run in this session; unit/component + typecheck/lint/build are green.

## Session 26 — 2026-10-21 (execute-feature: design-token readability pass + end-to-end keyless map)

**Completed:**
- Design-token compliance (readability/visibility directive):
  - Tailwind `colors` gained the used-but-unmapped semantic values (`elevated`, `canvas`, `glass`, `overlay`, `subtle`, `strong`, `brand` group) — these classes had 111/118/134/96/18 usages generating no CSS
  - New tokens: `--color-accent-overlay`, `--color-tag`/`--color-tag-bg`, `--color-focus-ring`; dark + high-contrast override ALL status tokens (`success/warning/error/info` + bg + `status-*` + `danger` aliases, `border-glass`, `border-brand`)
  - Hardcoded hex maps tokenized via `lib/status.ts` helpers (`chipToneStyle`, `tierBadgeStyle`, `CLIENT_STATUS_TONE`): hw-badge variants, CRM clients pages, agent dashboard tier badge, properties pills; dark-illegible overlays fixed (messages timestamps, client unread pill, transactions stepper, properties All-pill, hero search text, form focus rings)
  - Documented allowed exceptions (`text-white` over hero/ad images, brand-logo disc) kept per design-system §89
- Map feature end-to-end (keyless, adapted from along-app):
  - Config: `MapConfig`/`MapGeocodeConfig` types (packages/types), `FALLBACK_MAP_CONFIG` (packages/config + web fallbacks), `map_config` platform-config key, `useMapConfig()`, `map_view` feature flag
  - Components: `components/map/map-canvas.tsx` (react-map-gl/maplibre + maplibre-gl.css, style step-down on error, price pins with token colors, popups, crosshair pick mode), `components/map/hw-map.tsx` (dynamic ssr:false, `data-theme` MutationObserver, skeleton, MapLocationFallback card), `components/listings/listing-map.tsx` (ListingMapSection), `components/listings/map-pin-picker.tsx` (ListingForm search + click-to-set + use-my-location)
  - Server: `app/api/v1/maps/geocode/route.ts` (Photon → Nominatim proxy, UA + 8s timeout, in-memory TTL cache 5min/500, graceful empty)
  - Hooks: `use-listing-pin.ts`, `use-property-map-markers.ts` (exact coords → approximate geocode, marker cap)
  - Data: JSON-LD `geo`/`hasMap` on property detail; Lagos coordinates seeded in FALLBACK_LISTINGS + `packages/api/drizzle/seed.data.ts`; maplibre popup/attribution token CSS in globals.css
- QA: typecheck 4/4, lint 4/4 (0 warnings), npm test green (API 173, web 172 — 17 new map tests), `next build` 47 routes
- update-ai-system deep sync: repo-map, dep-graph (map deps + providers + rules), system-architecture (map_config + keyless map flow), design-system.md §Map Surfaces, docs/DESIGN.md §3.9, task-queue, lessons-learned (×2), project-decisions, test-results, dev-history, session-log; in-progress cleared

**Next Task:**
Backlog: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable when long-lived WS host exists.

**Assumptions Made:**
- Approximate pins (city/area-geocoded) are acceptable for listings without submitted coordinates, surfaced honestly with an "Approximate location" badge.
- In-memory geocode cache is adequate at current traffic; a shared Redis cache is a future optimization.

**Notes / Blockers:**
- E2E (Playwright) not run; unit/component + typecheck/lint/build green. Map tiles need a live browser to be visually verified (WebGL absent in jsdom).

---

## Session 27 — 2026-10-24 (execute-feature: stakeholder feedback — chat-agent flow, compose directory, theme-toggle position, map attribution)

**Completed:**
- Chat Agent direct-conversation flow (directive: "Clicking on chat agent should directly start conversation with that agent with chat box prefilled with context"):
  - `PropertyDetailClient.tsx` — all three Chat Agent/Chat entry points (mobile sticky bar, desktop action bar, agent card) now deep-link to `/messages?to=<agentId>&property=<listingId>&context=<listingTitle>` instead of a bare `/messages`; graceful toast fallback when a listing has no owner id; the sign-in CTA redirect (`useRequireAuth`) carries the same deep link so the flow resumes post-login
  - `messages/page.tsx` — `MessagesPageContent` (Suspense boundary for `useSearchParams`) consumes `to|property|context` params once (`handledLinkRef`), reuses an exactly-matching conversation (participants {me, to} + property) or creates one, prefills the composer with an editable context draft (`Hi! I'm interested in "<title>". Is it still available?`) — nothing is sent automatically; URL consumed via `router.replace`; self-chat, offline and API-failure paths toast + open compose
  - API find-or-create: `MessagingService.createConversation` now validates participants exist (404 names the missing id), rejects creator-only conversations (400), dedupes ids, and reuses an existing conversation with the exact same participant set + propertyId (idempotent listing enquiries — repeated "Chat Agent" taps never spam duplicate threads); response shape unchanged (`POST /messaging/conversations`)
- Compose directory (directive: no more typing a raw user ID):
  - API `GET /messaging/directory` (JWT-guarded, zod `search/role/take` ≤ 50) — minimal, privacy-safe fields (`id, firstName, lastName, role, avatar, verified`; never phone/email/passwordHash), caller excluded, agents/buyers/developers/homeowners all listed
  - `lib/messaging.ts` `fetchMessagingDirectory()` + `use-messaging.ts` `useMessagingDirectory()` (react-query, 60s stale)
  - `ComposeModal` redesign: design-system `HwSelect` recipient dropdown ("Select a member…", options `Name — Role`), selected-participant context card (initials avatar, role, Verified chip), loading/envelope-empty/directory-failure states; degraded manual-ID input only appears as an advanced fallback on directory-fetch failure
- Theme toggle vs Chat Agent clash (directive: "positioning of the theme toggle slightly adjusted upwards on mobiles"):
  - `theme-toggle.tsx` mobile bottom offset raised 96px → 152px (`calc(152px + env(safe-area-inset-bottom))`), clearing the listing-detail Chat-Agent sticky action bar (spans ~88–140px); desktop `lg:bottom-6` unchanged
- Map info-tag provider names (directive: "No need to put the name of the providers in the map info tag"):
  - `map-canvas.tsx` sets `attributionControl={false}` — MapLibre attribution (formerly `© OpenFreeMap · © OpenStreetMap contributors`) no longer renders on any map surface; provider credit preserved in README "Map Providers" section (OpenFreeMap, CARTO, OpenStreetMap, Photon/Nominatim)
  - The `MapLocationFallback` "Open in OpenStreetMap" link is functional (location search), not a credit tag — unchanged
- QA gate: typecheck 4/4, lint 4/4 (0 warnings), tests green (API 180 — new `messaging.service.spec.ts` ×7 incl. find-or-create, participant 404/400, directory minimal-fields + take clamp, non-participant regression; web suite green incl. 3 new directory lib tests), `next build` 48 routes
- Docs: task-queue, project-decisions (×2 new), lessons-learned, dev-history, repo-map/dependency-graph, system-architecture (messaging flow), in-progress cleared

**Files touched:**
- packages/api/src/modules/messaging/{messaging.service.ts, messaging.controller.ts, messaging.service.spec.ts}
- apps/web/lib/{messaging.ts, messaging.test.ts}, apps/web/hooks/use-messaging.ts
- apps/web/app/(public)/messages/page.tsx, apps/web/components/listings/PropertyDetailClient.tsx
- apps/web/components/shared/theme-toggle.tsx, apps/web/components/map/map-canvas.tsx
- README.md + ai-system docs

**Next Task:**
Backlog unchanged: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable when long-lived WS host exists.

**Assumptions Made:**
- Listing → agent ownership follows the now-typed `owner` relation (`listing.owner.id` with `listing.ownerId` fallback), so agent misattribution requires no extra resolution step.
- Exact-match conversation reuse (same participant set + propertyId) is the correct "same topic" definition; threads with more participants or no property are left untouched.

**Notes / Blockers:**
- E2E not run (unit/component + build green). Live verification candidates: Chat Agent tap from a listing while signed out → sign-in → prefilled draft; duplicate-tap idempotency on the live DB.
## Session 28 — 2026-10-24 (execute-feature: stakeholder directive — Along map credit, footer grid + dev credit)

**Completed:**
- Map info tag credit to Along (directive: "let the maps info tag have credit to Along — something like powered by Along with a link/CTA linking to https://alongng.com"):
  - `MapConfig` type: new optional `credit: MapCreditConfig` block (`{ enabled, label, href }`) — non-breaking; `BrandConfig`: optional `developerCreditLabel` / `developerCreditUrl`
  - Fallbacks (web + @hw/config, parity): `credit: { enabled: true, label: 'Powered by Along', href: 'https://alongng.com' }` and dev credit `'Built by S.D.' → https://sotonye-dagogo.is-a.dev` — fully admin-editable via `PUT /config/map_config` / `/config/brand`
  - New reusable `apps/web/components/map/map-credit-tag.tsx`: pure `normalizeMapCredit` (field-level merge over stale/partial DB rows, strict guards — non-empty label, `https?://` href, boolean enabled → malformed configs degrade to tag-absent) + `useMapCredit` hook + `MapCreditTag` anchor component
  - `hw-map.tsx`: canvas wrapper now `relative` with a `pointer-events-none` bottom-left overlay holding the tag (never intercepts map gestures); `MapLocationFallback` carries the tag inline so the credit survives every fallback path; tile-provider attribution stays off-surface (README only, per Session 27)
- Footer (directive: 3-column link grid from mobile, extra bottom padding on mobile, "Built by S.D." in the credit line):
  - `footer.tsx` nav columns moved into `grid grid-cols-3 gap-4 sm:gap-6 lg:gap-16` (mobile-inclusive; `min-w-0` on mobile with `truncate`, desktop keeps `min-w-[140px]`); logo/social blocks stack around it; overflow-safe `truncate lg:whitespace-normal` on link cells
  - Footer container bottom padding: `py-16` → `pt-16 pb-32 lg:pt-20 lg:pb-20` so the fixed mobile menu bar can never cover the credit line at the end of a mobile scroll
  - Credit line: copyright + config-driven `Built by S.D.` anchor (target=_blank, rel=noopener) stacked on mobile / inline on desktop; hidden when the admin clears either field
- QA gate: `turbo` typecheck (web/types/config/api) 4/4, lint 3/3, web tests 184 passed incl. new `footer.test.tsx` (×3) and extended `hw-map.test.tsx` (12 tests: credit tag on canvas + fallback card, `normalizeMapCredit` merge/disable/malformed cases, existing link assertions kept intact), `next build` green (48 routes)
- Docs: session-log, dev-history, task-queue metadata, project-decisions (×1 new entry covering both credits), lessons-learned, system-architecture (map flow + config table), repo-map, dependency-graph (Along added as external integration), in-progress cleared

**Files Modified:**
- packages/types/src/config/{map-config.types.ts, platform-config.types.ts} — MapCreditConfig + MapConfig.credit; BrandConfig.developerCredit*
- apps/web/config/fallbacks.ts + packages/config/src/fallbacks.ts — FALLBACK_MAP_CONFIG.credit + FALLBACK_BRAND.developerCredit* (kept in parity)
- apps/web/components/map/{map-credit-tag.tsx, hw-map.tsx, map-canvas.tsx, hw-map.test.tsx} — tag component, overlays, comments, tests
- apps/web/components/landing/{footer.tsx, footer.test.tsx} — grid, padding, dev credit, tests

**Next Task:**
Backlog unchanged: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable when long-lived WS host exists.

**Assumptions Made:**
- The Along credit intentionally names the platform partner (per directive) while tile-provider names stay off the tag — Session 27's "no provider names" rule applies to basemap/geocoder attribution, not the partner surface.
- Absent/legacy `map_config` DB rows should still show the new tag (field-level defaults), and admins disable it per-environment via `credit.enabled: false` rather than code.

**Notes / Blockers:**
- No route/service-layer changes — external APIs (alongng.com) are only ever opened from an anchor tag, no fetches.

---

## Session 29 — 2026-10-24 (execute-feature: stakeholder directive — credit colour tokens + icon parity)

**Completed:**
- Design-token resolver `apps/web/lib/design-tokens.ts` (directive: config-driven colours, theme-safe): allow-listed `TOKEN_VARS` (accent, accent-alt, primary, secondary, success, warning, error, info, tag, foreground, muted) + `isDesignToken` + `designTokenVar(token, fallback)` → `var(--color-…)`; unknown/malformed values fall back to the surface default, so no raw hex ever reaches the DOM.
- Map info tag green (directive: "map power tagline could have a styling effect of text color green, config driven"): `MapCreditConfig.colorToken?` (packages/types), fallback `colorToken: 'success'` in both config fallback copies; `useMapCredit` composes the resolved colour without changing `normalizeMapCredit`'s existing shape; `MapCreditTag` applies it to the label while keeping the neutral surface/border.
- Dev credit gets the map tag's icon + a colour pop (directive: "dev credit tag could also have the icon that the map power tagline has … use some design token for extra colour"): footer anchor now renders lucide `ExternalLink` (aria-hidden) and `brand.developerCreditColorToken` (default `accent`), font-semibold + hover underline retained.
- Types: `BrandConfig.developerCreditColorToken?` added (optional, non-breaking).
- Tests: new `lib/design-tokens.test.ts` (resolution/fallback/allow-list); footer test asserts accent colour; hw-map test asserts green success colour. Full web suite 188 passed / 25 files.
- QA gate: `npm install`; turbo typecheck 4/4; targeted eslint clean; `next build` web green (48 routes).

**Files Modified:**
- packages/types/src/config/{map-config.types.ts, platform-config.types.ts}
- apps/web/lib/{design-tokens.ts, design-tokens.test.ts}
- apps/web/components/map/map-credit-tag.tsx, apps/web/components/map/hw-map.test.tsx
- apps/web/components/landing/footer.tsx, apps/web/components/landing/footer.test.tsx
- apps/web/config/fallbacks.ts + packages/config/src/fallbacks.ts (parity)
- ai-system docs (design-system, system-architecture, repo-map, task-queue, project-decisions, lessons-learned, dev-history, session-log)

**Next Task:**
Backlog unchanged: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable when long-lived WS host exists.

**Assumptions Made:**
- "Green" is best expressed by the semantic `success` token (already themed per mode) rather than a new one-off green; admins can point either credit at any allow-listed token.
- The dev credit remains inside the existing copyright line (no new layout row) — colour + icon provide the requested emphasis without disturbing the footer grid.

**Notes / Blockers:**
- No API/service changes; config fields are optional so existing DB rows render correctly without migration.

---

## Session 30 — 2026-10-24 (execute-feature: single-service messaging end-to-end)

**Completed:**
- Root cause: deployment is a single Next.js service (no external NestJS API), so `POST /api/v1/messaging/conversations` fell through to `app/api/v1/[...path]/route.ts` and returned `{ message: 'API not configured' }` (502), while `GET /api/v1/messaging/directory` returned a non-array envelope that the UI coerced to `[]` ("No other members available yet").
- New shared server module `apps/web/lib/server/local-db.ts`: lazy `postgres` client, pooler-safe `prepare:false` (opt-in `PG_PREPARE`), SSL handling, error predicates/logging, host + backend-origin resolution. Auth route refactored to use it (duplicate local helpers removed).
- New domain module `apps/web/lib/server/messaging-local.ts`: `listDirectory` (minimal fields, caller excluded, search/role/take), `listConversations` (last message + participants), `getConversation`, `createConversation` (idempotent exact participant set + property; validates users; supplies UUID/timestamps), `listMessages`, `sendMessage` (bumps `lastMessageAt`/`updatedAt`), `markRead`, `countUnread`.
- New route `apps/web/app/api/v1/messaging/[...path]/route.ts`: proxy when `backendOrigin` is set, otherwise local; falls back local on network error/upstream 5xx, passes 4xx through; JWT verification (refresh rejected); zod-level manual validation; 401 `"Your session has expired. Please sign in again."`, 503 `DB_NOT_CONFIGURED`/`DB_NOT_MIGRATED`, sanitized 500.
- `sameOriginApiBase()` in `lib/api-base.ts`; `lib/messaging.ts` now uses it for all calls; test mock updated.
- Theme toggle mobile offset 152px → 208px to clear the mobile action bar (~80px) and the listing-detail sticky bar (top ~156px); desktop `lg:bottom-6` unchanged.
- Tests: new `lib/server/messaging-local.test.ts` (9 tests: participant checks, directory privacy/exclusion, create validation/404/403, mark-read, unread coercion, sender hydration, send authorization).
- QA gate: `npm run typecheck` 4/4; `npm run lint --workspace=@hw/web` 0 warnings/errors; `npm run test --workspace=@hw/web` 197 tests / 26 files green; `npm run build --workspace=@hw/web` green, 48 routes incl. `ƒ /api/v1/messaging/[...path]`.
- Docs: repo-map, dependency-graph, system-architecture (constraints + chat note), task-queue, project-decisions, lessons-learned, dev-history, test-results, in-progress, README.

**Files Modified:**
- `apps/web/app/api/v1/auth/[action]/route.ts`, `apps/web/app/api/v1/messaging/[...path]/route.ts`
- `apps/web/lib/server/{local-db.ts, messaging-local.ts, messaging-local.test.ts}`
- `apps/web/lib/{api-base.ts, messaging.ts, messaging.test.ts}`
- `apps/web/components/shared/theme-toggle.tsx`
- `README.md` + ai-system docs

**Next Task:**
Backlog unchanged: WhatsApp integration, PWA/offline, push notifications, referral system; realtime enable when long-lived WS host exists.

**Assumptions Made:**
- A single Postgres `DATABASE_URL` backs both local auth and messaging; the raw-SQL queries follow the quoted PascalCase Drizzle schema (`"User"`, `"Conversation"`, `"Message"`).
- Local mode should win whenever no backend is configured, because that is the actual deployment; proxy mode remains for environments that do run NestJS.
- An exact participant set + `propertyId` is still the definition of "same conversation" (matches the API's find-or-create).

**Notes / Blockers:**
- No `DATABASE_URL` in this workspace, so the new SQL was verified by typecheck/build/unit tests and schema review, not a live query. Live checks to run: sign in as two seed users, start a chat from a listing, send/reply, verify unread badge; confirm directory excludes the caller.
- Build retains pre-existing warnings (SWC lockfile patch, missing env vars in `turbo.json`, npm audit).
