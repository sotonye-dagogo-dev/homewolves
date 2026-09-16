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

  // Server-side: no window — return env or localhost fallback
  if (typeof window === 'undefined') {
    return env && env.length > 0 ? env : 'http://localhost:4000/api/v1';
  }

  const locOrigin = window.location.origin;
  const locHost = window.location.host;

  // No env configured — for localhost dev keep direct API port (4000)
  // where Next.js proxy isn't needed; for production use same-origin.
  if (!env || env.length === 0) {
    if (locHost.startsWith('localhost') || locHost.startsWith('127.0.0.1')) {
      return 'http://localhost:4000/api/v1';
    }
    return `${locOrigin}/api/v1`;
  }

  // Relative env (e.g. "/api/v1") — prefix with current origin
  if (env.startsWith('/')) {
    return `${locOrigin}${env}`;
  }

  try {
    const envUrl = new URL(env);
    const envHost = envUrl.host;

    // Normalize host for apex vs www comparison
    const stripWww = (h: string) => h.replace(/^www\./i, '');
    const sameBase = stripWww(envHost) === stripWww(locHost);

    // Apex ↔ www mismatch would trigger Vercel's 308 domain redirect.
    // Align to current origin to stay same-origin and avoid CORS + redirect failure.
    if (sameBase && envHost !== locHost) {
      return `${locOrigin}/api/v1`;
    }

    // Broader homewolves.com family mismatch (covers api.homewolves.com etc.
    // when served from www) — also align to avoid cross-origin redirect.
    if (
      locHost.endsWith('homewolves.com') &&
      envHost.endsWith('homewolves.com') &&
      envHost !== locHost
    ) {
      return `${locOrigin}/api/v1`;
    }

    // localhost with port — keep env as-is (dev)
    if (envHost.startsWith('localhost')) return env;

    return env;
  } catch {
    // If env is not a valid absolute URL, treat as relative
    if (env.startsWith('/')) return `${locOrigin}${env}`;
    return env;
  }
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
