import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/signatures`; }

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

export async function createSignatureRequest(data: {
  transactionId: string;
  documentId?: string;
  signerId: string;
  signerEmail: string;
  signerName: string;
}) {
  const r = await fetch(getApi(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes(r);
}

export async function fetchTransactionSignatures(transactionId: string) {
  const r = await fetch(`${getApi()}/transaction/${transactionId}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchSignature(id: string) {
  const r = await fetch(`${getApi()}/${id}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function getSignatureEmbedUrl(id: string) {
  const r = await fetch(`${getApi()}/${id}/embed`, { headers: authHeaders() });
  return handleRes(r);
}
