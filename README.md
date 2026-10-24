# Homewolves

African real estate operating system — multi-sided marketplace, agent CRM, and transaction management platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js 14 (App Router) |
| API | NestJS (REST) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache | Redis |
| UI | shadcn/ui (Hw* wrappers) + Tailwind CSS |
| State | TanStack Query + Zustand |
| Auth | JWT + Google OAuth |
| Email | Resend (DB-backed templates) |
| SMS | Termii |
| Payments | Paystack |
| Storage | Cloudinary |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10.8
- PostgreSQL (or Supabase)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development servers
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run dev:web` | Start web app only |
| `npm run dev:api` | Start API only |
| `npm run build` | Build all apps |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | Type-check all packages |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed database |
| `npm run db:seed:backup` | Full JSON backup of all tables (no destructive work) |
| `npm run db:seed:revert` | Revert seed data (auto-backs up seed rows first) |
| `npm run db:purge` | Full data purge — requires `-- --yes`, auto-backs up everything first |
| `npm run db:restore` | Restore a backup file: `npm run db:restore -- <file>` |

### Data Safety: Backup, Restore, Purge

Every destructive seed command takes a **timestamped JSON backup before deleting anything** — if the backup cannot be written, the operation aborts.

```bash
# Standalone full backup (all tables, no deletions)
npm run db:seed:backup

# Seed-only revert — deletes ONLY seed- rows / manifest keys, backs up first
npm run db:seed:revert

# Full purge — deletes EVERY row in EVERY table (confirmation + full backup required)
npm run db:purge -- --yes

# Restore from any backup file (parents-first, idempotent — never overwrites existing rows)
npm run db:restore -- packages/api/drizzle/backups/backup-full-2026-10-16T12-00-00-000Z.json
```

Backups land in `packages/api/drizzle/backups/` (gitignored; override with `SEED_BACKUP_DIR`). Each file records the DB host, scope, per-table row counts, and the rows themselves.

## Authentication Notes

- Browser `/auth/*` calls are **always same-origin** (`/api/v1/auth/*`) — they are served by the Next.js auth route, which proxies to the NestJS API when one is configured and otherwise handles auth locally against Postgres. Sign-in works whether or not the API process is running.
- The Next.js server loads the repo-root `.env` at startup (see `apps/web/next.config.js`), so `DATABASE_URL`/`JWT_SECRET` are available to auth route handlers in local dev. Shell exports and Vercel env vars always take precedence.
- Seed demo accounts (`admin@homewolves.com`, `agent1@homewolves.com`, …) sign in with password `Homewolves123!` (hash shipped in `packages/api/drizzle/seed.data.ts` — demo only, rotate for real environments).
- Auth failures return coded JSON (`DB_NOT_MIGRATED`, `DB_LOOKUP_FAILED`, `TOKEN_CONFIG`, …) — grep these in server logs when diagnosing.

## Environment Variables

See [`.env.example`](.env.example) for the full reference. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | JWT signing secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (web via `google_oauth` config + API audience check) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `RESEND_API_KEY` | No | Email provider key (simulated when unset) |
| `PAYSTACK_SECRET_KEY` | No | Payment processing (dev mode when unset) |
| `TERMII_API_KEY` | No | SMS provider (simulated when unset) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name (simulated when unset) |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

All optional variables degrade gracefully — the platform runs with simulated fallbacks when external services are not configured.

## Architecture

```
apps/web/          → Next.js 14 frontend
packages/api/      → NestJS backend API
packages/config/   → Shared fallback configurations
packages/types/    → Global TypeScript types (zero-import)
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins:
   - `http://localhost:3000` (dev)
   - `https://www.homewolves.com` (production)
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://www.homewolves.com/auth/callback` (production)
5. Copy the Client ID and Client Secret to `.env`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## Map Providers

The keyless map stack (MapLibre GL) sits on top of free, open map infrastructure —
thank you to these providers. Per product decision, provider names are not shown
in the map UI; their credit lives here:

- [OpenFreeMap](https://openfreemap.org) — vector basemap styles (primary)
- [CARTO](https://carto.com/basemaps) — raster basemap step-down
- [OpenStreetMap](https://www.openstreetmap.org) — raster basemap step-down + outbound location links
- [Photon (H Jaguar) + Nominatim](https://photon.komoot.io) — geocoding via the server-proxied `/api/v1/maps/geocode`

**Partner:** the map info tag credits the
[Along](https://alongng.com) project ("Powered by Along", driven by the
`map_config.credit` platform config) — Along is a candidate for deeper integration
in the future (e.g. listers uploading routes for their listings alongside this credit).

## License

Proprietary — Homewolves Inc.
