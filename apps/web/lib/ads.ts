import { getApiBase } from '@/lib/api-base';
import type { AdSlot, AdApplication } from '@/config/fallbacks';
import { FALLBACK_AD_SLOTS, FALLBACK_AD_APPLICATIONS } from '@/config/fallbacks';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('hw-auth');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    if (!parsed.state?.accessToken) return {};
    return { Authorization: `Bearer ${parsed.state.accessToken}` };
  } catch {
    return {};
  }
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const data = await res.json();
    if (Array.isArray(data)) return data as T;
    if (data && typeof data === 'object') {
      const nested = (data as { slots?: unknown; value?: unknown; applications?: unknown });
      if (Array.isArray(nested.slots)) return nested.slots as T;
      if (Array.isArray(nested.applications)) return nested.applications as T;
      if (Array.isArray(nested.value)) return nested.value as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function fetchAdSlots(): Promise<AdSlot[]> {
  return getJson<AdSlot[]>('/ads/slots', FALLBACK_AD_SLOTS);
}

export function fetchAdApplications(): Promise<AdApplication[]> {
  return getJson<AdApplication[]>('/ads/applications', FALLBACK_AD_APPLICATIONS);
}

export async function submitAdApplication(input: { name: string; email: string; company: string; message: string }): Promise<{ ok: boolean; id?: string }> {
  const res = await fetch(`${getApiBase()}/ads/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? 'Could not submit your application. Please try again.');
  }
  return res.json();
}

export async function saveAdSlot(slot: Partial<AdSlot> & { id?: string }): Promise<AdSlot> {
  const res = await fetch(`${getApiBase()}/ads/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(slot),
  });
  if (!res.ok) throw new Error('Could not save the ad slot.');
  return res.json();
}

export async function reviewAdApplication(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const res = await fetch(`${getApiBase()}/ads/applications/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Could not update the application.');
}
