# Dependency Graph

> **Metadata**
> - last-updated-by: execute-feature-session-25
> - last-verified-against-code: 2026-10-20
> - staleness-policy: auto-regenerable — can be derived from import analysis tools. Manual content only for conventions and rules that cannot be inferred from code.

> **Overview:** Maps how modules depend on each other in the Homewolves NestJS backend. Agents consult this before modifying a module to understand the impact radius. This file is **auto-regenerable** — prefer tool-based import analysis for ground truth, and treat manual entries as supplementary.

---

## Module Dependency Map

> **Section summary:** A text diagram showing dependency direction. Arrows point from consumer → dependency.

```
Common security infrastructure (global, not module-scoped):
  RateLimitModule (APP_GUARD → RateLimitGuard) — global, applies to every route
  GlobalExceptionFilter — wired globally in main.ts
  ZodValidationPipe — applied per-route in controllers
  RolesGuard / OptionalJwtGuard / @Roles — applied per-route/controller

AuthModule
  → DrizzleModule (DrizzleService — postgres.js client)
  → NotificationsModule (OTP dispatch)
  → JwtModule / PassportModule (tokens, strategies)

ListingsModule
  → DrizzleModule (DrizzleService)
  → AuditModule (log mutations)
  → NotificationsModule (wishlist alerts)
  → AlertsModule (price drop + match detection)
  → PlatformConfigModule (amenities, property types)

RecentlyViewedModule
  → DrizzleModule (DrizzleService)

SavedModule
  → DrizzleModule (DrizzleService)

CrmModule
  → DrizzleModule (DrizzleService)
  → AuditModule (log mutations)
  → NotificationsModule (inspection reminders)
  → UsersModule / ListingsModule references

TransactionsModule
  → DrizzleModule (DrizzleService)
  → AuditModule (log every step)
  → NotificationsModule (step change alerts)
  → PlatformConfigModule (step templates)

DocumentsModule
  → DrizzleModule (DrizzleService)

SignaturesModule
  → DrizzleModule (DrizzleService)

MessagingModule
  → DrizzleModule (DrizzleService)
  → UsersModule (participant resolution)
  → ListingsModule (property context)

NotificationsModule
  → DrizzleModule (DrizzleService)
  → UsersModule (preferences, devices)
  → PlatformConfigModule (templates)
  → BullMQ (job queue) / Resend (email) / Termii (SMS)

AlertsModule
  → DrizzleModule (DrizzleService)
  → NotificationsModule (dispatch alerts)

ActivityModule
  → DrizzleModule (DrizzleService)
  → UsersModule (points, tiers, leaderboard)

AnalyticsModule
  → DrizzleModule (DrizzleService)
  → transactions / listings / bugReports / paymentRecords tables
  (self-scoped agent/listing/funnel analytics; ADMIN-only admin summary)

SubscriptionsModule
  → DrizzleModule (DrizzleService)
  → UsersModule (plan assignment)
  → Paystack (billing)

BlogModule
  → DrizzleModule (DrizzleService)

PlatformConfigModule
  → DrizzleModule (DrizzleService) (read/write)
  → Redis (cache, 5min TTL)

AuditModule
  → DrizzleModule (DrizzleService) (append-only writes)
```

---

## Client Dependencies

> **Section summary:** Frontend app dependencies.

```
apps/web (Next.js 14)
  → packages/types (global types — zero-import)
  → packages/config (fallbacks — compiled/bundled)
  → packages/api (REST client — type-safe)
  → postgres (direct dep; server external via next.config experimental.serverComponentsExternalPackages — used by app/api/v1/auth/[action])
  → app/api/v1/auth/[action] → lib/server/auth-local (local OTP/JWT when backendOrigin null; proxies NestJS otherwise); root `.env` loaded via dotenv in next.config.js
  → lib/api-base — `getApiBase()` for general API calls; `authApiBase()` (same-origin `/api/v1` in the browser) for ALL `/auth/*` calls (use-auth, google-auth)
  → lib/property-filters (URL↔pill sync for properties page)
  → shadcn/ui (Radix primitives — through Hw* wrappers only)
  → TanStack Query (server state)
  → Zustand (client state)
  → lib/realtime — opt-in ref-counted Socket.io client (`NEXT_PUBLIC_REALTIME_ENABLED`, namespace `/ws`); REST + polling fallback when disabled
  → lib/messaging — REST send/read + socket hybrid
  → lib/analytics — agent/admin analytics REST clients
  → Tailwind CSS (styling with CSS variable tokens)

apps/mobile (React Native / Expo)
  → packages/types (global types)
  → packages/config (fallbacks)
  → packages/api (REST client)
  → NativeWind (styling)
  → Socket.io client
```

---

## External Dependencies

| Service | Purpose | Used In |
|---------|---------|---------|
| PostgreSQL 16 | Primary database | All modules via Drizzle (`src/drizzle/drizzle.service.ts`) |
| Redis 7 | Cache, session store, BullMQ queue | PlatformConfig, Auth, Notifications |
| Cloudinary | File/image storage (SDK wrapper: StorageClient) | Listings (media upload), Transactions (evidence), Bug reports (screenshots) |
| Resend | Transactional email | Notifications |
| Termii | SMS delivery (primary) | Auth (OTP), Notifications |
| Twilio | SMS fallback | Notifications |
| WhatsApp Business API | Messaging fallback | Messaging |
| Paystack | Payment processing | Subscriptions |
| Sentry | Error tracking, performance | Backend modules |
| Google OAuth | Social auth | Auth |
| Apple OAuth | Social auth | Auth |

---

## Circular Dependency Warnings

- **None detected in current architecture.** NestJS modules are designed with unidirectional dependency flow. Services that need to call each other use NestJS's forward reference (`@Inject(forwardRef(() => Service))`) or event-driven patterns.

---

## Dependency Rules

- **Controllers** → Services (not the other way around)
- **Services** → DrizzleService (not the other way around)
- **Common module** (decorators, guards, interceptors) → No application modules
- **AuditModule** → Drizzle only — no circular reference with business modules
- **PlatformConfigModule** → Drizzle + Redis only — no business logic dependencies
- **Types package** → Zero dependencies — pure interfaces, types, and enums
- **Config package** → Zero runtime dependencies — plain objects and functions
- **UI components** → `@/components/ui` barrel only — never import shadcn directly
- **Service specs** (`*.service.spec.ts`) → vitest + `DrizzleService` mock (`createDrizzleMock` from `src/test/drizzle.mock.ts` — chainable thenable proxy) — no real DB
- **Seed/ops specs** (`drizzle/*.spec.ts`, included via vitest.config) → vitest + minimal structural fake DB; file I/O uses `os.tmpdir()` fixtures
- **Web lib tests** (`lib/*.test.ts`) → vitest + stubbed `fetch` via `vi.stubGlobal`; token from `useAuth` store (zustand) or `hw-auth` localStorage
- **E2E specs** (`e2e/*.spec.ts`) → Playwright; API stubbed with `page.route`, sessions seeded via `addInitScript` writing `hw-auth`
