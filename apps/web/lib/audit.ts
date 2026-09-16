import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/audit`; }

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

export async function fetchAuditLog(params?: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.set('entityType', params.entityType);
  if (params?.entityId) qs.set('entityId', params.entityId);
  if (params?.actorId) qs.set('actorId', params.actorId);
  if (params?.action) qs.set('action', params.action);
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params?.dateTo) qs.set('dateTo', params.dateTo);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  const r = await fetch(`${getApi()}${q ? `?${q}` : ''}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchEntityAudit(entityType: string, entityId: string) {
  const r = await fetch(`${getApi()}/entity/${entityType}/${entityId}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function exportAuditCsv(params?: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.set('entityType', params.entityType);
  if (params?.entityId) qs.set('entityId', params.entityId);
  if (params?.actorId) qs.set('actorId', params.actorId);
  if (params?.action) qs.set('action', params.action);
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params?.dateTo) qs.set('dateTo', params.dateTo);
  const q = qs.toString();
  const r = await fetch(`${getApi()}/export/csv${q ? `?${q}` : ''}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function exportAuditPdf(params?: {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.set('entityType', params.entityType);
  if (params?.entityId) qs.set('entityId', params.entityId);
  if (params?.actorId) qs.set('actorId', params.actorId);
  if (params?.action) qs.set('action', params.action);
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params?.dateTo) qs.set('dateTo', params.dateTo);
  const q = qs.toString();
  const r = await fetch(`${getApi()}/export/pdf${q ? `?${q}` : ''}`, { headers: authHeaders() });
  return handleRes(r);
}
