# System Architecture

> **Metadata**
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-09-16
> - staleness-policy: re-verify before trusting if any architecture-affecting commits have been made since last-verified-against-code

> **Overview:** Homewolves is a multi-sided PropTech marketplace + Agent CRM + Transaction Management Platform targeting the Nigerian/African market. It uses a modular monolith architecture (Next.js 14 frontend + NestJS backend + PostgreSQL) designed to decompose into microservices as the platform scales. The system is metadata-driven — all configurable UI elements and business rules are stored in the database via `PlatformConfig`, with hardcoded fallbacks in `packages/config/src/fallbacks.ts`.

---

## Architecture Diagram

> **Section summary:** The system has five logical layers: Client (Web/Mobile), API Gateway (Next.js API Routes / REST), Service Layer (NestJS modules), Data Layer (PostgreSQL + Redis + S3), and External Integrations (SMS, Email, WhatsApp, Payment).

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  Web (Next.js 14 App Router)  │  Mobile (React Native/Expo) │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WebSocket (Socket.io /ws)
┌────────────────────────▼────────────────────────────────────┐
│                     API LAYER                               │
│         (NestJS REST controllers + Socket.io gateways)      │
│         Rate limiting · Auth guards (JWT) · RBAC            │
└──────┬───────────┬───────────┬──────────────┬───────────────┘
       │           │           │              │
   ┌───▼───┐  ┌───▼───┐  ┌───▼───┐     ┌────▼────┐
   │ Auth  │  │Listing│  │  CRM  │     │  Trans- │
   │Service│  │Service│  │Service│     │  action │
   └───┬───┘  └───┬───┘  └───┬───┘     │  Service│
       │           │           │         └────┬────┘
       └───────────┴───────────┴──────────────┘
                         │
              ┌──────────▼──────────┐
              │     Data Layer      │
              │  PostgreSQL (main)  │
              │  Redis (cache/ws)   │
              │  S3-compat (files)  │
              └─────────────────────┘
```

---

## Module Breakdown

> **Section summary:** Each NestJS module has a single responsibility. Services contain all business logic. Controllers are thin — they validate input, call services, return responses. Every mutation passes through AuditService.

| Module | Responsibility | Key Files | Dependencies |
|--------|----------------|-----------|--------------|
| `health` | Liveness + readiness probes, per-service `configured` flags, DB latency check | health.service.ts, health.controller.ts | Drizzle, integrations (Paystack/DocuSeal/Sms/Storage/Email), Redis |
| `auth` | Email/phone OTP, JWT, session management, Supabase Google OAuth exchange | auth.service.ts, auth.controller.ts | users, notifications, email, Drizzle |
| `email` | DB-backed transactional email templates, `{{var}}` rendering, Resend send + logging, graceful dev fallback (no key → simulated) | email.service.ts, email.controller.ts | emailTemplates, emailLogs, Drizzle |
| `listings` | Property CRUD, search, media upload, featured/verified flags, moderation | listing.service.ts, listing.controller.ts | users, notifications, audit, alerts, email, Drizzle |
| `recently-viewed` | Session/user-based listing view tracking | recently-viewed.service.ts | listings, Drizzle |
| `saved` | Save-for-later wishlist toggle | saved.service.ts | listings, Drizzle |
| `crm` | Client assignment, notes, ratings, inspection scheduling | crm.service.ts | users, listings, notifications, Drizzle |
| `transactions` | Full deal lifecycle stepper, payment evidence, document vault | transactions.service.ts | listings, users, audit, notifications, email, Drizzle |
| `documents` | Document vault for transactions | documents.service.ts | Drizzle |
| `signatures` | E-signature workflow | signatures.service.ts | email, Drizzle |
| `messaging` | Real-time chat via Socket.io, conversation management | messaging.gateway.ts, messaging.service.ts | users, listings, Drizzle |
| `notifications` | Multi-channel dispatch (WebSocket, email, SMS, WhatsApp) | notifications.service.ts, notifications.gateway.ts | BullMQ, Resend, Termii |
| `alerts` | Price drop + new listing match alerts | alerts.service.ts | listings, notifications, email, Drizzle |
| `activity` | Agent gamification — points, tiers, leaderboard | activity.service.ts | users, Drizzle |
| `subscriptions` | Paystack billing, plan feature gating | subscriptions.service.ts | users, email, Drizzle |
| `blog` | CMS-driven blog with magazine layout | blog.service.ts | Drizzle |
| `platform-config` | All admin-configurable metadata (amenities, filters, nav, feature flags) | platform-config.service.ts | Drizzle, Redis |
| `audit` | Immutable event log — write-once, append-only | audit.service.ts | Drizzle |

---

## Data Flow

> **Section summary:** Requests flow from client → NestJS REST controller → service → Drizzle → PostgreSQL. Mutations always emit AuditEvents. Config is fetched at startup and cached in Redis.

### Standard Request Flow
```
Browser/Mobile App
  → Next.js (SSR/CSR) / React Native
    → REST endpoint (Next.js API Route proxy → NestJS controller)
      → Validation (DTO / zod)
        → Service method (business logic)
          → Drizzle query → PostgreSQL
          → AuditService.log() (if mutation)
          → Return response
