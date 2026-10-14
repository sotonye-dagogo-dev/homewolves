# Lessons Learned

> **Metadata**
> - last-updated-by: execute-feature-session-19
> - last-verified-against-code: 2026-10-14
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Practical knowledge accumulated during Homewolves development — things that worked well, things that didn't, and patterns worth repeating. Different from `repair-system.md` (tracks errors); this file tracks development process insights and architectural wisdom. Uses supersedes/superseded-by links for evolving practices.

---

## Entry Format

```
## [Lesson Title]

**Context:**
[What situation this came from]

**What We Learned:**
[The insight or pattern discovered]

**Apply When:**
[When future agents/developers should use this knowledge]

**Supersedes:** [link to any prior lesson this replaces, or None]
**Superseded by:** [link to any newer lesson that replaces this, or None]
```

---

## Lessons

## Bootstrap ai-system Before Writing Any Code

**Context:**
Project start — design exports existed but no code. Running the bootstrap command first forced a complete read of DESIGN.md and ROADMAP.md before scaffolding began.

**What We Learned:**
Understanding the full architecture before writing code prevents rework. The bootstrap process surfaced the non-negotiable patterns (PlatformConfig, audit logging, Hw* wrappers, global types) that would have been painful to retrofit.

**Apply When:**
Starting any new project or major feature. Read all ai-system docs first. Populate agent files before writing a single line of application code.

**Supersedes:** None
**Superseded by:** None

---

## Metadata-Driven UI Requires Planning the Config Schema First

**Context:**
The architectural pattern requires all UI configuration to come from PlatformConfig. This forced us to define the config interfaces (AmenityConfig, FilterPillConfig, NavItemConfig, etc.) before any component could be built.

**What We Learned:**
Defining the config schema and fallback constants upfront is essential — without them, developers fall back to hardcoded values and the pattern breaks. The `packages/config/src/fallbacks.ts` file is the single most important file for maintaining the metadata-driven pattern.

**Apply When:**
Any time a new configurable UI element is added. Define its config interface, fallback constant, and PlatformConfig route before building the component that consumes it.

**Supersedes:** None
**Superseded by:** None

---

## Global Types Simplify Cross-Module Development

**Context:**
The decision to make all types globally available (zero-import) via `packages/types/` from ROADMAP §16.

**What We Learned:**
Eliminating imports for shared types (Listing, UserRole, HwButtonProps) accelerates development significantly. No time wasted on relative path calculations or barrel file updates. The triple-slash reference pattern works reliably across Next.js and NestJS.

**Apply When:**
Any project with 2+ apps and shared types. The zero-import pattern saves substantial development time once the type package is set up correctly.

**Supersedes:** None
**Superseded by:** None

---

## Every Mutation Needs Audit From Day One

**Context:**
The audit-by-default principle from ROADMAP is a non-negotiable architectural constraint.

**What We Learned:**
Building audit into the service layer (via `AuditService`) rather than the controller layer ensures no mutation is missed. Controllers are too easy to forget. Every service method that mutates data calls `this.audit.log(...)`.

**Apply When:**
Any project requiring an audit trail. Enforce at the service layer via dependency injection, not at the route/controller layer.

**Supersedes:** None
**Superseded by:** None

---

## Design Handoff Requires Structured HTML Exports

**Context:**
The Open Design → Open Code handoff protocol defined in DESIGN.md §11.

**What We Learned:**
Having design HTML files with CSS variables matching the token names exactly, annotated section comments (`<!-- §4.1 Hero Zone -->`), and `data-state` attributes for interactive states eliminates ambiguity between design and implementation. The pixel-precise reference prevents "creative interpretation" that drifts from the intended design.

**Apply When:**
Any project with a dedicated design phase. Require designers to export HTML with the structured format defined in DESIGN.md §11.2 before implementation begins.

**Supersedes:** None
**Superseded by:** None

---

## Regenerate Prisma Client After Every Schema Change

**Context:**
Post-MVP, Phase 3 added models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) but the Prisma client was never regenerated. Services accessed them via `(this.prisma as any)` / `db(prisma as any)` helpers, hiding type safety for a whole sprint.

**What We Learned:**
A stale Prisma client silently degrades type safety across all services. Regenerating surfaced real issues the `as any` casts had masked — missing opposite-relation fields in the schema (7 of them), a missing `Subscription.plan` relation, and a `Notification` type collision (DOM global vs Prisma model). Removing the casts after regeneration is low-risk when done methodically and verified with `tsc --noEmit`.

