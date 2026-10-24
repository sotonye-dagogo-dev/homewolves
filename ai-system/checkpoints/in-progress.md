# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature-session-30
> - last-verified-against-code: 2026-10-24
> - staleness-policy: this file is overwritten every session — always current

> **Overview:** Tracks work that is currently in progress but not yet complete. Written _before_ starting risky multi-step work, cleared on clean completion.

---

## Current Status

**Status:** CLEAN — no work in progress.

Session 30 (chat "API is not configured" / empty member directory) completed: the web app now serves `/api/v1/messaging/*` locally against Postgres when no external NestJS API is configured, using shared `lib/server/local-db.ts` (also adopted by auth) and `lib/server/messaging-local.ts`; browser messaging calls use `sameOriginApiBase()`; the floating theme toggle moved to a 208px mobile offset. QA green (turbo typecheck 4/4, web lint clean, 197 web tests / 26 files, `next build` 48 routes). Live-DB verification remains blocked locally (no `DATABASE_URL`). See `checkpoints/session-log.md` (Session 30) and `summaries/dev-history.md`.
