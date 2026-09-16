import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/referrals`; }

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

export async function fetchMyReferral() {
  const r = await fetch(`${getApi()}/me`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchMyCommissions() {
  const r = await fetch(`${getApi()}/commissions`, { headers: authHeaders() });
  return handleRes(r);
}

export async function resolveReferralCode(code: string) {
  const r = await fetch(`${getApi()}/resolve?code=${encodeURIComponent(code)}`, { headers: authHeaders() });
  return handleRes(r);
}

export async function applyReferralCode(code: string) {
  const r = await fetch(`${getApi()}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code }),
  });
  return handleRes(r);
}

export async function fetchReferralStats() {
  const r = await fetch(`${getApi()}/stats`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchAllReferrals(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const r = await fetch(`${getApi()}/all${qs}`, { headers: authHeaders() });
  return handleRes(r);
}