```

### Authentication Flow
```
Native flow:
  User enters email/phone
    → AuthService.register()
      → OTP generated, stored in Redis (5min TTL)
      → SMS via Termii + Email via Resend (EmailService, `otp_code` template)
    → User submits OTP
      → AuthService.verifyOtp()
        → JWT access token + refresh token
        → Session stored in Redis

Google OAuth flow (Supabase):
  Web Google button → supabase.auth.signInWithOAuth() → /auth/callback#access_token=…
    → POST /api/v1/auth/supabase { accessToken }
      → AuthService.exchangeSupabaseToken() verifies Supabase JWT via SUPABASE_JWT_SECRET
        → find-or-create user (provider/providerId columns) → HW JWT + refresh token
```

### Config Resolution Flow
```
Component requests config (e.g. filter pills)
  → PlatformConfigService.get('filter_pills')
    → Redis cache check (5min TTL)
      → MISS → Drizzle query → PlatformConfig table
      → HIT → return cached
    → Fallback: FALLBACK_FILTER_PILLS from packages/config/src/fallbacks.ts
    → Return to component
```

### Transactional Email Flow
```
Business event (e.g. transaction created)
  → feature service calls emailService.send(key, to, vars)  [fire-and-forget, never blocks]
    → EmailService.render(): resolve template DB row (by lowercase key) → FALLBACK_EMAIL_TEMPLATES → {{var}} replace
    → RESEND_API_KEY set? → Resend.send() + emailLogs row  [else: logged as simulated]
    → Caller flow is unaffected by email outages
