// Next.js catch-all proxy for /api/v1/* to prevent browser 404s and CORS issues.
// Browser fetches now always hit same-origin /api/v1 (see lib/api-base.ts).
// This route first attempts to proxy to the real NestJS backend (when deployed
// and reachable via API_PROXY_URL / NEXT_PUBLIC_API_URL). If the backend is
// unreachable or returns an error for a known public endpoint, it returns a
// 200 fallback derived from the client's fallback config so that:
//  - GET /api/v1/config/filter_pills never 404s (resolves to FALLBACK_FILTER_PILLS)
//  - GET /api/v1/listings never 404s (resolves to empty paginated response)
//  - GET /api/v1/subscriptions/plans returns fallback plans, etc.
// Authenticated / mutating routes are still proxied transparently and surface
// the backend error when it is not reachable.

import { NextRequest, NextResponse } from 'next/server';
import {
  FALLBACK_AMENITIES,
  FALLBACK_FILTER_PILLS,
  FALLBACK_NAV_ITEMS,
  FALLBACK_PROPERTY_TYPES,
  FALLBACK_FEATURE_FLAGS,
  FALLBACK_SUBSCRIPTION_PLANS,
  FALLBACK_LISTINGS,
  FALLBACK_BLOG_POSTS,
} from '@/config/fallbacks';

export const dynamic = 'force-dynamic';

function backendOrigin(): string | null {
  // Priority: server-only explicit proxy envs
  const explicit = process.env.API_PROXY_URL?.trim() || process.env.API_URL?.trim();
  if (explicit && explicit.length > 0) {
    try {
      // Allow origin with or without path; we only need origin
      const u = new URL(explicit);
      return u.origin;
    } catch {
      return null;
    }
  }

  const pub = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (!pub || pub.startsWith('/')) return null;
  try {
    const u = new URL(pub);
    const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
    let siteHost = '';
    try { siteHost = new URL(siteRaw).host; } catch { siteHost = ''; }
    // If public URL is same host as site, there is no external backend to proxy to
    if (siteHost && u.host === siteHost) return null;
    return u.origin;
  } catch {
    return null;
  }
}

function fallbackForPath(path: string, searchParams: URLSearchParams): unknown | null {
  const p = path.toLowerCase();

  // Config endpoints: /config/:key and /config
  if (p === 'config') {
    return {
      filter_pills: FALLBACK_FILTER_PILLS,
      amenities: FALLBACK_AMENITIES,
      nav_items: FALLBACK_NAV_ITEMS,
      property_types: FALLBACK_PROPERTY_TYPES,
      feature_flags: FALLBACK_FEATURE_FLAGS,
    };
  }
  if (p.startsWith('config/')) {
    const key = p.slice('config/'.length);
    const map: Record<string, unknown> = {
      filter_pills: FALLBACK_FILTER_PILLS,
      amenities: FALLBACK_AMENITIES,
      nav_items: FALLBACK_NAV_ITEMS,
      property_types: FALLBACK_PROPERTY_TYPES,
      feature_flags: FALLBACK_FEATURE_FLAGS,
    };
    if (key in map) return { key, value: map[key] };
    return { key, value: null };
  }

  // Listings — paginated shape expected by useListings / fetchListings
  // Uses demo seed data so production is explorable even without a live DB.
  if (p === 'listings' || p === 'listings/featured') {
    let items = [...FALLBACK_LISTINGS] as any[];
    const cat = searchParams.get('category')?.toUpperCase();
    const search = (searchParams.get('search') ?? '').toLowerCase();
    const propertyType = searchParams.get('propertyType');
    if (p === 'listings/featured') {
      items = items.filter((l) => l.featured);
      return { listings: items.slice(0, 6) };
    }
    if (cat) items = items.filter((l) => l.category === cat);
    if (propertyType) items = items.filter((l) => l.propertyType === propertyType);
    if (search) items = items.filter((l) => l.title.toLowerCase().includes(search) || l.description.toLowerCase().includes(search) || l.locationJson?.city?.toLowerCase().includes(search));
    const skip = Number(searchParams.get('skip') ?? searchParams.get('offset') ?? 0);
    const take = Number(searchParams.get('take') ?? searchParams.get('limit') ?? 12);
    const paged = items.slice(skip, skip + take);
    return { listings: paged, total: items.length, skip, take };
  }
  if (p.startsWith('listings/')) {
    const id = p.slice('listings/'.length).split('/')[0];
    if (id) {
      const found = (FALLBACK_LISTINGS as any[]).find((l) => l.id === id);
      if (found) return found;
      // allow slug fallback to first
      return null;
    }
  }

  // Subscriptions plans
  if (p === 'subscriptions/plans' || p === 'subscriptions') {
    return { plans: FALLBACK_SUBSCRIPTION_PLANS };
  }

  // Blog — paginated shape expected by fetchBlogPosts / blog page
  if (p === 'blog' || p === 'blog/categories' || p === 'blog/categories/list' || p.startsWith('blog')) {
    if (p === 'blog/categories' || p === 'blog/categories/list') {
      const cats = Array.from(new Set((FALLBACK_BLOG_POSTS as any[]).flatMap((b) => b.categories)));
      return cats;
    }
    if (p.startsWith('blog/') && p !== 'blog/categories') {
      const slug = p.slice('blog/'.length);
      const post = (FALLBACK_BLOG_POSTS as any[]).find((b) => b.slug === slug || b.id === slug);
      if (post) return post;
      return null;
    }
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? searchParams.get('take') ?? 12);
    const catFilter = searchParams.get('category');
    let posts = [...FALLBACK_BLOG_POSTS] as any[];
    if (catFilter) posts = posts.filter((b) => b.categories.includes(catFilter));
    const total = posts.length;
    const start = (page - 1) * limit;
    return { posts: posts.slice(start, start + limit), total, page, limit };
  }

  // Health
  if (p === 'health' || p === 'health/ready') {
    return { status: 'ok', fallback: true };
  }

  return null;
}

