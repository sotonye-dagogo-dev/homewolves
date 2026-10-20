import { io, type Socket } from 'socket.io-client';

/**
 * Config-driven realtime transport.
 *
 * Realtime is opt-in (`NEXT_PUBLIC_REALTIME_ENABLED=true`) and only works when
 * a Socket.io-capable backend is deployed. The Next.js app on Vercel cannot
 * host WebSockets, so attempting a connection against the same origin spams
 * the console with `wss://…/socket.io/ … failed` and never succeeds.
 *
 * When realtime is disabled/unavailable every consumer falls back to REST +
 * polling, so messaging and notifications keep working end-to-end.
 */

export function isRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REALTIME_ENABLED === 'true';
}

function socketOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configured) {
    if (configured.startsWith('/')) {
      if (typeof window === 'undefined') return null;
      return window.location.origin;
    }
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return null;
}

/**
 * Fully-qualified namespace URL (the API gateway listens on `/ws`).
 * Returns null when realtime is disabled or no origin is available.
 */
export function realtimeUrl(): string | null {
  if (!isRealtimeEnabled()) return null;
  const origin = socketOrigin();
  if (!origin) return null;
  return `${origin.replace(/\/$/, '')}/ws`;
}

let socket: Socket | null = null;
let refCount = 0;
let currentIdentity = '';
let warned = false;

/**
 * Acquire a shared Socket.io connection. Consumers must pair every acquire
 * with `releaseRealtimeSocket` (done in hook cleanups).
 */
export function acquireRealtimeSocket(userId: string, token?: string | null): Socket | null {
  const url = realtimeUrl();
  if (!url || !userId) return null;

  const identity = `${url}|${userId}|${token ?? ''}`;
  if (socket && identity !== currentIdentity) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    currentIdentity = identity;
    socket = io(url, {
      query: { userId },
      auth: { token: token ?? undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 8000,
    });

    socket.on('connect_error', () => {
      // One concise warning per session; polling fallback is already active.
      if (!warned) {
        warned = true;
        // eslint-disable-next-line no-console
        console.warn('[realtime] Socket unavailable — falling back to REST polling.');
      }
    });
  }

  refCount += 1;
  return socket;
}

export function releaseRealtimeSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
    currentIdentity = '';
  }
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}

export function disconnectRealtime(): void {
  refCount = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
    currentIdentity = '';
  }
}