**Apply When:**
- After ANY change to `schema.prisma` — run `prisma generate` (needs a placeholder `DATABASE_URL`).
- When cleaning up `as any` casts on Prisma access — remove the cast, run typecheck, fix what surfaces. Don't pre-emptively revert casts to hide real schema gaps.

**Supersedes:** None
**Superseded by:** None

---

## Design Tokens Must Replace Raw Tailwind Colors

**Context:**
Session 6 pixel-perfect audit found components using raw Tailwind color classes (`text-emerald-600`, `bg-emerald-100`) instead of `var(--color-*)` design tokens.

**What We Learned:**
Rapid feature development drifts toward Tailwind shorthand. The audit pass replaced raw colors with CSS variables, but only admin + transaction pages were refactored — other pages (properties, auth, blog) still carry raw hex values. Token discipline must be enforced at review time, not fixed later.

**Apply When:**
Any frontend work — use `var(--color-*)` tokens exclusively. Run `grep` for raw hex/Tailwind color classes in review.

**Supersedes:** None
**Superseded by:** None

---

## Keep JWT Strategy Payload Shape in Sync With Controllers

**Context:**
Security pass (2026-08-10). `JwtStrategy.validate()` returned `{ id, email, role }` while every controller read `req.user.sub`. Because TS controllers typed `req` as `any`, the mismatch compiled cleanly but `req.user.sub` was `undefined` at runtime — meaning mutations like `listingService.create(dto, undefined, actor)` wrote no owner. The notifications controller happened to use `req.user.id` and worked, which masked the bug.

**What We Learned:**
When a Passport strategy customizes the `validate()` return, its field names are the contract. `req.user.sub` is the JWT convention (payload `sub` claim); if `validate()` returns a different shape, all consumers break silently because `req: any`. Fix: return `{ sub, id, email, role }` so both conventions work.

**Apply When:**
- Changing `JwtStrategy.validate()` — update the returned object to include `sub`.
- Grep for `req.user.` across controllers when auth behavior seems broken but TS is green.
- Avoid `@Req() req: any` in new controllers; define a typed request user interface.

**Supersedes:** None
**Superseded by:** None

---

## Validate Inputs at the Boundary and Reject Unknown Keys

**Context:**
Security pass (2026-08-10). The API had zero input validation: DTO classes had no decorators, several controllers accepted `@Body() dto: any`, and mutation paths spread the raw body into Prisma `data`. A client could mass-assign fields (e.g. `ownerId`, `featured`) or blow up services with malformed types.

**What We Learned:**
Zod schemas + a shared `ZodValidationPipe` using `.strict()` (reject unknown keys) gives boundary validation, mass-assignment protection, and typed `z.infer` DTOs — using the already-present `zod` dependency, so no new packages. Global validation pipes are harder to retrofit when DTOs aren't decorated; per-route pipes on the existing DTO classes were the low-churn path.

**Apply When:**
- Adding any new endpoint/DTO — write a zod schema and apply `@Body(new ZodValidationPipe(schema))`.
- Use `.strict()` on all mutation schemas to block unknown-key injection.
- Keep `.coerce.number()` for numeric fields the frontend may send as strings (price, amount).

**Supersedes:** None
**Superseded by:** None

---

## Rate Limiting Should Be Redis-Backed for Multi-Instance Deploys

**Context:**
Security pass (2026-08-10). Added a global `RateLimitGuard` using an in-memory sliding-window store, registered via `APP_GUARD`, with a tighter limit on auth endpoints. This protects a single instance but each replica counts separately.

**What We Learned:**
In-memory rate limiting is fine for a single instance/dev but gives no protection when the API runs behind multiple replicas (each instance has its own window). The store is isolated in `RateLimitGuard` so a Redis-backed store (ioredis is already a dependency) can swap in without touching route decorators.

**Apply When:**
- Deploying the API with >1 instance — replace the in-memory store with Redis `INCR`+`EXPIRE` before relying on the limiter in production.

**Supersedes:** None
**Superseded by:** None

---

## Lint-Driven Type Migration: Fix the Real Type, Not the `as any`

**Context:**
Testing session (2026-08-13). `@hw/api` had 104 `no-explicit-any` errors from `@Req() req: any` in controllers and `(x as any[])` JSON casts in services. The fix wasn't blanket `eslint-disable` — it was introducing a shared typed request object.

**What We Learned:**
The `any` pattern hides a contract bug: `req.user.sub` was the canonical id but several consumers read a different shape, and the type system never caught it because `req` was `any`. Adding `AuthenticatedRequest`/`MaybeAuthenticatedRequest` + a `toActor()` helper forced every controller to agree on the JWT payload shape (see the "Keep JWT Strategy Payload Shape in Sync" lesson). Type a `where`/`data` clause once (e.g. `Prisma.ListingWhereInput`) and the whole call chain stays typed.

