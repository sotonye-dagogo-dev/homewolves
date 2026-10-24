/**
 * Central API base resolver.
 *
 * Resolves the API base URL at runtime, handling the Vercel apex → www
 * 308 Permanent Redirect issue. When the configured NEXT_PUBLIC_API_URL
 * host is `homewolves.com` but the page is served from `www.homewolves.com`
 * (Vercel's default), a cross-origin fetch to the apex would be 308-redirected
 * to www without CORS headers, causing:
 *   "Access to fetch at 'https://homewolves.com/api/v1/...' from origin
 *    'https://www.homewolves.com' has been blocked by CORS policy..."
 *
 * This helper normalizes the apex/www mismatch by aligning the fetch target
 * to the current window origin when the hosts differ only by the `www.` prefix
 * or share the same base domain. For server-side rendering it returns the env
 * value (or localhost fallback) without window access.
 */

export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();

  // Server-side: no window — return env or localhost fallback.
  // Server fetch needs an absolute URL; relative would fail in Node.
  if (typeof window === 'undefined') {
    if (env && env.length > 0) {
      // Normalize server-side apex vs www using SITE_URL if available
      // to avoid extra redirect hop. Keep env as source of truth when set.
      return env;
    }
    return 'http://localhost:4000/api/v1';
  }

  const locHost = window.location.host;

  // ── Browser: ALWAYS prefer same-origin relative fetch in production
  // to eliminate Vercel apex→www 308 + CORS entirely. The Next.js
  // rewrite / middleware proxy (see next.config.js) forwards to the
  // real backend (API_PROXY_URL or external host). This makes
  // NEXT_PUBLIC_API_URL host mismatch irrelevant in the browser.
  // Exception: localhost dev still hits the local NestJS port directly.
  if (locHost.startsWith('localhost') || locHost.startsWith('127.0.0.1')) {
    if (env && env.includes('localhost')) return env;
    return 'http://localhost:4000/api/v1';
  }

  // For any production host (homewolves.com, vercel.app, etc.) use
  // relative same-origin path. This is CORS-free and works via the
  // Next.js rewrite proxy handled at the edge.
  // Keep absolute same-origin as fallback only if rewrite is disabled,
  // but relative is strictly better (no origin comparison).
  return '/api/v1';
}

/**
 * Build a full API URL for a given path (e.g. "/listings?take=12").
 * Path should start with "/".
 */
export function apiUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Base URL for `/auth/*` calls — ALWAYS same-origin in the browser.
 *
 * Auth must never depend on the NestJS API process being up or on a direct
 * cross-origin hop. The Next.js route `app/api/v1/auth/[action]/route.ts`
 * proxies to the NestJS API when one is configured (`API_PROXY_URL` /
 * external `NEXT_PUBLIC_API_URL`) and otherwise handles auth locally against
 * Postgres with coded, actionable errors (DB_NOT_MIGRATED, DB_LOOKUP_FAILED,
 * TOKEN_CONFIG…).
 *
 * Previously the browser called `http://localhost:4000/api/v1/auth/*` directly
 * during local dev, so sign-in died with an instant connection-refused (API
 * not running) or an opaque 500 (API running, DB unreachable) — the request
 * never reached a working auth path. Same-origin removes that entire failure
 * class and matches how production already routes auth.
 */
export function authApiBase(): string {
  if (typeof window === 'undefined') return getApiBase();
  return '/api/v1';
}

/**
 * Base URL for routes that have a same-origin Next.js fallback handler
 * (auth, messaging, maps).
 *
 * In the browser this is always relative `/api/v1`, so the request resolves
 * against the Next.js route handlers (and any configured edge rewrite)
 * without a cross-origin hop. That keeps local dev working even when the
 * NestJS process is not running, and removes apex/www CORS entirely.
 * Server-side callers still need an absolute URL from `getApiBase()`.
 */
export function sameOriginApiBase(): string {
  if (typeof window === 'undefined') return getApiBase();
  return '/api/v1';
}
