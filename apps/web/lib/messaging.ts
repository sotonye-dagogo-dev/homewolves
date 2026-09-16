import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { getApiBase } from '@/lib/api-base';


function getWsUrl(): string {
  const env = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (typeof window === 'undefined') return env && env.length > 0 ? env : 'http://localhost:4000';
  if (!env || env.length === 0) return window.location.origin.replace(/^http/, 'ws');
  if (env.startsWith('/')) return `${window.location.origin.replace(/^http/, 'ws')}${env}`;
  try {
    const envUrl = new URL(env);
    const locHost = window.location.host;
    const envHost = envUrl.host;
    const stripWww = (h: string) => h.replace(/^www\./i, '');
    if (stripWww(envHost) === stripWww(locHost) && envHost !== locHost) {
      return env.replace(envHost, locHost);
    }
    if (locHost.endsWith('homewolves.com') && envHost.endsWith('homewolves.com') && envHost !== locHost) {
      return env.replace(envHost, locHost);
    }
  } catch {}
  return env;
}

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

// ─── REST API ────────────────────────────────────────────

export async function fetchConversations() {
  const res = await fetch(`${getApiBase()}/messaging/conversations`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchConversation(id: string) {
  const res = await fetch(`${getApiBase()}/messaging/conversations/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createConversation(participantIds: string[], propertyId?: string) {
  const res = await fetch(`${getApiBase()}/messaging/conversations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ participantIds, propertyId }),
  });
  return handleResponse(res);
}

export async function fetchMessages(conversationId: string) {
  const res = await fetch(`${getApiBase()}/messaging/conversations/${conversationId}/messages`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function markConversationRead(conversationId: string) {
  const res = await fetch(`${getApiBase()}/messaging/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchUnreadCount() {
  const res = await fetch(`${getApiBase()}/messaging/unread`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── WEB SOCKET ──────────────────────────────────────────

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function connectSocket(userId: string, token: string): Socket {
  if (socketInstance?.connected) return socketInstance;

  socketInstance = io(`${getWsUrl()}/ws`, {
    query: { userId },
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socketInstance.on('connect', () => {
    void 0;
  });

  socketInstance.on('disconnect', () => {
    void 0;
  });

  socketInstance.on('error', (err: any) => {
    void err;
  });

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function joinConversation(conversationId: string) {
  socketInstance?.emit('join:conversation', conversationId);
}

export function leaveConversation(conversationId: string) {
  socketInstance?.emit('leave:conversation', conversationId);
}

export function sendMessage(conversationId: string, content: string, type = 'text', mediaUrl?: string) {
  socketInstance?.emit('message:send', { conversationId, content, type, mediaUrl });
}

export function markRead(conversationId: string) {
  socketInstance?.emit('message:mark-read', conversationId);
}

export function startTyping(conversationId: string) {
  socketInstance?.emit('typing:start', conversationId);
}

export function stopTyping(conversationId: string) {
  socketInstance?.emit('typing:stop', conversationId);
}