**Apply When:**
- Any controller still using `@Req() req: any` — replace with `AuthenticatedRequest` (or `MaybeAuthenticatedRequest` when auth is optional) and derive the actor via `toActor(req)`.
- JSON-field casts — use the concrete element type (`TransactionStep[]`, `Prisma.InputJsonValue`) instead of `as any[]`.

**Supersedes:** None
**Superseded by:** None

---

## Mock the PrismaService Shape Once and Share the Pattern Across Service Specs

**Context:**
Testing session (2026-08-13). Eight new API service specs mock `PrismaService` with `type MockFn = ReturnType<typeof vi.fn>` and `{ prisma } = { prisma: {} as unknown as PrismaService }` — a pattern already proven in the referrals/activity specs.

**What We Learned:**
Vitest mocks of a DI service (Prisma) should be built as plain objects of `vi.fn()`s cast `as unknown as PrismaService`, not via `vitest-mock-extended`'s `mockDeep` — the latter couples the mock to the generated Prisma type and breaks on regen. `vi.resetAllMocks()` in `beforeEach` keeps specs isolated. Writing the spec surfaced two real behavioral bugs (preferences replace-not-merge; `complete()` step guard) — worth fixing in the service, not papering over in the test.

**Apply When:**
- Writing any new `*.service.spec.ts` — copy the referrals spec's mock shape; assert with `expect(prisma.x.mock.calls[0][0])`.
- If a test reveals behavior that looks wrong, verify against the service contract and fix the service, then pin the test.

**Supersedes:** None
**Superseded by:** None

---

## Playwright webServer Only Boots the Web App — Stub the API in E2E

**Context:**
Testing session (2026-08-13). The `apps/web/playwright.config.ts` webServer runs `next dev` only. The API + Postgres are not booted, so auth/dashboard/transaction journeys would hit connection errors.

**What We Learned:**
Use `page.route('**/api/v1/**', ...)` to fulfill JSON fixtures for the endpoints a journey touches (auth register/verify/complete, transactions, listings, crm stats, notifications). Seed a session with `page.addInitScript(() => localStorage.setItem('hw-auth', JSON.stringify(SESSION)))` before navigating to authenticated routes. This makes journeys deterministic and CI-safe. One caveat: the dashboard layout redirects to `/auth` on first render before zustand rehydrates the seeded session, which can flake under parallel dev-server load — increase the timeout or retry (CI already sets `retries: 2`).

**Apply When:**
- Adding any E2E journey that needs authenticated/data-backed UI — stub routes + seed localStorage rather than requiring a live DB.
- Keep `e2e/smoke.spec.ts`'s pattern of static-page assertions for journeys that touch no API.

**Supersedes:** None
**Superseded by:** None

---

## API Typecheck Can Cache-Hit at the Turbo Root — Build Compiles Specs

**Context:**
Testing session (2026-08-13). `npm run typecheck` from the turbo root reported `@hw/api` green, but `nest build` failed on the newly added spec files (unused `MockFn` declarations, an invalid `category: 'BUY'` literal) because the api `build` script compiles `src/**/*.ts` including specs.

**What We Learned:**
Turbo cache hits can mask fresh type errors. The api `build` (`nest build`) is the stricter gate because it type-checks spec files that `tsc --noEmit` in a cached turbo run may skip. Always validate changed-package typecheck/build from the package directory, and keep spec files type-clean under the same strict config (no unused locals, valid literal unions).

**Apply When:**
- After editing specs — run `packages/api && npm run build` (or `npm run typecheck` directly) rather than trusting the turbo root summary.
- Keep spec files in the same `noUnusedLocals`/strict posture as source files.

**Supersedes:** None
**Superseded by:** None

---

## Config-Driven Brand Text Prevents Nav Staleness

**Context:**
Session 19 found `Homewolves`/`HW`/`H` hardcoded in 8+ nav surfaces (top-nav, dashboard, admin, properties, detail, footer, metadata) drifting from `FALLBACK_BRAND.companyName`.

**What We Learned:**
Every user-visible brand string must resolve via `useBrand()`/`FALLBACK_BRAND`/`BrandLogo` — including `aria-label`s, avatars, copyright, and metadata. A deep-selector CSS hack (`[&>span>span:last-child]`) to recolor brand text is a smell that the component needs an explicit prop (`textClassName`).

**Apply When:**
Adding any header/nav/footer/SEO surface. Never hardcode the company name or initials.

**Supersedes:** None
**Superseded by:** None
