import { getApiBase } from '@/lib/api-base';
function getApi() { return `${getApiBase()}/activity`; }

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

export async function fetchLeaderboard(limit = 20) {
  const r = await fetch(`${getApi()}/leaderboard?limit=${limit}`);
  return handleRes(r);
}

export async function fetchMyStats() {
  const r = await fetch(`${getApi()}/stats`, { headers: authHeaders() });
  return handleRes(r);
}

export async function fetchAgentStats(agentId: string) {
  const r = await fetch(`${getApi()}/stats/${agentId}`);
  return handleRes(r);
}

export async function fetchTiers() {
  const r = await fetch(`${getApi()}/tiers`);
  return handleRes(r);
}

export async function awardPoints(ruleKey: string) {
  const r = await fetch(`${getApi()}/award/${ruleKey}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleRes(r);
}
