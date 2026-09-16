import { defineConfig } from 'drizzle-kit';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Auto-load .env from repo root so `npm run db:*` works from root without manual export.
// drizzle-kit does NOT auto-load root .env, so we handle it here (idempotent).
for (const candidate of [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'packages/api/.env'),
]) {
  dotenv.config({ path: candidate });
  if (process.env.DATABASE_URL) break;
}

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/homewolves',
  },
  strict: true,
  verbose: true,
});
