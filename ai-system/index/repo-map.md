# Repository Map

> **Metadata**
>
> - last-updated-by: sync-context
> - last-verified-against-code: 2026-09-23
> - staleness-policy: auto-regenerable — can be derived from `Get-ChildItem -Recurse` or `tree` command. Manual content only where intent cannot be derived from structure.

> **Overview:** Visual map of the Homewolves monorepo folder structure with purpose descriptions. Updated when the folder structure changes. This file is **auto-regenerable** — use tool-based discovery (filesystem MCP, git ls-tree) for ground truth, and treat manual entries here as supplementary context, not primary navigation.

---

## Folder Structure

```
homewolves/
│
├── ai-system/                   ← AI development system — read this first on every session
│   ├── protocols/               ← Entry, tiering, quality gate, escalation, verification
│   ├── agents/                  ← Role definitions (Planner, Architect, Implementer, Reviewer, Tester/QA, Historian)
│   ├── commands/                ← Executable command pipelines (execute-feature, dev-cycle, fix-build, etc.)
│   ├── standards/               ← engineering-principles.md — coding doctrine
│   ├── system-architecture.md   ← Layers, modules, data flow, config points
│   ├── project-context.md       ← Goals, users, constraints, decisions
│   ├── design-system.md         ← UI/UX rules and tokens
│   ├── repair-system.md         ← Error knowledge base
│   ├── planning/                ← project-plan.md, task-queue.md
│   ├── memory/                  ← project-decisions.md, lessons-learned.md, architecture-history.md
│   ├── index/                   ← repo-map.md, dependency-graph.md (auto-regenerable)
│   ├── testing/                 ← test-plan.md, test-results.md
│   ├── checkpoints/             ← session-log.md (append-only) + in-progress.md (overwritten)
│   ├── summaries/               ← dev-history.md
│   ├── designs/                 ← HTML exports from design phase (12 screen exports)
│   └── docs/                    ← DESIGN.md, ROADMAP.md, PROMPTS.md, PRD PDF
│
├── apps/
│   ├── web/                     ← Next.js 14 web application (App Router)
│   │   ├── app/
│   │   │   ├── (public)/        ← Public routes: landing, properties, blog, auth, about, contact, faq, privacy, terms, messages
│   │   │   ├── (dashboard)/     ← Authenticated: agent/client dashboards, transactions, messages
│   │   │   └── (admin)/         ← Admin panel routes
│   │   ├── components/
│   │   │   ├── ui/              ← Hw* wrappers (HwButton, HwInput, etc.) — the only import for UI primitives
│   │   │   ├── landing/         ← Landing page zones (HeroSection, StatsStrip, CategoryBento, etc.)
│   │   │   ├── listings/        ← Property card, gallery, filter bar, forms
│   │   │   ├── dashboard/       ← Bento grid cells, KPI widgets, charts
│   │   │   ├── transactions/    ← Stepper, document upload, audit trail
│   │   │   └── shared/          ← Layouts, ThemeProvider, loaders
│   │   ├── hooks/               ← Custom React hooks (use-crm, use-messaging, use-notifications, etc.)
│   │   ├── lib/                 ← API clients (crm, messaging, notifications, transactions, blog) + server helpers (`lib/server/auth-local.ts`, `lib/property-filters.ts`) + colocated `*.test.ts`
│   │   ├── e2e/                 ← Playwright E2E journeys (smoke, guest, auth, agent-dashboard, admin-journey, transaction-stepper)
│   │   ├── app/api/v1/auth/     ← Local email/OTP auth route (proxies NestJS when backendOrigin set; imports `postgres` — declared on this package)
│   │   ├── config/              ← fallbacks.ts (web re-export)
│   │   ├── next.config.js       ← images/rewrites + experimental.serverComponentsExternalPackages: ['postgres']
│   │   └── public/              ← Static assets
│   │
│   └── mobile/                  ← React Native (Expo SDK 51+) mobile app — NOT YET CREATED (planned, Backlog)
│       ├── app/                 ← Expo Router file-based routes (placeholder structure)
│       ├── components/ui/       ← Same Hw* wrapper pattern for React Native
│       ├── hooks/               ← Shared hooks with web parity
│       └── config/              ← Mobile-specific fallbacks
│
├── packages/
│   ├── api/                     ← NestJS backend
│   │   ├── src/
│   │   │   ├── modules/         ← auth, listings, crm, transactions, messaging, notifications, alerts, activity, blog, platform-config, audit, recently-viewed, saved, documents, signatures, subscriptions (+ colocated `*.service.spec.ts`)
│   │   │   ├── common/          ← filters (GlobalExceptionFilter), guards (JwtGuard via auth, RolesGuard, OptionalJwtGuard), pipes (ZodValidationPipe), decorators (@Roles), rate-limit (RateLimitGuard + @Throttle), interceptors (AuditInterceptor), types (request.types.ts — AuthenticatedRequest/MaybeAuthenticatedRequest/toActor)
│   │   │   └── prisma/          ← PrismaService (DI wrapper for PrismaClient)
│   │   └── prisma/
│   │       └── schema.prisma    ← Full database schema (20+ models)
│   ├── types/                   ← Global TypeScript types — no imports needed
│   │   └── src/
│   │       ├── entities/        ← User, Listing, Transaction, AuditEvent, CrmClient, Activity, etc.
│   │       ├── api/             ← trpc.types.ts, rest.types.ts (request/response shapes)
│   │       ├── config/          ← PlatformConfig, FeatureFlag, FilterPill, SubscriptionPlan interfaces
│   │       ├── ui/              ← ComponentConfig, Hw*Props interfaces
│   │       └── global.d.ts      ← Triple-slash refs — makes all types globally available
│   └── config/
│       └── src/
│           └── fallbacks.ts     ← All FALLBACK_* constants for every config domain
│
├── ai-context.md                ← Project identity, stack, key modules — session entry point
├── DESIGN.md                    ← (canonical copy in ai-system/docs/) — design system
├── ROADMAP.md                   ← (canonical copy in ai-system/docs/) — architecture + roadmap
├── start-ai-dev.bat             ← Windows batch file to start an AI dev session
├── turbo.json                   ← Turborepo v2 config (tasks key)
├── tsconfig.base.json           ← Shared strict TS config
└── package.json                 ← Turborepo monorepo root
```

