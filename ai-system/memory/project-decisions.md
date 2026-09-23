# Project Decisions

> **Metadata**
> - last-updated-by: fix-build
> - last-verified-against-code: 2026-09-23
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Log of significant architectural, technical, and product decisions. Agents consult this before proposing changes to avoid contradicting prior reasoning. Uses supersedes/superseded-by links so contradictory entries are explicitly resolved rather than both appearing equally valid.

---

## Decision Format

```
## [Decision Title]

**Decision:** [What was decided]
**Date:** [YYYY-MM-DD]
**Made by:** [Role / Agent / Developer]
**Supersedes:** [link to any prior decision this replaces, or None]
**Superseded by:** [link to any newer decision that replaces this, or None]

**Reason:**
[Why this choice was made]

**Alternatives Considered:**
[What else was evaluated and why it was rejected]

**Implications:**
[What this decision affects going forward]
```

---

## Decisions

## NestJS over Express/Fastify

**Decision:** Use NestJS as the backend framework.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The domain model is deeply object-oriented (User hierarchy, Transaction state machine, AuditEvent append-only). NestJS provides native OOP support via classes, decorators, and dependency injection that maps directly to the domain model. Express is too unstructured for a system with mandatory cross-cutting concerns (audit logging, RBAC, feature flags) — NestJS guards, interceptors, and decorators handle these declaratively.

**Alternatives Considered:**
- **Express/Fastify:** Would require manual implementation of DI, middleware ordering, and module separation. Prone to inconsistent patterns.
- **AdonisJS:** Full-featured but smaller ecosystem and community. Less support for tRPC integration.
- **tRPC standalone server:** Possible but would lack the module/DI ecosystem needed for 16 modules with complex cross-cutting concerns.

**Implications:**
- All backend code follows NestJS conventions (modules, services, controllers, guards, interceptors)
- DI enables easy testing (mock services via providers)

---

## REST as Primary API Protocol

**Decision:** Use REST as the primary API protocol for public and internal endpoints.
**Date:** 2026-08-05
**Made by:** Implementation (v2 bootstrap)
**Supersedes:** tRPC-for-internal-API decision (original architecture planned tRPC routers)
**Superseded by:** None

**Reason:**
The implemented codebase uses NestJS REST controllers exclusively (no tRPC routers exist in `packages/api/src`). Clients (web + mobile) consume the REST API directly. Documenting REST as canonical matches the actual codebase and avoids drift between docs and reality.

**Alternatives Considered:**
- **tRPC:** Not implemented in the codebase; would require a retrofit.
- **GraphQL:** Adds complexity without sufficient benefit for a mostly-CRUD application.

**Implications:**
- All API contracts are REST controllers with DTOs validated via zod schemas + `ZodValidationPipe` (as of 2026-08-10 security pass; previously there was no runtime validation).

---

## Zod Schemas + ZodValidationPipe for Input Validation

**Decision:** Validate all REST request bodies with zod schemas through a shared `ZodValidationPipe`, using `.strict()` to reject unknown keys.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, security pass)
**Supersedes:** The (previously aspirational) "DTOs validated via class-validator" note in the REST-as-primary decision — class-validator was never installed; validation is implemented with zod.
**Superseded by:** None

**Reason:**
The API had no runtime input validation; DTO classes were unvalidated and several controllers accepted `@Body() dto: any`. `zod` was already a dependency, avoiding new packages. `.strict()` blocks mass-assignment (unknown keys never reach Prisma `data`). The pipe is applied per-route so existing non-decorated DTO classes needed no structural change.

**Alternatives Considered:**
- **class-validator + global ValidationPipe:** NestJS-idiomatic but requires adding dependencies and decorating every DTO class.
- **Manual guards/checks in each controller:** Duplicated, easy to skip.

**Implications:**
- New DTOs must export a zod schema (`*.schema`) + `z.infer` type, applied via `@Body(new ZodValidationPipe(schema))`.
- Mutation schemas use `.strict()`; numeric fields use `z.coerce.number()` to tolerate numeric-string input.
- Validation failures return `400` with `code: VALIDATION_ERROR` (handled by the now-global `GlobalExceptionFilter`).

---

## Role-Based Guards for Admin/Moderation Routes

**Decision:** Protect privileged routes with a `@Roles(...)` decorator + `RolesGuard` (checks `user.role` against allowed roles), composed as `@UseGuards(JwtGuard, RolesGuard)`.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, security pass)
**Supersedes:** The original `RbacGuard` design which called `user.hasPermission()` — the JWT strategy returns a plain `{ sub, id, email, role }` object, not a `BaseUser` instance, so permission-method checks were unimplementable without building a full role→permission matrix service.
**Superseded by:** None (may be layered onto a PlatformConfig permission matrix later)

**Reason:**
`req.user` is a plain object; role-string comparison is simple, correct for the current hierarchy, and the same check the services already perform (`role === 'ADMIN'`). Guard order in the array ensures JWT runs first and populates `req.user` before roles are checked.

**Implications:**
- Privileged routes: listings `admin/pending` + `moderate`, audit (all), config `PUT`, blog mutations, activity `seed`, transactions `payments/pending` → `@Roles('ADMIN', 'SUPER_ADMIN')`.
- Roles are compared as strings (role is a plain string from the DB via the strategy).

---

## Global In-Memory Rate Limiting

**Decision:** Register a `RateLimitGuard` as a global `APP_GUARD` (120 req/min/IP default; auth endpoints 10 req/min via `@Throttle`), using an in-memory sliding-window store.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, security pass)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The API had no rate limiting. No throttler dependency existed; a self-contained guard avoided adding `@nestjs/throttler`. The store is isolated behind the guard interface so a Redis-backed store (ioredis is already a dependency) can replace it for multi-instance production.

**Alternatives Considered:**
- **`@nestjs/throttler`:** Standard, but a new dependency; in-memory store only anyway.
- **Redis-backed from the start:** Better for multi-instance but adds operational coupling before the API is deployed at scale.

