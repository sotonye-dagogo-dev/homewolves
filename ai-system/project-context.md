# Project Context

> **Metadata**
> - last-updated-by: execute-feature-session-25
> - last-verified-against-code: 2026-10-20
> - staleness-policy: re-verify if >10 sessions old or after major scope changes

> **Overview:** Homewolves is a multi-sided PropTech marketplace, agent CRM, and transaction management platform for the African real estate market. It connects property buyers, renters, agents, developers, and homeowners in a single operating system — from property discovery through to deal close. The platform is Nigeria-first with a pan-African expansion roadmap.

---

## Project Purpose

African real estate suffers from fragmentation, mistrust, and manual workflows. Agents lose deals on WhatsApp. Buyers cannot verify listings. Transactions have no paper trail. Homewolves fixes this with a single platform covering the entire lifecycle — discovery, verification, client management, and auditable deal execution.

---

## Target Users

| User Type | Needs | Key Interactions |
|-----------|-------|-----------------|
| Guest/Buyer | Browse properties, search/filter, save favourites, contact agents | Property feed, detail page, wishlist, enquiry form, client dashboard |
| Agent | List properties, manage clients, schedule inspections, close deals | Agent dashboard, CRM, listing manager, transaction workflow |
| Developer | Portfolio management, bulk listings, analytics | Developer dashboard, listing manager, analytics |
| Homeowner | List individual properties, manage enquiries | Listing creation, enquiry inbox |
| Admin | Moderate listings, manage users, configure platform, view audit logs | Admin panel, config panel, audit log viewer, payment review |

---

## Business Constraints

- **Metadata-driven rendering** — all UI labels, icons, options, and feature gates must come from PlatformConfig, not hardcoded sources. Not optional.
- **Audit by default** — every mutation must emit an AuditEvent. No exceptions.
- **Mobile-first** — all layouts must work at 375px width minimum. Desktop is an enhancement.
- **RBAC everywhere** — every protected action checks user permissions against the role matrix, not hardcoded role strings.
- **Nigeria data compliance (NDPR)** — data must reside in Nigerian region; privacy policy enforced at onboarding.
- **Global TypeScript types** — shared types live in `packages/types`, zero-import via triple-slash refs.

---

## Current Project Phase

Phase: Active Development

Active sprint focus: Phases 1–4 are feature-complete through Sprint 4 — marketplace, CRM/messaging, transactions/payments, client/admin portals, analytics, and design-system hardening. Next focus is remaining Backlog items (WhatsApp, PWA/offline, push notifications, referrals) and Phase 5 intelligence/search work.

Current state: `apps/web` and `packages/api` build clean; 173 API + 155 web unit tests green; typecheck/lint 4/4. Realtime is opt-in (`NEXT_PUBLIC_REALTIME_ENABLED`, default false) because the web app deploys to Vercel serverless; messaging and notifications fall back to REST + polling. Design HTML exports live in `ai-system/designs/`.

---

## Tech Decisions Already Made

| Decision | Reason |
|----------|--------|
| Next.js 14 App Router for web | SSR/SSG for SEO, RSC for performance |
| NestJS for backend | OOP-native, decorators, modular, DI — aligns with domain model architecture |
| Drizzle ORM (was Prisma) | Type-safe query builder + offline-generatable migrations; replaced Prisma 2026-08-13 |
| REST for API | Public-facing API consumed by web + mobile clients |
| PostgreSQL 16 + JSONB | JSONB for metadata fields without schema migration |
| shadcn/ui wrappers (Hw* pattern) | Single point of change for design tokens; prevents direct Radix imports |
| Global TypeScript types (packages/types) | Zero-import types across entire monorepo via triple-slash refs |
| PlatformConfig for all configuration | Admin-controlled UI without code deploys |
| Redis for cache + session + pub/sub | Multi-purpose; simplifies infrastructure |
| Turborepo monorepo | Shared packages, efficient builds, consistent tooling |
| Monochrome + amber palette | Inspired by JamesEdition; warm accent for African market identity |
| Glassmorphism + bento grid | Modern luxury feel; differentiates from flat-card competitors |
| Socket.io for real-time (messaging + notifications) | Single /ws namespace, in-app dispatch |

---

## Out of Scope

- Native iOS/Android apps outside Expo managed workflow
- AI-powered features (chatbot, recommendations, lead scoring) — Phase 5
- Meilisearch / dedicated search engine — Phase 5
- Multi-region deployment (Ghana, Kenya) — Phase 5
- Video calls / virtual tours
- Property management / tenant portal
- Insurance or mortgage products

---

## External Integrations

| Service | Purpose | Auth Method |
|---------|---------|------------|
| Termii | SMS delivery (OTP, notifications) | API key (.env) |
| Twilio | SMS fallback | API key (.env) |
| Resend | Transactional email | API key (.env) |
| DocuSeal | E-signatures | API key + webhook HMAC secret (.env) |
| Redis | Cache + rate-limit store (multi-instance) | URL (.env) |
| WhatsApp Business API | Messaging fallback | API token |
| Paystack | Payment processing, subscriptions | Secret key (.env) |
| Cloudflare R2 / AWS S3 | File and image storage | Access keys (.env) |
| Sentry | Error tracking, performance monitoring | DSN (.env) |
| Google OAuth (via Supabase Auth) | Social authentication | Provider creds in Supabase dashboard; `SUPABASE_JWT_SECRET` (.env) verifies tokens |
| Apple OAuth | Social authentication | OAuth client ID (.env) |