```

---

## Configuration Points

> **Section summary:** All configurable values are managed via PlatformConfig in the database or environment variables. Nothing is hardcoded in source files. All values follow the fallback discipline from `standards/engineering-principles.md` §1 and §3 — every config-driven value has a documented fallback in `packages/config/src/fallbacks.ts`.

| Config Key | Purpose | Location | Default |
|------------|---------|----------|---------|
| `amenities` | Property amenity icons and labels | PlatformConfig table | FALLBACK_AMENITIES |
| `filter_pills` | Search filter options | PlatformConfig table | FALLBACK_FILTER_PILLS |
| `nav_items` | Navigation menu structure | PlatformConfig table | FALLBACK_NAV_ITEMS |
| `subscription_plans` | Agent subscription tiers and pricing | PlatformConfig table | FALLBACK_PLANS |
| `feature_flags` | Feature toggles with role/rollout gates | PlatformConfig table | FALLBACK_FLAGS |
| `notification_templates` | Multi-channel notification content | PlatformConfig table | FALLBACK_TEMPLATES |
| `transaction_step_templates` | Workflow step definitions | PlatformConfig table | FALLBACK_STEPS |
| `property_types` | Property type categories and icons | PlatformConfig table | FALLBACK_TYPES |
| `DATABASE_URL` | PostgreSQL connection string | .env | — |
| `SUPABASE_URL` | Supabase project URL | .env | — |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (web) | .env | — |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret — verifies OAuth access tokens at `/auth/supabase` | .env | — |
| `REDIS_URL` | Redis connection string | .env | — |
| `JWT_SECRET` | Token signing secret | .env | — |
| `TERMII_API_KEY` / `TERMII_SENDER_ID` / `TERMII_API_URL` | SMS (Termii) — unset → simulated (log-only) via `SmsClient` | .env | — |
| `S3_ENDPOINT` / `R2_ENDPOINT` + `S3_BUCKET` / `R2_BUCKET` + `S3_ACCESS_KEY_ID` / `R2_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY` + `S3_PUBLIC_URL` | S3/R2 storage — unset → simulated URLs via `StorageClient` | .env | — |
| `RESEND_API_KEY` | Email provider key (unset → simulated log-only emails) | .env | — |
| `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME` | Email sender identity | .env | noreply@homewolves.africa / Homewolves |
| `ENABLE_DESIGN_VIEWER` | Mounts the dev-only design-asset viewer at `/__design/*`; must be false in production builds | .env | false |

---

## Verification CLI (agent-verifiable behavior)

Verification is script-driven (`npm test`, `npm run typecheck`, `npm run build`, `npm run lint` at the turbo root, `db:generate`/`db:migrate`/`db:seed`/`db:seed:revert` in `packages/api`) plus runtime health endpoints. If a dedicated standalone CLI is added later (engineering principle §24), list its commands here.

- `GET /api/v1/health` — liveness (`{ status: 'ok', timestamp }`)
- `GET /api/v1/health/ready` — readiness (`{ status, services: { database, paystack, docuseal, sms, storage, email, redis } }` with `configured` flags + DB latency)

---

## Rollback & Undo (deployment level)

This is the "undo" instinct applied one layer up from data (§22 covers user-facing undo; this covers deployments). Homewolves' documented rollback posture is thin today — worth tightening before production:

- **Previous-build promotion** — deploys are build-artifact based (Vercel web / Railway API); rollback = redeploy the previous build from the provider's release history. No separate release pipeline exists.
- **DB migration reversibility** — Drizzle migrations live in `packages/api/drizzle/migrations/` (`0000`, `0001`) generated via `npm run db:generate`; applied with `npm run db:migrate`. Not down-migrated in practice today.
- **Seed reversibility** — `packages/api/drizzle/seed.data.ts` (`seed-` IDs + `SEED_MANIFEST`) + `seed.revert.ts` (FK-ordered `LIKE 'seed-%'` delete, leaves post-seed rows intact). CLI: `npm run db:seed -- --revert [--with-config] [--with-users]` (aliases `db:seed:revert`/`db:seed:revert:full`). Seed is idempotent (`onConflictDoUpdate`).
- **Feature-flag kill switch** — yes: the `feature_flags` PlatformConfig table + `FeatureFlagGuard` / `useFeatureFlag()` can disable a bad feature without a deploy (this is the primary rollback lever).

---

## Tech Stack

> **Section summary:** Core technologies powering Homewolves. New dependencies must be justified and added here.

| Layer | Technology | Version |
|-------|------------|---------|
| Web Frontend | Next.js (App Router) | 14.x |
| Mobile Frontend | React Native (Expo) | SDK 51+ |
| Backend Framework | NestJS | Latest |
| API Layer | REST (public) | — |
| Database | PostgreSQL (Supabase) | 16 |
| ORM | Drizzle (drizzle-orm/postgres-js) | 0.45.x |
| Cache | Redis | 7 |
| UI Components | shadcn/ui (Radix + Tailwind) — Hw* wrappers | Latest |
| Styling | Tailwind CSS + CSS Variables | Latest |
| Real-time | Socket.io | Latest |
| State | TanStack Query (server) + Zustand (client) | Latest |
| Auth | JWT + Supabase Auth (Google OAuth) | Latest |
| Email | Resend (DB-backed templates) | Latest |
| SMS | Termii + Twilio fallback | Latest |

---

## Known Constraints & Technical Debt

> **Section summary:** Limitations and known issues that affect architecture decisions. Agents should be aware of these before proposing changes.

- **Mobile-first** — all layouts must work at 375px before expanding to desktop.
- **Nigeria-first** — SMS (Termii) and local payment gateways (Paystack) are primary; international is fallback.
- **No Meilisearch yet** — Phase 1 uses PostgreSQL FTS; migration planned for Phase 5.
- **Drizzle ORM (2026-08-13)** — Prisma fully replaced by Drizzle (`drizzle-orm/postgres-js`); schema in `packages/api/src/drizzle/schema.ts`; migrations generated offline via `npm run db:generate` (CI has no live DB). `GlobalExceptionFilter` maps postgres SQLSTATE codes (`23505`/`23503`/`22P02`).
- **Google OAuth via Supabase (2026-08-19)** — web uses `@supabase/supabase-js`; provider client ID/secret live in the Supabase dashboard, not `.env`. `SUPABASE_JWT_SECRET` in `.env` verifies tokens at `POST /api/v1/auth/supabase`.
- **Transactional email (2026-08-19)** — `@Global` EmailModule; templates in DB (`emailTemplates`), fallback constants in `packages/config/src/fallbacks.ts`; unset `RESEND_API_KEY` → simulated log-only delivery (by design).
- **Notifications dispatch synchronously** — BullMQ async queue with retries is planned for production.
- **Blog content uses `dangerouslySetInnerHTML`** — must be paired with sanitization in production.
- **Activity points** — wired into service-layer hooks (9 rules: listing_created, listing_approved, listing_sold, transaction_created/completed, client_added, review_received, inspection_scheduled, message_sent, daily_login); a self-award endpoint (`POST /activity/award/:ruleKey`) remains for the web activity UI (own-account only, cooldowns enforced).
- **API security hardening landed** (2026-08-10) — global rate limiting (120 req/min/IP; 10 req/min on auth), zod validation pipes on all DTOs (`.strict()` unknown-key rejection), `@Roles` RBAC on admin/moderation/audit/config routes, `req.user.sub` identity fix, `GlobalExceptionFilter` wired globally.
- **Webhooks verified** (2026-08-19) — Paystack subscription webhook: `x-paystack-signature` HMAC (dev bypass). DocuSeal signatures webhook: `X-Docuseal-Signature` HMAC-SHA256 over `timestamp.body` via `DOCUSEAL_WEBHOOK_SECRET`, 5-min replay tolerance, 401 on invalid, dev bypass when secret unset.
- **JWT secret fail-hard** (2026-08-19) — shared `resolveJwtSecret()` (`packages/api/src/common/config/env.ts`) throws in `NODE_ENV=production` when `JWT_SECRET` unset; dev/test use the deterministic `homewolves-dev-secret` fallback. Boot check in `main.ts`.
- **Rate limiter pluggable store** (2026-08-19) — `RATE_LIMIT_STORE` token; `RedisRateLimitStore` (ioredis sorted-set sliding window) when `REDIS_URL` set + reachable, else `MemoryRateLimitStore` (10k bucket cap) with a warning. Graceful degradation per project convention; guard is async.
- **DB env note** (2026-08-19) — `drizzle-kit` CLI does not auto-load the root `.env`; run `db:migrate`/`db:seed` with `DATABASE_URL` exported (or a `packages/api/.env`). The NestJS API likewise reads `process.env.*` directly (no `ConfigModule`) — env vars must be present in the shell.
- **Next.js build env quirk** (2026-08-19) — `next build` requires `NEXT_IGNORE_INCORRECT_LOCKFILE=1` here (Next 14.2.35 SWC lockfile auto-patch fetches `@next/swc-*` at version 14.2.35 which doesn't exist; the `optionalDependencies` pin 14.2.33). Non-code environmental issue; build output is correct with the flag.

---

## Architecture History

See `memory/architecture-history.md` for full chronology.
