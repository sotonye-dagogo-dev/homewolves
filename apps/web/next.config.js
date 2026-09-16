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
    // Proxy same-origin /api/v1/* to the actual NestJS API. This makes browser
    // fetches stay same-origin (no CORS, no apex→www 308) while the server
    // forwards to the real backend.
    // Priority: explicit API_PROXY_URL / API_URL env, then NEXT_PUBLIC_API_URL.
    // If none are absolute external hosts, the rewrite is no-op (returns []).
    const raw =
      process.env.API_PROXY_URL ??
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      '';
    // Only create a rewrite when the target is an absolute external URL
    // that is NOT the same origin as the Next.js site itself. If target host
    // equals NEXT_PUBLIC_SITE_URL host, skip rewrite to avoid loop.
    try {
      if (!raw || raw.startsWith('/')) return [];
      const target = new URL(raw);
      const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
      const siteHost = new URL(siteRaw).host;
      // If API host is same as site host (e.g. both www.homewolves.com), the
      // fetch is already same-origin — no rewrite needed.
      if (target.host === siteHost) return [];
      // For localhost dev, proxy to local NestJS
      if (target.host.startsWith('localhost')) {
        return [{ source: '/api/v1/:path*', destination: `${target.origin}/api/v1/:path*` }];
      }
      // External API (e.g. api.homewolves.africa, homewolves.com) — proxy
      return [{ source: '/api/v1/:path*', destination: `${target.origin}/api/v1/:path*` }];
    } catch {
      return [];
    }
  },
};

module.exports = nextConfig;
