# Multi-Region Deployment

> **Status:** MVP baseline configured. Ghana/Kenya expansion is planned (Phase 5) and gated behind `enabled: false` in `regions.json`.

## How it works

The platform is a Next.js + NestJS monorepo deployed on Vercel. Regional expansion is
achieved by deploying the same build to region-specific Vercel projects that point at
regional database read replicas, with env overrides for the region's currency and site
URLs.

## Configuration

- `vercel.json` — root deploy config. Project-level `regions` pins Serverless function
  execution to `iad1` (primary) + `fra1` (edge) so latency stays low for African users.
  (This replaces the former `functions.regions` glob, which newer Vercel CLI versions
  reject with `[unused_function]` because a Next.js app has no standalone `api/`
  functions matching a catch-all `**/*.{ts,tsx,js}` pattern.)
- `infra/regions.json` — declarative registry of supported regions (NG live, GH/KE
  planned). Each entry declares the Vercel project suffix, function regions, database
  topology, and region env overrides.

## Enabling a new region (e.g. Ghana)

1. Set `regions[].enabled = true` in `infra/regions.json`.
2. Create the Vercel project (`homewolves-gh`) pointed at the same repo/build.
3. Set the region env overrides (site URL, API URL, `CURRENCY`) in the new project.
4. Add a regional DB read replica for `eu-central-1` (see `regions.json` database).
5. Wire the regional domain (`gh.homewolves.africa`) to the Vercel project.

## Operational notes

- The API rate limiter is in-memory today — multi-instance/multi-region deployments must
  swap in the Redis-backed store (`common/rate-limit`) before scaling horizontally.
- Webhook endpoints (Paystack, DocuSeal) should be pointed at the primary region instance
  to avoid duplicate processing.
- JWT secret, Paystack/DocuSeal secrets, and `DATABASE_URL` are per-environment and must
  be set in every regional project (never committed).
