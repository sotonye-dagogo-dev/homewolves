# Dependency Graph

> **Metadata**
> - last-updated-by: sync-context
> - last-verified-against-code: 2026-09-23
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
  → PrismaModule (database access)
  → NotificationsModule (OTP dispatch)
  → JwtModule / PassportModule (tokens, strategies)

ListingsModule
  → PrismaModule
  → AuditModule (log mutations)
  → NotificationsModule (wishlist alerts)
  → AlertsModule (price drop + match detection)
  → PlatformConfigModule (amenities, property types)

RecentlyViewedModule
  → PrismaModule

SavedModule
  → PrismaModule

CrmModule
  → PrismaModule
  → AuditModule (log mutations)
  → NotificationsModule (inspection reminders)
  → UsersModule / ListingsModule references

TransactionsModule
  → PrismaModule
  → AuditModule (log every step)
  → NotificationsModule (step change alerts)
  → PlatformConfigModule (step templates)

DocumentsModule
  → PrismaModule

SignaturesModule
  → PrismaModule

MessagingModule
  → PrismaModule
  → UsersModule (participant resolution)
  → ListingsModule (property context)

NotificationsModule
  → PrismaModule
  → UsersModule (preferences, devices)
  → PlatformConfigModule (templates)
  → BullMQ (job queue) / Resend (email) / Termii (SMS)

AlertsModule
  → PrismaModule
  → NotificationsModule (dispatch alerts)

ActivityModule
  → PrismaModule
  → UsersModule (points, tiers, leaderboard)

SubscriptionsModule
  → PrismaModule
  → UsersModule (plan assignment)
  → Paystack (billing)

BlogModule
  → PrismaModule

PlatformConfigModule
  → PrismaModule (read/write)
  → Redis (cache, 5min TTL)

AuditModule
  → PrismaModule (append-only writes)
```

---

## Client Dependencies

> **Section summary:** Frontend app dependencies.

```
apps/web (Next.js 14)
  → packages/types (global types — zero-import)
  → packages/config (fallbacks — compiled/bundled)
  → packages/api (REST client — type-safe)
  → app/api/v1/auth/[action] → lib/server/auth-local (local OTP/JWT when backendOrigin null; proxies NestJS otherwise)
  → lib/property-filters (URL↔pill sync for properties page)
  → shadcn/ui (Radix primitives — through Hw* wrappers only)
  → TanStack Query (server state)
  → Zustand (client state)
  → Socket.io client (real-time messaging + notifications)
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
| PostgreSQL 16 | Primary database | All modules via Prisma |
| Redis 7 | Cache, session store, BullMQ queue | PlatformConfig, Auth, Notifications |
| Cloudflare R2 / AWS S3 | File/image storage | Listings (media upload), Transactions (evidence) |
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
- **Services** → Repositories/Prisma (not the other way around)
- **Common module** (decorators, guards, interceptors) → No application modules
- **AuditModule** → Prisma only — no circular reference with business modules
- **PlatformConfigModule** → Prisma + Redis only — no business logic dependencies
- **Types package** → Zero dependencies — pure interfaces, types, and enums
- **Config package** → Zero runtime dependencies — plain objects and functions
- **UI components** → `@/components/ui` barrel only — never import shadcn directly
- **Service specs** (`*.service.spec.ts`) → vitest + `PrismaService` mock (plain `vi.fn()` object cast `as unknown as PrismaService`) — no real DB
- **Web lib tests** (`lib/*.test.ts`) → vitest + stubbed `fetch` via `vi.stubGlobal`; token from `useAuth` store (zustand) or `hw-auth` localStorage
- **E2E specs** (`e2e/*.spec.ts`) → Playwright; API stubbed with `page.route`, sessions seeded via `addInitScript` writing `hw-auth`
