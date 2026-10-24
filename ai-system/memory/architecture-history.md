# Architecture History

> **Metadata**
> - last-updated-by: execute-feature-session-30
> - last-verified-against-code: 2026-10-24
> - staleness-policy: historical entries do not go stale — only the current architecture (in system-architecture.md) needs re-verification

> **Overview:** Chronological record of how the system architecture has evolved. Useful for understanding why things are structured the way they are, and for identifying patterns in how the codebase has grown.

---

## History

### 2026-06-09 — Initial Architecture

**State:**
Greenfield project. Architecture defined from ROADMAP.md §1-4 — modular monolith, Turborepo monorepo, Next.js 14 + NestJS + PostgreSQL. All docs in `.ai-system/` (v1) populated from design assets. Zero application code.

**Rationale:**
Design phase (DESIGN.md, ROADMAP.md) completed before code. The architecture was documented first so scaffolding could follow the intended structure without rework.

---

### 2026-06-10 — MVP Foundation & Feature Sprints 1-3

**State:**
Turborepo monorepo scaffolded. `packages/types` (global zero-import types), `packages/config` (fallbacks), `packages/api` (NestJS with PrismaModule, AuditService, PlatformConfigService, RbacGuard, GlobalExceptionFilter), `apps/web` (Next.js 14 App Router). Prisma schema with 16+ models.

Sprints delivered: PlatformConfig system, auth (OTP + JWT), listing CRUD, public feed + search, property detail, recently-viewed + save, CRM, agent dashboard bento grid, real-time messaging, notifications, price-drop/match alerts, client dashboard, transaction stepper, payment evidence + admin review, activity points, admin moderation, blog.

**Rationale:**
Feature-first delivery within the documented architecture. The audit-by-default and metadata-driven patterns were enforced from Sprint 1.

---

### 2026-06-16 — Navigation Audit & Build Repair

**State:**
All landing CTAs and mobile bar tabs wired to real routes. Missing public routes added (about, contact, faq, privacy, terms). Lint/format blockers fixed so `npm run build` completes green.

**Rationale:**
Post-MVP usability pass — removing dead ends before hardening.

---

### 2026-08-05 — v2 ai-system Migration

**State:**
Replaced v1 `.ai-system/` with v2 `ai-system/` framework (vendor-neutral, function-based roles, explicit protocols, mandatory quality gate, freshness metadata). Migrated all project content. Design assets moved into `ai-system/designs/`.

**Rationale:**
Upgrade to the v2 system contract: tool-agnostic, interruption-safe, quality-gated development workflow.

---

### 2026-08-13 — Prisma → Drizzle ORM Migration (`packages/api`)

**State:**
Replaced Prisma with Drizzle ORM. New `src/drizzle/schema.ts` (28 tables, 5 enums, relations), `DrizzleModule`/`DrizzleService` (`@Global`), all services/DTOs/gateway ported to query-builder chains + `db.query` relational finders. `drizzle-kit` config + `drizzle/seed.ts`; initial migration `0000_faithful_moira_mactaggert.sql` generated offline. `@prisma/client`/`prisma` removed; `packages/api/prisma/` and `src/prisma/` deleted. Specs rewritten against a shared Drizzle mock (`src/test/drizzle.mock.ts`).

**Rationale:**
No-codegen typed SQL access, offline-generatable migrations (CI has no live Postgres), elimination of the recurring stale-Prisma-client class of bugs.

---

### 2026-08-13 — Web audit rectification (`apps/web`)

**State:**
Applied the `verify-work.md` audit findings: CategoryBento dead `role="button"` cards → `next/link`s; properties page reads `search` + `category` URL params (and fixed the `for_sale`→`sale` categoryMap bug that silently broke "For Sale" filtering); footer nav `<a>` → `next/link`; dashboard notification dropdown rows clickable (mark single read + navigate); `loading.tsx` added to `(public)` and `(dashboard)` groups; hero + landing property cards use `next/image` (`images.unsplash.com` added to `remotePatterns`).

**Rationale:**
Verify-work audit pass — clickable/interactive elements now navigate, SPA nav avoids full reloads, and images use the Next.js optimizer.

---

[New entries added here as architecture evolves]

---

### 2026-10-20 — Realtime opt-in + platform hardening (Session 25)

**State:**
Realtime became a deployment capability: `NEXT_PUBLIC_REALTIME_ENABLED` defaults off because the web app runs on Vercel serverless, with `/ws` namespace support and REST/polling fallbacks. Messaging gained a REST send endpoint and hydrated participant profiles. A role-scoped analytics module now exposes agent/listing/funnel data plus an ADMIN summary endpoint. The web UI completed a design-token/role-awareness pass across public, client, agent, and admin surfaces, with real data replacing placeholders.

**Rationale:**
Serverless hosting cannot terminate WebSockets; hardcoding a production socket origin produced guaranteed console failures. Making realtime opt-in preserves the Socket.io architecture for future long-lived hosting without blocking current functionality. Wiring real analytics and role guards closes the gap between the documented RBAC/metadata model and the shipped UI.


---

### 2026-10-24 — Next-local domain routes for single-service deployments (Session 30)

**State:**
The web app now owns a second domain API locally: `app/api/v1/messaging/[...path]/route.ts` serves directory, conversations, messages, read receipts, and unread counts against Postgres when no off-site NestJS API is configured, proxying otherwise. Both auth and messaging share `apps/web/lib/server/local-db.ts` (lazy `postgres` client, pooler-safe options, DB error predicates, backend-origin detection) and domain modules (`auth-local.ts`, `messaging-local.ts`). Browser messaging calls switched to `sameOriginApiBase()`.

**Rationale:**
The actual deployment is a single Next.js service. Without a Next-local handler, messaging fell through to the `/api/v1/[...path]` catch-all (502 `API not configured` for mutations, non-array fallbacks for GETs), which the UI surfaced as a toast and an empty member directory. Local auth had already proven the pattern; sharing the server helpers keeps the two domains consistent and makes proxy-vs-local switching non-breaking.
