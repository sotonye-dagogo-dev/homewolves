import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/bug-reports`; }

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

export async function createBugReport(data: {
  type: string;
  description: string;
  screenshots?: string[];
  errorMessage?: string;
  stackTrace?: string;
  componentName?: string;
  url?: string;
}) {
  const r = await fetch(getApi(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function fetchBugReports(params?: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.type) qs.set('type', params.type);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  const r = await fetch(`${getApi()}${q ? `?${q}` : ''}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchMyBugReports(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  const r = await fetch(`${getApi()}/mine${q ? `?${q}` : ''}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchBugReport(id: string) {
  const r = await fetch(`${getApi()}/${id}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function updateBugReportStatus(id: string, data: { status: string; adminNote?: string }) {
  const r = await fetch(`${getApi()}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function batchUpdateBugReports(data: { ids: string[]; status: string; adminNote?: string }) {
  const r = await fetch(`${getApi()}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function deleteBugReport(id: string) {
  const r = await fetch(`${getApi()}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleRes(r);
}