**Implications:**
- 429 responses return `{ code: 'RATE_LIMITED', message: ... }`.
- For multi-instance deployments, replace the in-memory store with Redis before relying on the limit in production.

---

## shadcn/ui Wrapper Pattern (Hw* Components)

**Decision:** Every shadcn/ui primitive must be wrapped in a Homewolves-branded `Hw*` component. Feature code never imports shadcn directly.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in DESIGN.md §3.0)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Design tokens must be applied consistently across the entire application. With direct shadcn imports in 50+ files, changing a border radius or colour would require touching every file. The wrapper pattern centralises token application, config injection, and fallback handling in one place per primitive.

**Alternatives Considered:**
- **Direct shadcn imports:** Decentralised token application — high maintenance cost.
- **Custom components from scratch:** Duplicates Radix's accessibility work.
- **Wrapping at the page/feature level:** Inconsistent — each team would apply tokens differently.

**Implications:**
- `apps/web/components/ui/` contains all wrappers — HwButton, HwInput, HwDialog, etc.
- `components/ui/index.ts` is the only import path used in feature code
- Adding a new shadcn primitive requires creating its Hw* wrapper first

---

## Global TypeScript Types (Zero-Import Pattern)

**Decision:** All shared types, interfaces, and enums are globally available via `packages/types/` with triple-slash references. No import statements needed.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md §16)
**Supersedes:** None
**Superseded by:** None

**Reason:**
With 16+ modules across multiple apps and packages, repeating imports for `Listing`, `UserRole`, `Transaction`, `HwButtonProps`, etc. creates noise and drift risk. The global type pattern eliminates import boilerplate entirely.

**Alternatives Considered:**
- **Normal package imports (`@hw/types`):** Requires every file to import; refactoring breaks imports.
- **Inlined types in each module:** Duplication — no single source of truth.
- **Prisma-generated types as canonical:** Tied to database schema — not appropriate for API shapes or UI props.

**Implications:**
- `packages/types/src/global.d.ts` uses `/// <reference path="..." />` for all type files
- Types must never be imported — lint rule should enforce this

---

## PlatformConfig for All Admin-Configurable UI

**Decision:** Every configurable UI element (navigation, filters, amenities, feature flags, notification templates, subscription plans) is stored in the `PlatformConfig` database table and served via `PlatformConfigService` with Redis caching.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The product requirement for admin-controlled UI without code deploys is non-negotiable. Storing config in the database with a Redis cache (5min TTL) provides near-instant propagation while keeping DB read overhead low. Hardcoded fallbacks in `packages/config/src/fallbacks.ts` ensure the app works even when the config service is unreachable.

**Alternatives Considered:**
- **Environment variables:** Cannot be changed without redeploy. No granular per-role config.
- **JSON files in repo:** Requires PR/deploy for every change. No audit trail.
- **Feature flag service (LaunchDarkly):** Adds external dependency, cost, and latency.

**Implications:**
- All UI components check `PlatformConfigService.get('key') ?? FALLBACK_KEY`
- Admin panel includes a Config section for each config domain
- Config updates are recorded as AuditEvents

---

## Subscription ↔ SubscriptionPlan Prisma Relation (added 2026-08-10)

**Decision:** Add the missing `Subscription.plan` relation (`SubscriptionPlan.subscriptions` back-relation) to `packages/api/prisma/schema.prisma`.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, Prisma client regeneration task)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The `Subscription` model had a `planId` column but no relation field. The `SubscriptionsService` already used `include: { plan: true }`, `sub.plan?.features`, and `sub.plan?.slug` — the relation was intended but missing from the schema. It was previously invisible because the stale Prisma client accessed everything through `(this.prisma as any)`. Regenerating the typed client surfaced it as a compile error. The relation was added to match existing code rather than removing the usage.

**Alternatives Considered:**
- **Remove `include: { plan: true }` usage:** Would have lost plan data the frontend expects; the relation is clearly intended.

**Implications:**
- Schema now requires `prisma generate` (needs placeholder `DATABASE_URL` in CI).
- No DB migration exists yet in the repo (`prisma/migrations/` not present) — schema is applied via seed/db push in the current workflow.

---

## PostgreSQL FTS Phase 1 → Meilisearch Phase 5

**Decision:** Use PostgreSQL full-text search for MVP. Migrate to Meilisearch in Phase 5.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Avoiding external search infrastructure during MVP accelerates initial delivery. PostgreSQL FTS (tsvector) handles basic keyword search, filtering, and ranking adequately for a Phase 1 marketplace.

**Alternatives Considered:**
- **Meilisearch from day one:** Additional infrastructure and cost during MVP.
- **Elasticsearch:** Overkill for current scale.
- **Algolia:** External dependency with usage-based pricing.

**Implications:**
- Search uses PostgreSQL FTS for Phase 1
- Meilisearch migration planned for Phase 5

---

## update-ai-system.md triggers: conditional, not unconditional

**Decision:** `update-ai-system.md` fires only on the conditional triggers defined in each command's `Chains to` row (architecture-affecting work in `execute-feature.md`, an emptied sprint table in `dev-cycle.md`, always in `refactor-codebase.md`, major drift in `resume-session.md`, and always in `cloud-session.md`) — not after every task unconditionally.
**Date:** 2026-08-13
**Made by:** v3 upgrade (opencode session)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The v3 spec (§10.3) explicitly flagged this as a judgment call. `update-ai-system.md` is the *heavier* sibling of `sync-context.md` by v2's own design; running the full deep sync after every trivial `[XS]`/`[S]` task would burn tokens on work that only `sync-context.md`'s lightweight check needs. The conditional set is the point where skipping the deep sync is actually risky.

**Alternatives Considered:**
- Unconditional invocation on the four named commands — rejected: predicts many trivial-task deep syncs per day, violating the token/context-economy goal (§12). It remains a one-line override per command if the operator prefers it.

