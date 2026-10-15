# In-Progress Work

> **Metadata**
>
> - last-updated-by: fix-build-session-22
> - last-verified-against-code: 2026-10-15
> - staleness-policy: this file is overwritten every session — always current

> **Overview:** Tracks work that is currently in progress but not yet complete. Written _before_ starting risky multi-step work, cleared on clean completion.

---

## Current Status

**Status:** CLEAR — fix-build Session 22 (`Missing script: "vercel-build"` in @hw/web) completed 2026-10-15.

Verified green:
- `npm run vercel-build` green from `apps/web` cwd (direct `next build`, full route table) — the exact failing path
- `npm run vercel-build` green from repo root (migrate-skip + turbo + output verified)
- `findRepoRoot()` resolves repo root from both cwds; `npm run --workspace=@hw/web vercel-build` resolves
- Sync-context drift fixed: `project-decisions.md` Session 21 Root assumption superseded
