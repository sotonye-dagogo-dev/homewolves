/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hw/types'],
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
    try {
      if (!raw || raw.startsWith('/')) return [];
      const target = new URL(raw);
      const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
      let siteHost = '';
      try { siteHost = new URL(siteRaw).host; } catch { siteHost = ''; }

      // When an explicit server-only proxy is set, always use it — even if
      // NEXT_PUBLIC_API_URL equals the site host. This is the intended path
      // for MVP where web and API share www but API lives elsewhere.
      if (explicit) {
        if (!explicit.startsWith('/')) {
          const expTarget = new URL(explicit);
          return [{ source: '/api/v1/:path*', destination: `${expTarget.origin}/api/v1/:path*` }];
        }
        return [];
      }

      // No explicit proxy: only rewrite when public URL points off-site.
      if (target.host === siteHost) return [];
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
