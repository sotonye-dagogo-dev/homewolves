import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/transactions`; }

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

export async function fetchTransactions(params?: { status?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  const r = await fetch(`${getApi()}${q ? `?${q}` : ''}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchMyTransactions() {
  const r = await fetch(`${getApi()}/my`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchTransaction(id: string) {
  const r = await fetch(`${getApi()}/${id}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function createTransaction(data: {
  listingId: string;
  buyerId: string;
  type: 'PURCHASE' | 'RENTAL' | 'SHORTLET';
  customSteps?: { id: string; label: string; order: number }[];
}) {
  const r = await fetch(getApi(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function advanceTransaction(id: string, notes?: string) {
  const r = await fetch(`${getApi()}/${id}/advance`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ notes }),
  });
  return handleRes(r);
}

export async function rejectTransaction(id: string, reason: string) {
  const r = await fetch(`${getApi()}/${id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ reason }),
  });
  return handleRes(r);
}

export async function cancelTransaction(id: string) {
  const r = await fetch(`${getApi()}/${id}/cancel`, {
    method: 'PUT',
    headers: { ...authHeaders() },
  });
  return handleRes(r);
}

export async function addPayment(data: {
  transactionId: string;
  amount: number;
  type: 'deposit' | 'installment' | 'commission' | 'final';
  currency?: string;
  evidenceUrl?: string;
}) {
  const r = await fetch(`${getApi()}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function confirmPayment(paymentId: string, status: 'confirmed' | 'rejected', confirmedBy: string) {
  const r = await fetch(`${getApi()}/payments/confirm`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ paymentId, status, confirmedBy }),
  });
  return handleRes(r);
}

export async function attachPaymentEvidence(paymentId: string, evidenceUrl: string) {
  const r = await fetch(`${getApi()}/payments/${paymentId}/evidence`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ evidenceUrl }),
  });
  return handleRes(r);
}

export async function fetchPendingPayments() {
  const r = await fetch(`${getApi()}/payments/pending`, { headers: authHeaders() });
  return handleRes(r);
}

export async function getPaymentUploadUrl(filename: string, contentType: string) {
  const r = await fetch(`${getApi()}/payments/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ filename, contentType }),
  });
  return handleRes(r);
}
