# Development Task Queue

> **Metadata**
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-09-16
> - last-synced: 2026-09-16 (Session 11 — tightening: wrappers/seed/testing/audit)
> - staleness-policy: re-verify before each session

> **Overview:** Sprint-level task queue with complexity tagging. Agents execute tasks top to bottom within the current sprint. Each task is sized so it can be completed in a single session. Sprint 1–3 are complete; the current focus is hardening, Backlog items, and the next scheduled phase.

---

## Complexity Tags

Tags help agents self-select whether a task needs the full `execute-feature.md` pipeline or a lighter `dev-cycle.md`:

| Tag | Meaning | Recommended Command |
|-----|---------|-------------------|
| `[XS]` | Trivial — single file, known pattern | dev-cycle.md |
| `[S]` | Small — 1-3 files, well-understood | dev-cycle.md |
| `[M]` | Medium — 3-8 files, some planning needed | dev-cycle.md with plan-feature pre-read |
| `[L]` | Large — feature spanning modules | execute-feature.md |
| `[XL]` | Very large — architecture-affecting | execute-feature.md, requires architect role |
| `[BUG]` | Bug fix | fix-build.md |

---

## Current Sprint

> **Section summary:** Post-MVP hardening and completion of remaining Phase 1 backlog items.

| Size | Task | Status |
|------|------|--------|
| [M] | Regenerate Prisma client so new models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) are typed instead of `(this.prisma as any)` | [x] |
| [M] | Security pass — audit all REST routes for guards, rate limiting, input validation | [x] |
| [L] | Testing setup — unit tests for core services, component tests, E2E Playwright journeys | [x] |
| [M] | SEO — `generateMetadata()` on listing pages, sitemap.xml, robots.txt, JSON-LD schema | [x] |
| [M] | Error handling — verify GlobalExceptionFilter coverage, error boundaries on all pages | [x] |
| [BUG] | Sanitize blog post HTML rendering (`dangerouslySetInnerHTML`) before production | [x] |
| [M] | Wire activity points into service-layer hooks for automatic awarding | [x] |
| [M] | API integration tests — supertest route-level tests (validation, auth guards, 404s) | [x] |
| [M] | E2E admin journey — approve/reject a listing, review payment evidence | [x] |
| [M] | Hardening — routing/icons/SEO/env parity (Session 10: icon consolidation to lucide-react, layout metadata hardening, sitemap/robots base fix, next/image migration, .env.example parity) | [x] |
| [XL] | Prisma→Drizzle ORM migration (`packages/api`) — schema, services, mock-based specs, initial migration | [x] |
| [M] | Web audit rectification — clickable bento/cards, URL search+category params, Link nav, loading.tsx, next/image | [x] |
| [XL] | Supabase/Drizzle compliance + Google OAuth + Resend email infrastructure + admin GUIs (email templates + blog CRUD) | [x] |

---

## Up Next

| Size | Task |
|------|------|
| [L] | WhatsApp integration |
| [L] | Analytics engine (agent/listing performance, funnel tracking) |
| [L] | React Native app (Expo) parity — listings + auth screens |
| [M] | PWA offline support (IndexedDB/AsyncStorage fallback) |
| [M] | Push notifications — FCM/APNs |

---

## Backlog

| Size | Task |
|------|------|
| [M] | Referral code system |
| [M] | Referral tracking + commission attribution |
| [L] | Subscription billing — Paystack integration |
| [L] | Featured listing / ad placement system |
| [XL] | AI chatbot / recommendations |
| [M] | E-signature integration |
| [L] | Meilisearch migration (Phase 5) |
| [L] | Multi-region deployment config |

---

## Completed This Sprint

