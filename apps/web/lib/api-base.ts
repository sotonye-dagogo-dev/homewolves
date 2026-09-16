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
