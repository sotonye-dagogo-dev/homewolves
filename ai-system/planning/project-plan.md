# Project Plan

> **Metadata**
> - last-updated-by: execute-feature-session-30
> - last-verified-against-code: 2026-10-24
> - staleness-policy: re-verify if project scope or phase changes

> **Overview:** High-level feature checklist organized by development phase, derived from ROADMAP.md (§9). See `planning/task-queue.md` for granular, sprint-level tasks.

---

## Phase 1 — Marketplace MVP

> **Section summary:** Public can browse, search, save properties. Agents can list. Basic auth. Audit logging. Admin moderation.

- [x] Project scaffolding — Turborepo monorepo, Next.js 14, NestJS, Prisma, PostgreSQL
- [x] `ai-system/` populated (this bootstrap)
- [x] Auth module — email/phone OTP, JWT
- [x] PlatformConfig module + fallbacks.ts — all config stored in DB, cached in Redis
- [x] Listings CRUD — agent/developer/homeowner can create, update, delete
- [x] Public listing feed + search (PostgreSQL FTS)
- [x] Property Detail page — gallery, meta, features, agent card, map
- [x] Recently Viewed — session-based + authenticated tracking
- [x] Saved Collections (Save for Later)
- [x] Basic Audit logging — every mutation emits AuditEvent
- [x] Admin listing moderation queue — approve/reject
- [x] Responsive web (mobile-first, breakpoints from DESIGN.md)
- [x] Design HTML exports complete → all 12 screens from `ai-system/designs/`
- [ ] React Native app (Expo) — listings + auth screens parity
- [ ] WhatsApp contact integration
- [ ] Referral code system

**Acceptance Criteria:**
- Guest can search, filter, view, and save a property without login
- Agent can register, list a property, and receive a wishlist notification
- Admin can approve/reject a listing
- All mutations produce AuditEvent records

---

## Phase 2 — Agent CRM & Collaboration

> **Section summary:** Agent dashboard, client management, inspection scheduling, real-time messaging. All core items complete.

- [x] CRM module — client assignment, notes, ratings
- [x] Inspection scheduling
- [x] Agent Dashboard — bento grid layout
- [x] Client Dashboard — tabs: transactions, wishlist, recently viewed, documents
- [x] In-app messaging — real-time Socket.io when enabled, REST + Next-local Postgres route on single-service deployments
- [x] Price drop alerts
- [x] New listing match alerts (saved search preferences)
- [x] Activity points system (gamification, configurable)
- [x] Full audit trail viewer — per-user, per-entity
- [ ] Push notifications — FCM/APNs
- [ ] Referral tracking + commission attribution

---

## Phase 3 — Transaction Workflow System

> **Section summary:** End-to-end transaction management with stepper UI, payment evidence, approvals. Core complete.

- [x] Transaction module — purchase, rental, shortlet workflows
- [x] Step-by-step transaction page — glass stepper UI
- [x] Payment evidence upload + admin approval
- [x] Document vault — client dashboard
- [x] Transaction audit trail
- [x] Admin transaction approval queue
- [x] Notification templates for all transaction events
- [ ] Due diligence checklist — admin-configurable
- [ ] E-signature integration (DocuSeal or equivalent)
- [ ] Installment payment tracking
- [ ] Transaction audit CSV/PDF export

---

## Phase 4 — Client Dashboard & Polish

> **Section summary:** Complete buyer portal, PWA, SEO, subscription billing, featured listings.

- [x] Full client portal — all dashboard tabs complete
- [x] Transaction portfolio view
- [x] Blog module — CMS-driven magazine layout
- [ ] Mobile app parity with web
- [ ] PWA — offline recently viewed, wishlist
- [ ] SEO — listing pages, sitemap, meta tags, structured data
- [ ] Performance audit — Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] Subscription billing — Paystack integration
- [ ] Featured listing / ad placement system

---

## Phase 5 — Intelligence & Automation

> **Section summary:** Data-driven platform, AI features, Meilisearch, multi-region.

- [x] Analytics engine — agent performance, listing performance, funnel, admin summary
- [ ] AI chatbot — property Q&A, agent assistant
- [ ] Smart property recommendations — ML from recently viewed + saved
- [ ] Predictive lead scoring for agents
- [ ] Auto follow-up sequences — CRM automation
- [ ] Meilisearch migration — advanced search with typo tolerance
- [ ] Multi-region deployment config — Ghana, Kenya

---

## Completed

- [x] Design system defined (DESIGN.md) — tokens, components, page layouts, themes
- [x] Architecture defined (ROADMAP.md) — stack, domain model, modules, API, RBAC, notifications
- [x] Design HTML exports — 12 screens in `ai-system/designs/`
- [x] Prisma client regenerated — all models typed, `(this.prisma as any)` casts removed from services (2026-08-10)
- [x] API security pass — REST route guards + RBAC, global rate limiting, zod input validation on all DTOs (2026-08-10)
- [x] Testing setup — 187 unit tests (93 API + 94 web), 16 Playwright E2E journeys, lint/typecheck/build green (2026-08-13)
- [x] Sprite 1 — Core Marketplace MVP (scaffolding, auth, listings, feed, detail, save/recent)
- [x] Sprint 2 — Agent & Communication (CRM, dashboard, messaging, notifications)
- [x] Sprint 3 — Transactions & Client Portal (deal stepper, payments, activity points, moderation, blog)
- [x] Sprint 4 — Platform-wide design-token pass, role-aware dashboards, realtime opt-in + REST fallback, analytics wiring, legal pages, property map view (2026-10-20)
- [x] Sprint 5 — Design-token readability/visibility hardening (mapped-throughtokens, themed status pairs) + end-to-end keyless map feature: HwMap stack (OpenFreeMap → CARTO/OSM step-down), server-proxied geocoding, property detail/listing-form/properties-map integrations, JSON-LD geo, seeded Lagos coords (2026-10-21)