| Task | Completed |
|------|-----------|
| Sprint 1 — Core Marketplace MVP (scaffolding, auth, listings, feed, detail, save/recent) | [x] |
| Sprint 2 — Agent & Communication (CRM, dashboard bento, messaging, notifications) | [x] |
| Sprint 3 — Transactions & Client Portal (deal stepper, payments, activity points, moderation, blog) | [x] |
| Navigation audit + route repairs (landing CTAs, mobile bar, legal pages) | [x] |
| Build repair pass (lint/format fixes, `npm run build` green) | [x] |
| Regenerate Prisma client — new models typed, `(this.prisma as any)` casts removed | [x] |
| Security pass — REST route guards, rate limiting, zod input validation | [x] |
| Testing setup — 187 unit tests (93 API + 94 web), 16 E2E journeys, lint/typecheck/build green | [x] |
| Prisma→Drizzle ORM migration — 28-table schema, all services + DTOs + gateway ported, 93 mock-based specs green, initial migration generated | [x] |
| Web audit rectification — bento/cards linkable, properties page reads `search`+`category` URL params, footer `next/link`, dashboard notification rows clickable, `loading.tsx` added, hero/landing cards use `next/image` | [x] |
| Supabase/Drizzle compliance + Google OAuth + Resend email infrastructure + admin GUIs — users provider cols, `POST /auth/supabase` exchange, `@Global` EmailModule (DB-backed templates + fallbacks + logs), 13 email hook points, `/dashboard/admin/email-templates` + `/dashboard/admin/blog` GUIs, 111 API + 100 web tests green | [x] |
| Sprint close-out + security hardening (SEO verify, activity-point hooks, supertest integration tests, E2E admin journey, DocuSeal webhook HMAC, JWT secret fail-hard, Redis rate limiter w/ fallback, web auth hydration fix, DB migration applied) | [x] |
| Hardening (routing/icons/SEO/env parity) — layout metadataBase/openGraph/twitter/canonical/viewport, sitemap take clamped to 50, .env.example aligned to real .env (homewolves.com), dashboard nav/icons + property detail + properties feed + blog/not-found/error migrated to lucide-react + next/image | [x] |
| Tightening (wrappers/seed/testing/audit — Session 11) — SmsClient+StorageClient+HealthModule (wrappers per §17, `isConfigured`, simulated fallback, `/health` + `/health/ready`), reversible seed (`seed-` IDs + manifest, `db:seed:revert`), error boundaries `(dashboard)/(public)/error.tsx`, RbacGuard deprecated, 153 API + 100 web + 22 E2E green | [x] |

---

## Notes

- Google OAuth (2026-08-19): routed via Supabase Auth — provider client ID/secret live in the Supabase dashboard; `SUPABASE_JWT_SECRET` in `.env` verifies access tokens at `POST /api/v1/auth/supabase` (real exchange blocked until set). `@supabase/supabase-js` added to `apps/web`.
- Transactional email (2026-08-19): `@Global` EmailModule — `emailTemplates`/`emailLogs` tables (migration `0001`), `{{var}}` rendering, simulated log-only delivery when `RESEND_API_KEY` unset, 13 template keys, admin-editable at `/dashboard/admin/email-templates`.
- Blog (2026-08-19): `createBlogPostSchema` now accepts `featured` (parity with update); blog API supports `published=all` for admin; admin GUI at `/dashboard/admin/blog` (list/create/edit/publish/delete) with a dependency-free rich-text editor.
- Web test env (2026-08-19): vitest `pool: 'threads'` (forks worker timed out under Node v25/Windows) + in-memory Storage polyfill in `vitest.setup.ts` (jsdom `localStorage` broken under Node v25).

