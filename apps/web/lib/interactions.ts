import { getApiBase } from '@/lib/api-base';


function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('hw-session');
  if (!id) {
    id = crypto.randomUUID?.() ?? Date.now().toString(36);
    sessionStorage.setItem('hw-session', id);
  }
  return id;
}

function authToken(): string {
  if (typeof window === 'undefined') return '';
  const raw = localStorage.getItem('hw-auth');
  if (!raw) return '';
  try {
    return JSON.parse(raw).state?.accessToken ?? '';
  } catch {
    return '';
  }
}

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function recordView(listingId: string, _userId?: string) {
  await fetch(`${getApiBase()}/recently-viewed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      listingId,
      sessionId: authToken() ? undefined : getSessionId(),
    }),
  });
}

export async function getRecentViews(_userId?: string) {
  const params = new URLSearchParams();
  const token = authToken();
  if (token) params.set('userId', 'me');
  else params.set('sessionId', getSessionId());

  const res = await fetch(`${getApiBase()}/recently-viewed?${params}`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function toggleSave(listingId: string, token: string) {
  const res = await fetch(`${getApiBase()}/saved/${listingId}/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to toggle save');
  return res.json();
}

export async function getSavedListings(token: string) {
  const res = await fetch(`${getApiBase()}/saved`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function checkSaved(listingId: string, token: string) {
  const res = await fetch(`${getApiBase()}/saved/${listingId}/check`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { saved: false };
  return res.json();
}