---

## Directory Descriptions

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `ai-system/` | AI development system — protocols, planning, memory, checkpoints | `protocols/`, `planning/task-queue.md` |
| `apps/web/` | Next.js 14 web application — SSR/SSG, mobile-first responsive | `app/`, `components/ui/`, `lib/`, `e2e/` |
| `apps/mobile/` | React Native (Expo) mobile app — parity with web (placeholder) | `app/`, `components/ui/` |
| `packages/api/` | NestJS backend — all business logic, Prisma ORM, REST. Unit specs colocated as `*.service.spec.ts` (vitest) | `src/modules/`, `prisma/schema.prisma` |
| `packages/types/` | Global TypeScript types — zero-import via triple-slash refs. Generated `.js`/`.d.ts`/`.map` build artifacts are gitignored + lint-ignored (regenerate on API builds); only `.ts` sources + `global.d.ts` are tracked | `src/entities/*.ts`, `src/global.d.ts`, `.eslintignore` |
| `packages/config/` | Shared fallback constants for all config domains | `src/fallbacks.ts` |

---

## Entry Points

| Purpose | File |
|---------|------|
| Web dev server | `apps/web/package.json` — `next dev` |
| Web unit/component tests | `apps/web/package.json` — `vitest run` |
| Web E2E journeys | `apps/web/package.json` — `e2e` (Playwright) |
| API server | `packages/api/src/main.ts` — NestJS bootstrap |
| API unit tests | `packages/api/package.json` — `vitest run` |
| Database schema | `packages/api/prisma/schema.prisma` |
| Config fallbacks | `packages/config/src/fallbacks.ts` |
| Global types injection | `packages/types/src/global.d.ts` |
| AI session start | `ai-context.md` — read this first |
