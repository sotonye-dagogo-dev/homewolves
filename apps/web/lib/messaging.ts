import type { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { getApiBase } from '@/lib/api-base';
import {
  acquireRealtimeSocket,
  getRealtimeSocket,
  releaseRealtimeSocket,
} from '@/lib/realtime';

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

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['conversations', 'messages', 'items', 'data']) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

// ─── REST API ────────────────────────────────────────────

export async function fetchConversations() {
  const res = await fetch(`${getApiBase()}/messaging/conversations`, { headers: authHeaders() });
  return toArray(await handleResponse(res));
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
  return toArray(await handleResponse(res));
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

// ─── REST send fallback ──────────────────────────────────

/**
 * Send a message over REST. Used when realtime is disabled/unavailable so
 * messaging remains fully functional on serverless deployments.
 */
export async function sendMessageRest(
  conversationId: string,
  content: string,
  type = 'text',
  mediaUrl?: string,
) {
  const res = await fetch(`${getApiBase()}/messaging/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content, type, ...(mediaUrl ? { mediaUrl } : {}) }),
  });
  return handleResponse(res);
}

// ─── WEB SOCKET (opt-in) ─────────────────────────────────

export function isSocketConnected(): boolean {
  return Boolean(getRealtimeSocket()?.connected);
}

export function getSocket(): Socket | null {
  return getRealtimeSocket();
}

/**
 * Acquire the shared realtime socket. Returns null when realtime is not
 * configured — callers must fall back to REST/polling.
 */
export function connectSocket(userId: string, token: string): Socket | null {
  return acquireRealtimeSocket(userId, token);
}

export function disconnectSocket() {
  releaseRealtimeSocket();
}

export function joinConversation(conversationId: string) {
  getRealtimeSocket()?.emit('join:conversation', conversationId);
}

export function leaveConversation(conversationId: string) {
  getRealtimeSocket()?.emit('leave:conversation', conversationId);
}

export function sendMessage(conversationId: string, content: string, type = 'text', mediaUrl?: string) {
  getRealtimeSocket()?.emit('message:send', { conversationId, content, type, mediaUrl });
}

export function markRead(conversationId: string) {
  getRealtimeSocket()?.emit('message:mark-read', conversationId);
}

export function startTyping(conversationId: string) {
  getRealtimeSocket()?.emit('typing:start', conversationId);
}

export function stopTyping(conversationId: string) {
  getRealtimeSocket()?.emit('typing:stop', conversationId);
}
