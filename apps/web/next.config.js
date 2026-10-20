/**
 * Load the repo-root `.env` into `process.env` for the Next.js server runtime.
 *
 * Next.js only auto-loads `apps/web/.env*` — the repo-root `.env` (where
 * DATABASE_URL, JWT_SECRET and friends actually live, shared with the API
 * package and drizzle scripts) was never visible to route handlers in local
 * dev, so the local auth route (`app/api/v1/auth/[action]`) 503'd with
 * "Auth requires DATABASE_URL" even when fully configured.
 *
 * dotenv NEVER overrides keys already present in process.env, so shell exports
 * and Vercel dashboard env vars stay authoritative in every environment.
 * (next.config.js is evaluated by Node before compilation, so route handlers
 * in the same server process see these values.)
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
} catch {
  // dotenv missing or .env absent — harmless; request-time coded errors cover it.
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hw/types'],
  // Local auth route uses the `postgres` driver at request time — do not bundle
  // it into the server graph (Vercel webpack fails with Module not found when
  // it is only a root/transitive dependency).
  experimental: {
    serverComponentsExternalPackages: ['postgres'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
      { protocol: 'http', hostname: '**.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'http', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'http', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'homewolves.com' },
      { protocol: 'http', hostname: 'homewolves.com' },
      { protocol: 'https', hostname: 'www.homewolves.com' },
      { protocol: 'http', hostname: 'www.homewolves.com' },
      { protocol: 'https', hostname: '**.homewolves.com' },
      { protocol: 'http', hostname: '**.homewolves.com' },
      { protocol: 'https', hostname: 'api.homewolves.africa' },
      { protocol: 'http', hostname: 'api.homewolves.africa' },
      { protocol: 'https', hostname: '**.homewolves.africa' },
      { protocol: 'http', hostname: '**.homewolves.africa' },
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'http', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'http', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'http', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.picsum.photos' },
      { protocol: 'http', hostname: '**.picsum.photos' },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  async rewrites() {
    // Proxy same-origin /api/v1/* to the actual NestJS API.
    // Browser fetches now always use same-origin /api/v1 (see lib/api-base.ts)
    // to eliminate CORS + Vercel apex→www 308. This rewrite forwards at the
    // edge/server to the real backend without the browser ever seeing a
    // cross-origin redirect.
    //
    // Priority:
    //  1. API_PROXY_URL / API_URL (server-only, explicit proxy target)
    //  2. NEXT_PUBLIC_API_URL when it is an absolute external host that is
    //     NOT same-origin with NEXT_PUBLIC_SITE_URL
    // If no external target is configured, the request falls through to the
    // Next.js app's own /api/v1 catch-all route (see app/api/v1/[...path])
    // which either proxies at request time or returns a 200 fallback so the
    // client never sees a 404 for filter_pills / listings.
    const explicit = process.env.API_PROXY_URL ?? process.env.API_URL ?? '';
    const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const raw = explicit || publicUrl;
    const normalizeHost = (h) => String(h ?? '').trim().toLowerCase().replace(/^www\./, '');
    const isSameSite = (a, b) => !!a && !!b && normalizeHost(a) === normalizeHost(b);
    try {
      if (!raw || raw.startsWith('/')) return [];
      const target = new URL(raw);
      const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
      let siteHost = '';
      try { siteHost = new URL(siteRaw).host; } catch { siteHost = ''; }

      // When an explicit server-only proxy is set, use it ONLY when it points
      // off-site. Same-site (apex ↔ www) explicit targets would rewrite
      // /api/v1/* back into this same deployment (loop → opaque 500s), so
      // fall through to the local /api/v1 app routes instead. This is the
      // single-service Vercel path while the external system is unreachable
      // (removable later by pointing API_PROXY_URL at a real off-site API).
      if (explicit) {
        if (!explicit.startsWith('/')) {
          const expTarget = new URL(explicit);
          if (siteHost && isSameSite(expTarget.host, siteHost)) return [];
          return [{ source: '/api/v1/:path*', destination: `${expTarget.origin}/api/v1/:path*` }];
        }
        return [];
      }

      // No explicit proxy: only rewrite when public URL points off-site
      // (apex ↔ www counts as same-site — no rewrite).
      if (siteHost && isSameSite(target.host, siteHost)) return [];
      if (target.host.startsWith('localhost') || target.host.startsWith('127.0.0.1')) {
        return [{ source: '/api/v1/:path*', destination: `${target.origin}/api/v1/:path*` }];
      }
      // External API (api.homewolves.africa, homewolves.com apex when site is www, etc.)
      return [{ source: '/api/v1/:path*', destination: `${target.origin}/api/v1/:path*` }];
    } catch {
      return [];
    }
  },
};

module.exports = nextConfig;
