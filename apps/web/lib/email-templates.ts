import { FALLBACK_EMAIL_TEMPLATES } from '@/config/fallbacks';
import { getApiBase } from '@/lib/api-base';

function getApi() { return `${getApiBase()}/email-templates`; }

export interface EmailTemplateDto {
  id?: string;
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  fromEmail?: string | null;
  active: boolean;
  description?: string;
  variables?: { name: string; label: string; example?: string }[];
  updatedAt?: string;
}

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

async function handleRes<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${r.status}`);
  }
  return r.json();
}

export async function fetchEmailTemplates(): Promise<EmailTemplateDto[]> {
  try {
    const res = await fetch(getApi(), { headers: authHeaders() });
    if (!res.ok) return [...FALLBACK_EMAIL_TEMPLATES];
    return handleRes<EmailTemplateDto[]>(res);
  } catch {
    return [...FALLBACK_EMAIL_TEMPLATES];
  }
}

export async function previewEmailTemplate(data: {
  key: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  variables?: Record<string, unknown>;
}) {
  const res = await fetch(`${getApi()}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes<{ subject: string; htmlBody: string; textBody: string | null }>(res);
}

export async function saveEmailTemplate(data: {
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  fromEmail?: string | null;
  active?: boolean;
}) {
  const res = await fetch(`${getApi()}/${encodeURIComponent(data.key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleRes<EmailTemplateDto>(res);
}

export async function seedEmailTemplates() {
  const res = await fetch(`${getApi()}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  return handleRes<number>(res);
}

export { FALLBACK_EMAIL_TEMPLATES };