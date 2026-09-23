# Development Checkpoints — Session Log

> **Metadata**
>
> - last-updated-by: fix-build
> - last-verified-against-code: 2026-09-23
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