- Prisma has been fully replaced by Drizzle (2026-08-13): `packages/api/prisma/` and `packages/api/src/prisma/` deleted; `@prisma/client` removed. Drizzle schema in `src/drizzle/schema.ts` (28 tables, 5 enums); migrations `drizzle/migrations/0000_faithful_moira_mactaggert.sql` + `0001_grey_killmonger.sql` (users `provider`/`providerId`, `emailTemplates`, `emailLogs`) generated via `npm run db:generate` (offline-safe). `db:push`/`db:migrate`/`db:seed` need real Supabase credentials — CI has no live DB.
- Drizzle specs use the shared mock `packages/api/src/test/drizzle.mock.ts` (`createChain` thenable proxy + `createDrizzleMock`) instead of a Prisma service mock.
- Notification dispatch is currently synchronous; BullMQ async queue with retries is planned.
- API security hardening landed 2026-08-10: global rate limiting (in-memory sliding window, 120 req/min/IP default, 10 req/min on auth), zod-based validation pipes on all REST DTOs, role-based guards (`@Roles`) on admin/moderation/audit/config routes, JWT identity fix (`req.user.sub` now populated), and `GlobalExceptionFilter` wired globally.
- `packages/types/src` generated build artifacts (`.js`/`.d.ts`/`.map`) are now gitignored — they regenerate during API builds and reference `@prisma/client`. `global.d.ts` is intentionally kept tracked.
- Notification dispatch is currently synchronous; BullMQ async queue with retries is planned.
- Next.js SWC lockfile patch warning is environmental/non-blocking.
- Design files in `ai-system/designs/` have names that don't all match the README.md index — see `ai-system/designs/README.md` for the canonical list.
- **Residual security risks addressed (2026-08-19):** webhooks now HMAC-verified (Paystack `x-paystack-signature`; DocuSeal `X-Docuseal-Signature` via `DOCUSEAL_WEBHOOK_SECRET`, 5-min replay window, dev bypass when unset); `JWT_SECRET` fails hard in production via shared `resolveJwtSecret()` (dev fallback only outside production); rate limiter is now pluggable with a Redis-backed store (`RATE_LIMIT_STORE`, sorted-set sliding window) that falls back to the in-memory store when `REDIS_URL` is unset/unreachable.
- **Sprint close-out (2026-08-19):** SEO verified already present (`generateMetadata` + JSON-LD on listing detail; `app/sitemap.ts` + `robots.ts` live); activity `listing_approved` rule (20 pts) wired into `moderateListing`; supertest integration suite `packages/api/src/test/app.e2e.spec.ts` (12 tests: 401/403/400/404/200/429, role guards, strict zod) — 135 API tests total; E2E admin journey `apps/web/e2e/admin-journey.spec.ts` (6 tests: moderate nav, approve/reject listing, payment confirm/reject, non-admin nav hidden) — 22 E2E total.
- **Tightening (2026-09-16):** API now 153 tests (added `sms.client`, `storage.client`, `health.service`, `health` e2e ×2); web 100 tests; `npm run typecheck` 4/4, `lint` 4/4, `build` 31 pages, `test` green. No `href="#"`, `TODO`/`FIXME` deadends; vendor SDKs isolated to wrappers.
- **Web auth hydration fix (2026-08-19):** zustand `persist` hydrates asynchronously (promise chain); the dashboard layout's `router.replace('/auth')` could fire before rehydration on slow loads, bouncing logged-in users to the login screen. Added a `hydrated` flag to the auth store (`onFinishHydration`) and gated the redirect + loading state on it.
- **DB migration applied (2026-08-19):** `npm run db:migrate` ran against the live Supabase Postgres (migrations `0000` + `0001`). Note: `drizzle-kit migrate` does NOT auto-load the root `.env` (it reads `process.env.DATABASE_URL`; the config falls back to localhost). Export `DATABASE_URL` (from root `.env`) or add a `packages/api/.env` before running it.
- **Next.js build env quirk (2026-08-19):** `next build` warns "Found lockfile missing swc dependencies, patching…" then fails patching because Next 14.2.35's `optionalDependencies` pin `@next/swc-*@14.2.33`, but the patcher looks up version 14.2.35 (missing) — a registry lookup crash, not a code error. Workaround: `NEXT_IGNORE_INCORRECT_LOCKFILE=1` (build compiles + static-generates fine without the patch).
- **Testing setup (2026-08-13):** API lint clean (0 errors, 3 `no-console` warnings — intentional dev/stub logging); `@hw/api` and `@hw/web` both pass `tsc --noEmit` and `npm run build`. New specs live next to sources (`*.service.spec.ts`, `*.test.ts(x)`). E2E journeys stub the API via `page.route` because the Playwright webServer only boots the web app (no Postgres/API in CI).
- `packages/types/.eslintignore` ignores the generated `.js`/`.d.ts`/`.map` build artifacts that `tsc`/API builds re-emit into `src/`.
- **Tightening (2026-09-16):** Integrations now fully wrapped per §17 — `SmsClient` (Termii, `TERMII_API_KEY`), `StorageClient` (S3/R2), `PaystackClient`, `DocuSealClient`, `EmailService` all expose `isConfigured` + simulated fallback; `HealthModule` aggregates them at `GET /health` (liveness) + `GET /health/ready` (readiness + DB probe). `DrizzleService.execute` added for health/revert. Seed is now reversible — `drizzle/seed.data.ts` (`seed-` IDs + `SEED_MANIFEST`) + `drizzle/seed.revert.ts` (FK-ordered `LIKE 'seed-%'` delete), `npm run db:seed -- --revert [--with-config] [--with-users]` (aliases `db:seed:revert`/`db:seed:revert:full`). `(dashboard)/error.tsx` + `(public)/error.tsx` added; `RbacGuard` deprecated to alias `RolesGuard`.
- **Migrations + seed attempt (2026-09-16 — Session 12):** Attempted live `db:migrate` + `db:seed` — offline verification green (`typecheck 4/4`, `153 API + 100 web tests`, `build 31 pages`, migrations `0000`/`0001` syntactically valid, seed manifest/revert logic verified). Live run blocked by DNS `ENOTFOUND db.ltxseuwzxbothxevcmwd.supabase.co` / pooler `tenant/user not found` — Supabase project `ltxseuwzxbothxevcmwd` not resolvable in this environment (likely paused/deleted). Documented re-run steps with exported `DATABASE_URL` + pooler/local-docker fallback; logged as residual infra risk per QA gate #7.
