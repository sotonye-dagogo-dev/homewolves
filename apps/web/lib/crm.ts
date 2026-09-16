import { useAuth } from '@/hooks/use-auth';
import { getApiBase } from '@/lib/api-base';



function authHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = token ?? useAuth.getState().accessToken;
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json();
}

// ─── CLIENTS ─────────────────────────────────────────────

export async function fetchClients(params?: { status?: string; search?: string }) {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)) as Record<string, string>,
  ).toString() : '';
  const res = await fetch(`${getApiBase()}/crm/clients${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchClientById(id: string) {
  const res = await fetch(`${getApiBase()}/crm/clients/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createClient(buyerId: string, status?: string) {
  const res = await fetch(`${getApiBase()}/crm/clients`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ buyerId, status }),
  });
  return handleResponse(res);
}

export async function updateClient(id: string, data: { status?: string }) {
  const res = await fetch(`${getApiBase()}/crm/clients/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── NOTES ───────────────────────────────────────────────

export async function addNote(clientId: string, content: string) {
  const res = await fetch(`${getApiBase()}/crm/clients/${clientId}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

export async function fetchNotes(clientId: string) {
  const res = await fetch(`${getApiBase()}/crm/clients/${clientId}/notes`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── RATINGS ─────────────────────────────────────────────

export async function addRating(clientId: string, score: number, review?: string) {
  const res = await fetch(`${getApiBase()}/crm/clients/${clientId}/ratings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ score, review }),
  });
  return handleResponse(res);
}

export async function fetchRatings(clientId: string) {
  const res = await fetch(`${getApiBase()}/crm/clients/${clientId}/ratings`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── INSPECTIONS ─────────────────────────────────────────

export async function createInspection(data: { clientId: string; listingId: string; scheduledAt: string; notes?: string }) {
  const res = await fetch(`${getApiBase()}/crm/inspections`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function fetchInspections(date?: string) {
  const qs = date ? `?date=${date}` : '';
  const res = await fetch(`${getApiBase()}/crm/inspections${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function updateInspection(id: string, data: { status?: string; scheduledAt?: string; notes?: string }) {
  const res = await fetch(`${getApiBase()}/crm/inspections/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── DASHBOARD ───────────────────────────────────────────

export async function fetchDashboardStats() {
  const res = await fetch(`${getApiBase()}/crm/dashboard/stats`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchRecentClients() {
  const res = await fetch(`${getApiBase()}/crm/dashboard/recent-clients`, { headers: authHeaders() });
  return handleResponse(res);
}