async function proxyOrFallback(req: NextRequest, params: { path?: string[] }) {
  const path = (params.path ?? []).join('/');
  const search = req.nextUrl.search; // includes ?
  const method = req.method;

  const origin = backendOrigin();

  // Attempt to proxy to real backend if we have an external origin
  if (origin) {
    const targetUrl = `${origin}/api/v1/${path}${search}`;
    try {
      const headers: Record<string, string> = {};
      // Forward relevant headers
      const auth = req.headers.get('authorization');
      if (auth) headers['authorization'] = auth;
      const contentType = req.headers.get('content-type');
      if (contentType) headers['content-type'] = contentType;

      const fetchOpts: RequestInit = {
        method,
        headers,
        // Next.js server fetch should not cache proxied responses by default
        cache: 'no-store',
      };
      if (method !== 'GET' && method !== 'HEAD') {
        const body = await req.text();
        if (body) fetchOpts.body = body;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const upstream = await fetch(targetUrl, { ...fetchOpts, signal: controller.signal });
      clearTimeout(timeout);

      // If upstream succeeded or returned a meaningful status (not 404 loop), return it
      if (upstream.ok) {
        const text = await upstream.text();
        const contentTypeOut = upstream.headers.get('content-type') ?? 'application/json';
        return new NextResponse(text, {
          status: upstream.status,
          headers: { 'content-type': contentTypeOut },
        });
      }

      // For public GETs where upstream 404s (e.g. no seed data) -> fall through to fallback if available
      if (method === 'GET') {
        const fb = fallbackForPath(path, req.nextUrl.searchParams);
        if (fb !== null) {
          return NextResponse.json(fb, { status: 200 });
        }
      }

      // Otherwise return upstream error as-is (preserve status/body)
      const text = await upstream.text().catch(() => '');
      return new NextResponse(text || upstream.statusText, {
        status: upstream.status,
        headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
      });
    } catch {
      // Network error / timeout -> fallback for safe GETs, else 502
      if (method === 'GET') {
        const fb = fallbackForPath(path, req.nextUrl.searchParams);
        if (fb !== null) return NextResponse.json(fb, { status: 200 });
      }
      // For mutating routes, surface gateway error rather than silent 200
      if (method !== 'GET') {
        return NextResponse.json({ message: 'Backend unavailable', fallback: false }, { status: 502 });
      }
      const fb = fallbackForPath(path, req.nextUrl.searchParams);
      if (fb !== null) return NextResponse.json(fb, { status: 200 });
      return NextResponse.json({ message: 'Backend unavailable' }, { status: 502 });
    }
  }

  // No external backend configured — serve fallbacks for safe public GETs
  if (method === 'GET') {
    const fb = fallbackForPath(path, req.nextUrl.searchParams);
    if (fb !== null) return NextResponse.json(fb, { status: 200 });
  }

  // No backend and no fallback -> 200 empty for unknown GETs to avoid browser 404 logs
  // for public content; for mutating routes return 502 so the UI can show a proper error.
  if (method === 'GET') {
    // Generic safe empty shape to prevent console 404 noise
    return NextResponse.json({ fallback: true, path }, { status: 200 });
  }
  return NextResponse.json({ message: 'API not configured', path }, { status: 502 });
}

export async function GET(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxyOrFallback(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxyOrFallback(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxyOrFallback(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxyOrFallback(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxyOrFallback(req, ctx.params);
}
export async function OPTIONS(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxyOrFallback(req, ctx.params);
}