**Implications:**
- Five commands now carry mandatory `Chains to` triggers that invoke `update-ai-system.md` automatically under their conditions — its own `Does NOT` contract is worded accordingly (invoked explicitly or via a command's mandated chain trigger, never on a schedule).
- `verification-rules.md` and `audit-drift.md` check chain order mechanically from `session-log.md`, so a skipped trigger is caught, not trusted.

---

## Drizzle ORM replaces Prisma in `packages/api`

**Decision:** Migrate `packages/api` from Prisma (`@prisma/client`) to Drizzle ORM — schema in `src/drizzle/schema.ts`, `DrizzleModule`/`DrizzleService` (`@Global`), services use raw query-builder chains (`db.select()/insert()/update()/delete()`) and `db.query.<table>` relational finders.
**Date:** 2026-08-13
**Made by:** Implementer (Session 7)
**Supersedes:** All Prisma-related decisions referencing `packages/api/prisma/schema.prisma` and `PrismaService` (the Prisma client regeneration decision 2026-08-10, the Subscription-relation Prisma decision above).
**Superseded by:** None

**Reason:**
Drizzle gives a typed SQL query builder with no codegen step (no stale-client class of bugs), is closer to SQL, and its generated migration workflow (`drizzle-kit`) is offline-generatable — CI has no live Postgres, so `db:generate` produces `0000_faithful_moira_mactaggert.sql` without a connection.

**Alternatives Considered:**
- **Keep Prisma:** Generated client was a recurring source of staleness; `prisma generate` requires a `DATABASE_URL`.
- **Kysely:** Type-safe but no schema DSL/relations built in.

**Implications:**
- Specs use a new shared mock `packages/api/src/test/drizzle.mock.ts` (`createChain` thenable proxy + `createDrizzleMock`) instead of a Prisma mock.
- New services must use `DrizzleService` query chains and enum consts from `src/drizzle/schema.ts`, not the Prisma client.
- `db:push`/`db:migrate`/`db:seed` require real Supabase credentials — the generated migration is unapplied until a live DB is available.

---

## CategoryBento link mapping (web audit rectification)

**Decision:** CategoryBento cards link to `/properties?category=<pill-id>` where the bento category maps to a real filter pill: `sale→sale`, `rent→rent`, `shortlet→shortlet`, `land→land`, `new-dev→new_dev`; `direct-brief` (no pill) links to `/properties` (all).
**Date:** 2026-08-13
**Made by:** Implementer (Session 7, verify-work web audit)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The cards were `role="button"`+`tabIndex=0` with no click handler — a dead interactive region. Mapping to existing filter pill ids means the properties page can consume the `category` query param directly.

**Implications:**
- The `new_dev` pill currently applies no category filter (its `queryParam` is `type`, not `category`; the properties page has no type-filter plumbing) — it highlights the chip and shows all listings. A future type-filter pass can wire it.
- The properties page initializes `search` and `activePill` from URL query params via `window.location.search` in state initializers (avoids `useSearchParams` Suspense coupling) and treats unknown `category` values as `all`.

---

## Google OAuth via Supabase Auth (Google-only)

**Decision:** Google is the sole OAuth provider, routed through Supabase Auth. The browser flow: `supabase.auth.signInWithOAuth()` → `/auth/callback#access_token=…` → `POST /api/v1/auth/supabase` with the Supabase access token → `AuthService.exchangeSupabaseToken()` verifies the Supabase JWT via `SUPABASE_JWT_SECRET`, find-or-creates the user, returns HW JWTs.
**Date:** 2026-08-19
**Made by:** Implementer (Session 8)
**Supersedes:** Any future multi-provider OAuth shortcut
**Superseded by:** None

**Reason:**
The Google provider client ID/secret must live in the Supabase dashboard, not `.env` (Supabase-managed). The user decided the OAuth transport/verification should use Supabase (environment already provisioned) rather than a hand-rolled Google OAuth endpoint.

**Alternatives Considered:**
- **Google OAuth2 directly (ID token verification):** More moving parts (client secret in env, refresh-token management) and duplicates what Supabase already manages.
- **next-auth:** Another dependency + session model to reconcile with the existing zustand `hw-auth` store.

**Implications:**
- `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` needed in `.env` for the web client; `SUPABASE_JWT_SECRET` needed for token verification at the exchange endpoint. Without it, the exchange returns an error and the web callback shows a fallback message.
- `users` gained `provider`/`providerId` columns (migration `0001`).
- `use-auth.ts` gained the `exchangeSupabase` action and persists the session in the existing `hw-auth` zustand store.

---

## Config-driven Resend email infrastructure (DB-backed, admin-editable)

**Decision:** Transactional emails are config/metadata-driven end-to-end: `emailTemplates` table holds subject/body/active per template key; `EmailService` (in the `@Global` EmailModule) resolves DB row → `FALLBACK_EMAIL_TEMPLATES` in `packages/config/src/fallbacks.ts`, renders `{{var}}` placeholders, sends via Resend, and writes an `emailLogs` row. When `RESEND_API_KEY` is unset, sends are simulated (logged as `simulated`) and never block the caller. Admins edit templates at `/dashboard/admin/email-templates`.
**Date:** 2026-08-19
**Made by:** Implementer (Session 8)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Matches the platform's metadata-driven principle (like PlatformConfig): admins change email copy without deploys, fallbacks keep the system functional offline/without the DB, and email outages can never break a business flow.

**Alternatives Considered:**
- **Hardcoded template strings in services:** Not admin-editable; would drift from the config-driven convention.
- **Third-party email UI (e.g., Resend hosted templates):** Splits copy control out of the platform; the user wants an in-house admin GUI.

**Implications:**
- `EmailModule` is `@Global()`; feature services only add `private emailService: EmailService` to their constructor (no module imports).
- `EmailTemplate` type is global via `packages/types/src/global.d.ts` (both API and web tsconfigs include it); API does not depend on `@hw/config`.
- Template keys in use: `otp_code`, `welcome`, `transaction_created`, `transaction_completed`, `transaction_rejected`, `transaction_cancelled`, `payment_confirmed`, `subscription_activated`, `signature_requested`, `listing_approved`, `listing_rejected`, `referral_signup`, `price_drop` (all seeded in `email-templates.defaults.ts`).
- `RESEND_FROM_EMAIL`/`RESEND_FROM_NAME` in `.env` configure the sender.

---

## Blog create flow accepts `featured` (parity with update)

**Decision:** `createBlogPostSchema` accepts an optional `featured` boolean (matching `updateBlogPostSchema`), `BlogService.create` persists it, and the web `createBlogPost` lib type includes it. The admin new-post form already submits `featured`.
**Date:** 2026-08-19
**Made by:** Implementer (Session 8)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The admin post form always submits `featured`; the strict zod schema rejected the unknown key on create (only update accepted it). This aligns the create contract with the UI.

**Implications:**
- New blog posts can be marked featured from the first save.
- `lib/blog.ts` `createBlogPost` accepts `featured?: boolean`.

---

## DocuSeal webhook verified with HMAC (matching Paystack)

**Decision:** The DocuSeal signatures webhook (`POST /api/v1/signatures/webhook`) verifies the `X-Docuseal-Signature` header: value format `[timestamp].[signature]`, hex HMAC-SHA256 of `${timestamp}.${rawBody}` keyed by `DOCUSEAL_WEBHOOK_SECRET` (`whsec_…`), 5-minute replay tolerance, timing-safe compare. When `DOCUSEAL_WEBHOOK_SECRET` is unset, verification passes (dev bypass) — matching the Paystack webhook's existing dev-bypass convention.
**Date:** 2026-08-19
**Made by:** Implementer (Session 9)
**Supersedes:** None
**Superseded by:** None

**Reason:**
DocuSeal webhook carried no signature check, so a forged POST could advance signature/transaction state. Paystack already verified HMAC; DocuSeal documents the same pattern. The dev bypass keeps local dev (no secret) working exactly like Paystack.

**Implications:**
- `docuseal.client.ts` exposes `verifyWebhookSignature(rawBody, signature)`; controller returns 401 `UnauthorizedException` on invalid/stale/malformed signatures.
- `DOCUSEAL_WEBHOOK_SECRET` documented in `.env.example`; unset = skip verification (log it in prod deployment checklist).

---

## `JWT_SECRET` fails hard in production (dev fallback only outside prod)

**Decision:** One shared `resolveJwtSecret()` in `packages/api/src/common/config/env.ts`: returns `process.env.JWT_SECRET` when set, else `homewolves-dev-secret`, and **throws** when `NODE_ENV=production` and `JWT_SECRET` is unset. `jwt.strategy.ts`, `auth.module.ts`, and a `main.ts` boot check all use it.
**Date:** 2026-08-19
**Made by:** Implementer (Session 9)
**Supersedes:** The implicit per-file `process.env.JWT_SECRET ?? 'homewolves-dev-secret'` fallbacks
**Superseded by:** None

**Reason:**
The dev fallback silently deployed would sign every token with a public secret. Failing fast in production prevents a misconfigured deploy; dev/test keep working with the deterministic fallback (vitest runs with `NODE_ENV=test`).

**Implications:**
- Production boot aborts (throw) if `JWT_SECRET` unset — caught in `main.ts`.
- Test/CI unaffected (fallback active outside `production`).

---

## Redis-backed rate limiter with in-memory fallback

**Decision:** The global rate-limit guard now injects a pluggable store via the `RATE_LIMIT_STORE` token. Factory in `rate-limit.module.ts` selects `RedisRateLimitStore` (ioredis sorted-set sliding window) when `REDIS_URL` is set and connects, otherwise `MemoryRateLimitStore` (sliding window, 10k bucket cap) with a warning. Both implement `RateLimitStore.hit(key, limit, ttlMs) -> {allowed, count}`.
**Date:** 2026-08-19
**Made by:** Implementer (Session 9)
**Supersedes:** The single in-memory `Map` sliding window inside `RateLimitGuard`
**Superseded by:** None

**Reason:**
The in-memory limiter is per-instance, so a multi-instance deploy multiplies the effective limit. Redis makes limits shared and consistent; falling back to memory when Redis is absent keeps local dev and single-instance deploys working without infra.

**Implications:**
- `REDIS_URL` set + reachable → Redis store (graceful; a bad Redis URL logs a warning and falls back).
- `RateLimitGuard` is now async; semantics unchanged (120/min default, 10/min auth).
- Unit coverage via `rate-limit.store.spec.ts` (memory store) + integration 429 test.

---

## Web auth redirect gated on zustand hydration

**Decision:** `use-auth.ts` (zustand `persist`) gained a non-persisted `hydrated` flag set via `useAuth.persist.onFinishHydration`. The dashboard layout only runs `router.replace('/auth')` and only renders the dashboard when `hydrated && accessToken`, otherwise it shows the loading state.
**Date:** 2026-08-19
**Made by:** Implementer (Session 9)
**Supersedes:** The layout's unconditional `if (!accessToken) router.replace('/auth')` on mount
**Superseded by:** None

**Reason:**
zustand v4 `persist` rehydrates **asynchronously** (a promise chain), so on slow loads the mount-time `useEffect` could observe `accessToken === null` before hydration finished and bounce an already-logged-in user to `/auth`. The E2E admin-journey suite caught this as a flaky auth redirect.

**Implications:**
- The redirect and the "Loading dashboard..." gate are now driven by `hydrated`; no flash-to-auth for logged-in users.
- Same pattern should be reused by any future mount-time guard on persisted zustand state.

---

## SEO verified already present; blog detail stays a client component

**Decision:** No SEO code changes this sprint — listing detail already has `generateMetadata` + JSON-LD, and `app/sitemap.ts` + `robots.ts` already exist. The blog detail page remains a client component with client-side JSON-LD (no server `generateMetadata`); converting it to a server component is out of scope for MVP.
**Date:** 2026-08-19
**Made by:** Implementer (Session 9)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The "SEO" sprint item was already implemented (verify-only). Blog detail's client-render JSON-LD is acceptable for MVP; a server-component conversion is a separate perf task. Listings `take` is capped at 50 in the controller, so sitemap lists at most 50 listings — accepted for MVP.

**Implications:**
- Sitemap covers listings (`?take=500&status=ACTIVE`) + blog (`?published=true&limit=500`); controllers clamp `take` to 50 — sitemap completeness bounded by that.
- Blog detail JSON-LD is emitted client-side only.

---

## Next.js SWC lockfile patch requires `NEXT_IGNORE_INCORRECT_LOCKFILE=1` (env quirk)

**Decision:** Documented (not code-fixed) environmental workaround: `next build` in this workspace warns "Found lockfile missing swc dependencies, patching…" and then crashes the patch step because Next 14.2.35's `optionalDependencies` pin `@next/swc-*@14.2.33` while `patch-incorrect-lockfile.js` fetches registry metadata for version 14.2.35 (missing). Setting `NEXT_IGNORE_INCORRECT_LOCKFILE=1` makes the build skip the patch and succeed (compilation + static generation unaffected).
**Date:** 2026-08-19
**Made by:** Implementer (Session 9)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The prior session's `npm install` pruned the non-current-platform `@next/swc-*` entries from `package-lock.json`; Next's auto-patch then tries to re-add them at the wrong version and crashes. Not a code or build-output issue.

**Implications:**
- CI/build hosts must set `NEXT_IGNORE_INCORRECT_LOCKFILE=1` (or ensure the lockfile carries all 9 `@next/swc-*` entries).
- The two present entries (`swc-linux-x64-gnu`, `swc-win32-x64-msvc` @14.2.33) are correct for this machine.

---

## Icon system consolidation to lucide-react + next/image optimization (Session 10)

**Decision:** Consolidate all UI icons to `lucide-react` (the project's icon library per design-system §15) and migrate critical user-media `<img>` to `next/image`. Replace isolated hand-drawn `<svg>` and emoji-as-icon usage in PropertyDetailClient, properties feed, dashboard layout, blog/not-found/error, and pricing checkmarks.
**Date:** 2026-09-02
**Made by:** Implementer (Session 10 hardening)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Engineering principle §15 prohibits ad-hoc SVG/emoji icons. `lucide-react` was already a dependency and used in 8 files; inline SVG and emoji drifted in via rapid feature work. `next/image` improves LCP and CLS vs raw `<img>` for gallery/feed/similar/cover images.

**Alternatives Considered:**
- Keep emoji/SVG — rejected: violates §15, inconsistent a11y, no design-token control.
- Introduce @phosphor-icons/react as second library — rejected: duplicates lucide, extra bundle.

**Implications:**
- New UI must import icons from `lucide-react`; isolated `<svg>` and emoji icons are lint-flagged via verification-rules §15.
- Remote images require `next.config.js` `remotePatterns` entries (now includes `**.supabase.co`, `res.cloudinary.com`).

---

## Canonical site URL and env parity (Session 10)

**Decision:** Canonical `NEXT_PUBLIC_SITE_URL` is `https://homewolves.com` (real `.env`), not `https://homewolves.africa`. `.env.example`, `apps/web/app/layout.tsx` (`metadataBase`/`openGraph`/`twitter`/`canonical`), `sitemap.ts`/`robots.ts` and JSON-LD URLs now default to `homewolves.com`. Sitemap `take` clamped to 50 (controller max).
**Date:** 2026-09-02
**Made by:** Implementer (Session 10)
**Supersedes:** The `homewolves.africa` default in earlier sessions/docs
**Superseded by:** None

**Reason:**
Real `.env` already uses `homewolves.com` (Supabase live keys, Resend sender `hello@mail.homewolves.com`). Docs and fallbacks drifted to `.africa` and produced mismatched OG/sitemap URLs. Clamping `take` to 50 prevents silent API limit.

**Implications:**
- `.env.example` now mirrors real `.env` structure (Supabase URL/publishable/JWT, Resend, Paystack, DocuSeal, Redis, `NEXT_IGNORE_INCORRECT_LOCKFILE`).
- SEO URLs (og, jsonLd, sitemap, robots) derive from `NEXT_PUBLIC_SITE_URL` at runtime; unset → `homewolves.com`.

---

## Service wrappers cover all external providers + Health check surface (Session 11)

**Decision:** Every external provider is accessed through a dedicated wrapper in `packages/api/src/common/integrations/` per §17: `PaystackClient`, `DocuSealClient`, `SmsClient` (Termii), `StorageClient` (S3/R2), `EmailService` (Resend), `Redis` (ioredis via `RateLimitModule`). New `HealthModule` (`GET /health` liveness, `GET /health/ready` readiness) reports per-service `configured` + DB latency as the single management surface.
**Date:** 2026-09-16
**Made by:** Implementer (execute-feature tightening pass)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The directive requires all services operational through wrappers that make management/resolution easier and guarantee end-to-end operation even when providers are unconfigured (graceful degradation). The health endpoints make wrapper status observable without inspecting env/logs.

**Alternatives Considered:**
- One-off SDK calls per feature — rejected: violates §17, makes provider swaps costly.
- Separate health per integration — rejected: single `/health/ready` already aggregates.

**Implications:**
- New integrations must add a wrapper in `common/integrations/` and export it from `IntegrationsModule (@Global)`.
- `HealthService` uses `DrizzleService.execute(sql\`SELECT 1\`)` for DB probe — requires `DrizzleService.execute` passthrough.
- `RbacGuard` is deprecated (alias to `RolesGuard`) — new code uses `@Roles` + `RolesGuard`.

---

## Reversible seed via deterministic `seed-` IDs + manifest (Session 11)

**Decision:** Seed rows use deterministic `seed-` prefixed IDs (users, listings, media, blogPosts, activityRules) and manifest-driven keys/slugs (platformConfig, emailTemplates, subscriptionPlans). `drizzle/seed.data.ts` is the single source for IDs/keys; `drizzle/seed.revert.ts` deletes only `LIKE 'seed-%'` / manifest entries in FK-safe order, leaving post-seed user data untouched. CLI supports `npm run db:seed -- --revert [--with-config] [--with-users]` and npm aliases `db:seed:revert` / `db:seed:revert:full`.
**Date:** 2026-09-16
**Made by:** Implementer (execute-feature tightening pass)
**Supersedes:** The previous seed that only handled platformConfig + subscriptionPlans with no revert.
**Superseded by:** None

**Reason:**
The directive requires seeded data that can be reverted without affecting post-seed data. Prefix + manifest makes seeded vs user data disjoint by construction; no schema migration (`isSeed` column) needed.

**Implications:**
- New seed tables must use `seed-` IDs and be registered in `SEED_MANIFEST`.
- Revert by default keeps platformConfig/subscriptionPlans (may have been customized) — pass `--with-config` to remove them; keeps users unless `--with-users` (FK-safe after clearing dependents).
- Seed is idempotent (`onConflictDoUpdate`).

---

## Thorough responsiveness & mobile-bar sweep + global public navbar + toast + direct Google OAuth (Session 12)

**Decision:** Adopt: (1) `apps/web/app/(public)/layout.tsx` global public layout with `TopNav` + `MobileBar` + `Footer` and `pb-[84px]` mobile bottom padding; remove per-page MobileBar duplicates; (2) `ToastProvider` (`components/shared/Toast.tsx`) mounted in root layout with `useToast()` + `hw-toast` CustomEvent bridge and `aria-live` region, to give global feedback on mutations/loading states; (3) dashboard layout unauthenticated CTA (`Sign in to continue`) instead of infinite `Loading dashboard...` (hydrated+!token path); (4) direct Google OAuth via `POST /api/v1/auth/google` (`googleLoginSchema`) verified at `https://oauth2.googleapis.com/tokeninfo` (`GOOGLE_CLIENT_ID` audience check), `lib/google-auth.ts` GSI loader + `use-auth.exchangeGoogle` — Supabase `POST /auth/supabase` retained as legacy fallback; (5) pricing `.map is not a function` fix — normalize `fetchPlans` / `PricingPage` to handle both `Array` and `{plans: Array}` shapes + `Array.isArray` guards on `features`; (6) `FALLBACK_LISTINGS` now carry 2-4 `media` entries per seed listing so gallery is demonstrably multi-image; (7) API proxy resilience: 8s timeout, `502/503/504` fallback injection, `QueryProvider` retry for gateway errors; (8) responsive hardening: `overflow-x:hidden` on html/body, detail page sticky action bar offset to `bottom:80px` (above MobileBar), sidebar no longer `overflowY:auto` with constrained height, map placeholder not pushing actions, no emoji SVGs (lucide only).

**Date:** 2026-09-22
**Made by:** Implementer (execute-feature thorough sweep)
**Supersedes:** Google OAuth via Supabase Auth decision (now legacy fallback); dashboard hydrated-redirect decision (now CTA)
**Superseded by:** (3) only — Session 17 redirects unauth dashboard to `/auth?redirect=` instead of CTA; (4) env surface superseded by Session 17 server-only Google env (no `NEXT_PUBLIC_GOOGLE_CLIENT_ID`). Other points remain active.

**Reason:**
The issue directive reported non-responsive overflow, mobile bar obscuring content, missing navbar on public pages, dashboard infinite loading, missing global feedback, single-image listings, pricing `.map` crash, Supabase-coupled OAuth, and Bad Gateway. All are user-visible production blockers, so they were bundled.

**Alternatives Considered:**
- Keep Supabase as primary OAuth — rejected per directive (vendor-coupled, extra hop).
- Keep per-page MobileBar imports — rejected: duplicates global layout, causes double bars on detail page.

**Implications:**
- New public pages automatically get TopNav/MobileBar — no per-page imports needed.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` required for Google button; unset → disabled button with helper text.
- `ToastProvider` is the single feedback surface — feature mutations should call `useToast().success/error` rather than `alert()`.
- `FALLBACK_LISTINGS` media shape is now multi-image; API proxy still returns paginated demo data when DB is absent.

---

## Dashboard/public error boundaries complement root (Session 11)

**Decision:** Added `apps/web/app/(dashboard)/error.tsx` and `apps/web/app/(public)/error.tsx` as segment-level error boundaries (in addition to existing `app/error.tsx` + `app/global-error.tsx`). Dashboard variant logs `[dashboard]`, public variant is standalone.
**Date:** 2026-09-16
**Made by:** Implementer (execute-feature tightening pass)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The directive requires error boundaries on all pages — root alone is insufficient for segment-isolated recovery (dashboard stays interactive when a public page fails and vice versa).

**Implications:**
- New route groups that need isolated recovery should add their own `error.tsx`.

---

## Config-driven logo via BrandConfig (Session 13)

**Decision:** Logo/favicon/companyName/tagline are config-driven via `BrandConfig` type in `packages/types/src/config/platform-config.types.ts`. `useBrand()` hook in `apps/web/hooks/use-platform-config.ts` reads from PlatformConfig with `FALLBACK_BRAND` fallback (both API config package and web config package). Top-nav, footer, layout metadata, and email templates all derive branding from this single source. Email templates receive `{{logoUrl}}` and `{{siteUrl}}` as automatic variables injected by `EmailService.send()`.
**Date:** 2026-09-22
**Made by:** Implementer (execute-feature config-driven pass)
**Supersedes:** Hardcoded logo URLs and company names in components
**Superseded by:** None

**Reason:**
Engineering principle §1 mandates config-driven over hardcoded. Logo/branding was hardcoded in top-nav, footer, layout metadata, and email templates. Centralising in PlatformConfig means admins can rebrand without code deploys.

**Alternatives Considered:**
- Keep hardcoded logos — rejected: violates §1, requires code changes for rebranding.
- Env-only config — rejected: cannot be changed without redeploy, no admin UI.
- Separate brand config service — rejected: PlatformConfig already handles this pattern.

**Implications:**
- New UI components should use `useBrand()` for logo/company name, not hardcoded values.
- `FALLBACK_BRAND` must be updated when branding changes (checked in both `packages/config/src/fallbacks.ts` and `apps/web/config/fallbacks.ts`).
- Email template `{{logoUrl}}` is auto-injected; templates should use `<img src="{{logoUrl}}"/>` not `<img src="/logo.png"/>`.

---

## Bug report system with batch management (Session 13)

**Decision:** Bug reports use a dedicated `bugReports` table with `BugReportStatus` (OPEN, UNDER_REVIEW, CLOSED) and `BugReportType` (BUG, FEATURE_REQUEST, UI_ISSUE, PERFORMANCE, OTHER) enums. User submission at `/bug-report` (type + description + optional screenshots via client-side FileReader), admin management at `/dashboard/admin/bug-reports` with paginated table, inline status editing, and batch operations (status change + delete) powered by a universal `useBatchSelection` hook + `HwBatchBar` floating component. Email notifications fire on submission and status changes.
**Date:** 2026-09-22
**Made by:** Implementer (execute-feature bug report pass)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Users need a structured way to report bugs/features without leaving the platform. Admins need to triage, assign status, and batch-process reports. The batch selection system is reusable for any future batch-action UI (e.g., bulk listing moderation).

**Alternatives Considered:**
- Third-party bug tracker (Jira/Linear) — rejected: adds external dependency, user leaves platform.
- Simple contact form — rejected: no status tracking, no batch ops, no audit trail.
- Generic moderation queue — rejected: bug reports have distinct fields (type, screenshots) vs. content moderation.

**Implications:**
- `useBatchSelection` hook is universal — reuse for any list with batch actions.
- `HwBatchBar` accepts custom `BatchAction[]` for flexible batch operations.
- Bug report screenshots stored as data URLs (client-side FileReader) — max 3 per report. Consider S3 storage for production scale.
- `emailService.send()` auto-injects `{{logoUrl}}` and `{{siteUrl}}` — all templates can use these variables.

---

## Cloudinary replaces S3/R2 for file storage (Session 14)

**Decision:** File storage uses Cloudinary (`cloudinary` npm SDK) instead of S3/R2-compatible HTTP PUT. Env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (default: `"homewolves"`). `StorageClient` wraps `cloudinary.v2` — `uploader.upload()` for uploads, `uploader.destroy()` for deletes, `url()` for public URLs. Same graceful degradation: unconfigured → simulated mode.
**Date:** 2026-09-22
**Made by:** Implementer (execute-feature env audit)
**Supersedes:** S3/R2 storage decision (Session 11 wrappers)
**Superseded by:** None

**Reason:**
User prefers Cloudinary for easier setup, management, and familiarity. Cloudinary provides a managed media CDN with on-the-fly transformations, which is better suited for a marketplace with listing images than self-managed S3/R2 buckets. The 4-variable config (cloud name, API key, API secret, folder) is simpler than the 9 S3/R2 variables.

**Alternatives Considered:**
- Keep S3/R2 — rejected: user preference for Cloudinary; S3 requires more infra setup.
- AWS S3 native SDK — rejected: same complexity as R2, additional dependency.
- Uploadcare/Imgix — rejected: user chose Cloudinary specifically.

**Implications:**
- `CLOUDINARY_FOLDER` enables organised folder structures (e.g. `homewolves/listings`, `homewolves/avatars`).
- Cloudinary auto-generates responsive image URLs — can be leveraged for listing galleries.
- `next.config.js` `remotePatterns` may need `res.cloudinary.com` added (already has `**.supabase.co`).
- Health check `storage` status now reports `cloudName` + `folder` instead of `endpoint` + `bucket`.

---

## Google OAuth env vars corrected (Session 14)

**Decision:** `.env.example` documents Google OAuth as server-only `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (web GSI receives the client ID via server-serialized `FALLBACK_GOOGLE_OAUTH` / platform config — **`NEXT_PUBLIC_GOOGLE_CLIENT_ID` removed** per Session 17 directive). `GOOGLE_CLIENT_SECRET` added to `.env.example`, `turbo.json`, and `README.md`.
**Date:** 2026-09-22
**Made by:** Implementer (Session 14 env audit)
**Supersedes:** None (partially superseded by Session 17: public client ID var dropped)
**Superseded by:** Session 17 local-auth/server-only Google env decision for the `NEXT_PUBLIC_*` half; server secret + audience-check vars remain valid.

**Reason:**
The web client (`google-auth.ts`) reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID` but it was missing from `.env` — the Google sign-in button would show "Configure Google OAuth" instead of rendering. The API reads `GOOGLE_CLIENT_ID` with fallback. Both should be set to the same client ID value. `GOOGLE_CLIENT_SECRET` was defined in `.env` but never documented anywhere. Session 17 later removed the public var entirely so the client ID is not exposed as a separate NEXT_PUBLIC surface.

**Implications:**
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in server env; do not reintroduce `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- `GOOGLE_CLIENT_SECRET` is available for future server-side token exchange if needed.

---

## Error boundary → bug report integration with error metadata (Session 15)

**Decision:** All error boundaries include a "Report" button that opens an `ErrorReportModal`. The modal pre-fills a bug report (type=BUG) with error details captured from the boundary: `errorMessage`, `stackTrace` (collapsible), `componentName`, `url`, `digest`. The bug report DB schema was extended with 4 nullable columns to persist this metadata. This gives developers Sentry-like context when users report errors.
**Date:** 2026-09-22
**Made by:** Implementer (execute-feature error boundary pass)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Error boundaries previously only logged to console. Users had no way to report errors, and developers had no context when they did. The modal approach keeps the error boundary UI clean while providing a clear CTA for reporting.

**Alternatives Considered:**
- Auto-submit on error — rejected: requires authentication, may send duplicate/noisy reports.
- External Sentry integration — rejected: user wants in-house bug reporting system.
- Link to `/bug-report` page — rejected: loses error context (stack trace, component name) during navigation.

**Implications:**
- Error reports require authentication (API returns 401 without token). Unauthenticated users see the modal but submission will fail — can be enhanced later with anonymous reports.
- `bugReports` table now has 13 columns (was 9). Migration `0003` adds the 4 new nullable columns.

---

## useRequireAuth hook for auth-gated actions (Session 15)

**Decision:** All user-facing actions that require authentication (Chat, Schedule Inspection, Post Property) use a `useRequireAuth()` hook that shows a toast with "Sign in" CTA instead of silently failing or redirecting. The hook returns `{ requireAuth, isAuthenticated }` — callers gate their action on `requireAuth('Action description')`. Toast duration extended to 5000ms for CTA readability.
**Date:** 2026-09-22
**Made by:** Implementer (execute-feature auth UX pass)
**Supersedes:** The dead `emitToast` function and inert buttons in PropertyDetailClient
**Superseded by:** None

**Reason:**
Guest users clicking Chat Agent, Schedule Inspection, or other buttons got no feedback — the buttons either did nothing (no onClick) or dispatched a DOM event that the Toast system never listened for. The `useRequireAuth` pattern provides consistent, non-disruptive auth gating across the app.

**Alternatives Considered:**
- `router.push('/auth')` on every unauthenticated click — rejected: disruptive, loses page context.
- Modal login prompt — rejected: more complex, toast is lighter and less intrusive.
- Disable buttons for guests — rejected: less discoverable, users don't know why buttons are disabled.

**Implications:**
- New interactive components should use `useRequireAuth()` for auth gating instead of manual `if (!accessToken) router.push('/auth')`.
- The `hw-toast` CustomEvent bridge now works — components can dispatch toasts via `window.dispatchEvent(new CustomEvent('hw-toast', { detail: { message, type, action } }))`.

---

## Unauthenticated dashboard routes redirect to /auth (Session 17)

**Decision:** Unauthenticated visits to any `(dashboard)` route redirect to `/auth?redirect=<pathname>` (with a 3s safety timeout) instead of showing a "Sign in to continue" CTA or hanging on loading. `use-auth.ts` always sets `hydrated:true` after rehydration so the redirect fires immediately when no token exists.
**Date:** 2026-09-23
**Made by:** Implementer (fix-build multi-issue repair)
**Supersedes:** Session 12 decision (3) — dashboard layout unauthenticated CTA (`Sign in to continue`) instead of infinite loading; Session 12 note that hydrated-redirect was replaced by CTA.
**Superseded by:** None

**Reason:**
Directive required that unauthenticated `/profile` → `/dashboard/client` not stick on infinite loading. A direct redirect preserves the intended destination (`?redirect=`) and matches E2E expectations (`agent-dashboard` unauth test expects `/auth`). The CTA approach left users on a dead-end dashboard shell.

**Alternatives Considered:**
- Keep Session 12 CTA (`Sign in to continue`) — rejected: less seamless, loses the original destination unless also wired with `?redirect=`.
- Client-side only guard without layout redirect — rejected: slower, depends on each page's own auth check.

**Implications:**
- New dashboard pages inherit the redirect automatically via layout; do not re-implement per-page auth redirects for guests.
- Preserve `?redirect=` when building auth CTAs elsewhere (toasts, `useRequireAuth`).

---

## Hero search is a native form with client enhancement (Session 17)

**Decision:** Hero search box uses `<form action="/properties" method="GET">` with `name="search"` input and `type="submit"` button; `onSubmit` preventDefault + `router.push` when hydrated. Works without JS via full-page GET navigation.
**Date:** 2026-09-23
**Made by:** Implementer (fix-build E2E repair)
**Supersedes:** Prior hero search as non-form `div` with only `onKeyDown`/`onClick` handlers.
**Superseded by:** None

**Reason:**
E2E showed Enter did not navigate when React handlers were not yet hydrated. A real form gives progressive enhancement and better a11y (implicit Enter-to-submit).

**Alternatives Considered:**
- Wait for hydration in the E2E test — rejected as masking a real UX gap for slow connections.
- Keep `type="button"` + onClick only — rejected: no native submit, same hydration dependency.

**Implications:**
- Search UIs should be real forms first; enhance with SPA navigation second.
- Input needs `name` to serialize into the GET query string.

---

## Local server-side auth when API is unreachable (Session 17)

**Decision:** Web app implements email/OTP auth in `app/api/v1/auth/[action]/route.ts` + `lib/server/auth-local.ts` when `backendOrigin()` is null; proxies to NestJS when available. JWT is HS256 from `JWT_SECRET` (dev fallback); OTP stored in HMAC-signed HttpOnly cookie; email via Resend fetch when `RESEND_API_KEY` set. OTP returned in response body only when `NODE_ENV !== 'production'`.
**Date:** 2026-09-23
**Made by:** Implementer (fix-build issue 5)
**Supersedes:** Reliance on a deployed NestJS API alone for email auth (502 "API not configured" in production).
**Superseded by:** None

**Reason:**
No NestJS API is deployed; `backendOrigin()` is null in production, so register/login returned 502. Local auth keeps email/OTP flow working while the API remains undeployed, with transparent proxy when an API origin is configured.

**Alternatives Considered:**
- Deploy NestJS first — blocked: no deploy credentials in this environment.
- Static "coming soon" on auth — rejected: directive required working email auth.

**Implications:**
- Prod env must set `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL` (if proxying), and optionally `RESEND_API_KEY`.
- When an API is later deployed, set `API_ORIGIN`/`backendOrigin` so the route proxies instead of using local mode.
- `postgres` is a direct `@hw/web` dependency (not only root/api) so Vercel webpack resolves the auth route import; listed in `experimental.serverComponentsExternalPackages`.

---
