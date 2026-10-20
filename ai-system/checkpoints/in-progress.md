# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature-session-25
> - last-verified-against-code: 2026-10-20
> - staleness-policy: this file is overwritten every session — always current

> **Overview:** Tracks work that is currently in progress but not yet complete. Written _before_ starting risky multi-step work, cleared on clean completion.

---

## Current Status

**Status:** CLEAR — no in-progress work. Session 25 (realtime opt-in + platform design/role pass) completed and closed 2026-10-20.

**Last closed session:** Session 25 — `checkpoints/session-log.md` (Session 25 entry). Realtime is opt-in (`NEXT_PUBLIC_REALTIME_ENABLED=false`) with REST/polling fallback, messaging/analytics/role-aware UI token pass complete, and QA green (API 173, web 155, typecheck/lint 4/4, build 38 pages).

**Known follow-ups (not blocking, no active work):**
- Remaining backlog: WhatsApp integration, PWA/offline, push notifications, referral system.
- Optional: enable realtime once the API is hosted somewhere that can terminate WebSockets.
- E2E (Playwright) not run this session; run from `apps/web` before release.
- Operator: live-verify seed-user sign-in (`admin@homewolves.com` / `Homewolves123!`) with `npm run dev`.
- `.env` still points at the IPv6-only direct host — local runs that fail ENOTFOUND can use the pooler URL from the Supabase dashboard (`aws-1-eu-west-1`). `.env` was never modified (operator constraint).
