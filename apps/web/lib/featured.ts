import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/featured-listings`; }

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

export async function fetchFeaturedListings(take = 6) {
  const r = await fetch(`${getApi()}?take=${take}`);
  return handleRes(r);
}

export async function fetchMyFeaturedPlacements() {
  const r = await fetch(`${getApi()}/my`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchFeaturedProviderStatus() {
  const r = await fetch(`${getApi()}/provider-status`);
  return handleRes(r);
}

export async function purchaseFeaturedPlacement(listingId: string, days: number) {
  const r = await fetch(`${getApi()}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ listingId, days }),
  });
  return handleRes(r);
}

export async function cancelFeaturedPlacement(id: string) {
  const r = await fetch(`${getApi()}/${id}/cancel`, { method: 'POST', headers: authHeaders() });
  return handleRes(r);
}
