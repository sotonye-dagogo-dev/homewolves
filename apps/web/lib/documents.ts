import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/documents`; }

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

export async function uploadDocument(data: {
  transactionId: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  visibility?: string;
}) {
  const r = await fetch(getApi(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function fetchTransactionDocuments(transactionId: string) {
  const r = await fetch(`${getApi()}/transaction/${transactionId}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchDocument(id: string) {
  const r = await fetch(`${getApi()}/${id}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function deleteDocument(id: string) {
  const r = await fetch(`${getApi()}/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleRes(r);
}

export async function updateDocumentVisibility(id: string, visibility: string) {
  const r = await fetch(`${getApi()}/${id}/visibility`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ visibility }),
  });
  return handleRes(r);
}

export async function getDocumentUploadUrl(filename: string, contentType: string) {
  const r = await fetch(`${getApi()}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ filename, contentType }),
  });
  return handleRes(r);
}
