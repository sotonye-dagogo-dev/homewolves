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
| `npm run db:seed:revert` | Revert seed data |

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

## License

Proprietary — Homewolves Inc.
