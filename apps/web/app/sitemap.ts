import type { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';

const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE_URL}/properties`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
];

async function fetchDynamic() {
  try {
    const [listingsRes, postsRes] = await Promise.all([
      fetch(`${API_BASE}/listings?take=50&status=ACTIVE`),
      fetch(`${API_BASE}/blog?published=true&limit=50`),
    ]);
    const [listings, posts] = await Promise.all([listingsRes.json(), postsRes.json()]);

    const listingUrls = (listings?.listings ?? []).map((l: any) => ({
      url: `${BASE_URL}/properties/${l.id}`,
      lastModified: l.updatedAt ? new Date(l.updatedAt) : undefined,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const blogUrls = (posts?.posts ?? []).map((p: any) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...listingUrls, ...blogUrls];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic = await fetchDynamic();
  return [...staticRoutes, ...dynamic];
}
