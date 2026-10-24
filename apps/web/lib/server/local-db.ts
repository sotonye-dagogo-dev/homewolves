/**
 * Shared local Postgres access for Next.js route handlers.
 *
 * Used by the single-service deployment path (no external NestJS API
 * configured) so route handlers can persist and read data directly from
 * DATABASE_URL. Kept server-only: never import this from client components.
 *
 * The helpers mirror the production-hardened behaviour first introduced in
 * `app/api/v1/auth/[action]/route.ts` (serverless pooler-safe options,
 * lazy singleton client, sanitized error logging) and are now shared by the
 * auth and messaging routes.
 */
import type { NextRequest } from 'next/server';

export type Row = Record<string, unknown>;

export type SqlClient = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  array: (values: unknown[], type?: string) => unknown;
  end: () => Promise<void>;
};

let sqlPromise: Promise<SqlClient> | null = null;

export function pgOptionsFor(url: string): Record<string, unknown> {
  // Config-driven postgres.js options (serverless-safe defaults):
  // - `prepare: false` by default. Supabase/pgbouncer poolers (port 6543,
  //   transaction mode) do NOT support prepared statements — every query
  //   fails otherwise, surfacing as opaque 500s. Opt back in with
  //   PG_PREPARE=true (direct connections only).
  // - `ssl: 'require'` for non-local hosts (Supabase mandates TLS). Opt out
  //   with PG_SSL=disable or ?sslmode=disable.
  const prepare = process.env.PG_PREPARE?.trim().toLowerCase() === 'true';
  let ssl: unknown;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const sslParam = (u.searchParams.get('sslmode') ?? '').toLowerCase();
    const sslEnv = (process.env.PG_SSL ?? '').trim().toLowerCase();
    if (sslEnv === 'disable' || sslParam === 'disable') {
      ssl = false;
    } else if (!isLocal) {
      ssl = 'require';
    }
  } catch {
    // Unparseable URL — let postgres throw its own descriptive error.
  }
  const opts: Record<string, unknown> = { max: 5, idle_timeout: 20, connect_timeout: 10, prepare };
  if (ssl !== undefined) opts.ssl = ssl;
  return opts;
}

/** Returns `null` when DATABASE_URL is absent or the driver cannot load. */
export async function getSql(): Promise<SqlClient | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const postgres = (await import('postgres')).default;
      return postgres(url, pgOptionsFor(url)) as unknown as SqlClient;
    })();
  }
  try {
    return await sqlPromise;
  } catch {
    sqlPromise = null;
    return null;
  }
}

/**
 * Sanitized DB-error detail for server logs. Includes driver message/code
 * (needed to diagnose prod 500s) but never the connection string or query
 * parameters.
 */
export function dbErrorDetail(err: unknown): { message: string; code?: string } {
  if (err instanceof Error) {
    const code = (err as Error & { code?: unknown }).code;
    return { message: err.message.slice(0, 300), code: typeof code === 'string' ? code : undefined };
  }
  return { message: String(err).slice(0, 300) };
}

export function logDbError(tag: string, err: unknown): void {
  const detail = dbErrorDetail(err);
  console.error(tag, detail.code ? `${detail.code}: ${detail.message}` : detail.message);
}

export function isMissingColumnError(err: unknown): boolean {
  const detail = err instanceof Error ? err.message : String(err);
  return /passwordHash/i.test(detail) || /column.*does not exist/i.test(detail) || /undefined_column/i.test(detail);
}

export function isUniqueViolationError(err: unknown): boolean {
  const detail = err instanceof Error ? err.message : String(err);
  const code = err instanceof Error ? (err as Error & { code?: unknown }).code : undefined;
  return code === '23505' || /duplicate key|unique constraint|already exists/i.test(detail);
}

export function isMissingTableError(err: unknown): boolean {
  const detail = err instanceof Error ? err.message : String(err);
  const code = err instanceof Error ? (err as Error & { code?: unknown }).code : undefined;
  return (
    code === '42P01' ||
    /relation .* does not exist/i.test(detail) ||
    /table .* does not exist/i.test(detail) ||
    /undefined_table/i.test(detail)
  );
}

// ─── External backend detection ─────────────────────────────────────────────

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, '');
}

export function isSameSite(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeHost(a) === normalizeHost(b);
}

export function siteHost(): string {
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
  try {
    return new URL(siteRaw).host;
  } catch {
    return '';
  }
}

/**
 * Resolve the off-site NestJS origin to proxy to, or `null` to handle the
 * request locally. Apex ↔ www and the current request host are treated as
 * same-site (proxying would loop back into this deployment).
 */
export function resolveBackendOrigin(reqHost?: string | null): string | null {
  const explicit = process.env.API_PROXY_URL?.trim() || process.env.API_URL?.trim();
  if (explicit) {
    try {
      const target = new URL(explicit);
      if (isSameSite(target.host, siteHost())) return null;
      if (reqHost && isSameSite(target.host, reqHost)) return null;
      return target.origin;
    } catch {
      return null;
    }
  }

  const pub = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (!pub || pub.startsWith('/')) return null;
  try {
    const target = new URL(pub);
    if (isSameSite(target.host, siteHost())) return null;
    if (reqHost && isSameSite(target.host, reqHost)) return null;
    return target.origin;
  } catch {
    return null;
  }
}

/** Convenience overload for route handlers. */
export function backendOrigin(req?: NextRequest): string | null {
  return resolveBackendOrigin(req?.nextUrl.host ?? null);
}
