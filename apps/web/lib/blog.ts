import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/blog`; }

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem('hw-auth');
  if (!raw) return {};
  try {
    const { state } = JSON.parse(raw);
    if (!state.accessToken) return {};
    return { Authorization: `Bearer ${state.accessToken}` };
  } catch {
    return {};
  }
}

async function handleRes(r: Response) {
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${r.status}`);
  }
  return r.json();
}

export async function fetchBlogPosts(params?: {
  category?: string;
  tag?: string;
  featured?: boolean;
  published?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.tag) qs.set('tag', params.tag);
  if (params?.featured != null) qs.set('featured', String(params.featured));
  if (params?.published != null) qs.set('published', params.published);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  const r = await fetch(`${getApi()}${q ? `?${q}` : ''}`);
  return handleRes(r);
}

export async function fetchBlogPost(slug: string) {
  const r = await fetch(`${getApi()}/${slug}`);
  return handleRes(r);
}

export async function fetchBlogCategories() {
  const r = await fetch(`${getApi()}/categories`);
  return handleRes(r);
}

export async function createBlogPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  categories?: string[];
  tags?: string[];
  published?: boolean;
  featured?: boolean;
}) {
  const r = await fetch(getApi(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function updateBlogPost(id: string, data: any) {
  const r = await fetch(`${getApi()}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function deleteBlogPost(id: string) {
  const r = await fetch(`${getApi()}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(r);
}
