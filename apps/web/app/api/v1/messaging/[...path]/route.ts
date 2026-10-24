/**
 * Messaging route handlers — take precedence over the catch-all [...path]
 * proxy for /api/v1/messaging/*.
 *
 * When an off-site NestJS backend is configured (API_PROXY_URL / external
 * NEXT_PUBLIC_API_URL) requests are proxied to it. Otherwise handlers run
 * locally against Postgres so the inbox, member directory, deep-linked
 * "Chat Agent" conversations, messages, read receipts and unread counts all
 * work end-to-end on the single-service Vercel deployment instead of
 * returning the catch-all 502 "API not configured".
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/server/auth-local';
import {
  backendOrigin,
  getSql,
  isMissingTableError,
  logDbError,
  type SqlClient,
} from '@/lib/server/local-db';
import {
  MessagingError,
  countUnread,
  createConversation,
  getConversation,
  listConversations,
  listDirectory,
  listMessages,
  markRead,
  sendMessage,
} from '@/lib/server/messaging-local';

export const dynamic = 'force-dynamic';

const USER_ROLES = ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN', 'SUPER_ADMIN'];
const MESSAGE_TYPES = ['text', 'image', 'file'];

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json(code ? { message, code } : { message }, { status });
}

function authUserId(req: NextRequest): string | null {
  const header = req.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const payload = verifyJwt(token);
  if (!payload || payload.typ === 'refresh' || !payload.sub) return null;
  return payload.sub;
}

/**
 * Proxy to the external backend when one is genuinely configured. Returns
 * `null` when the request should be handled locally (no backend, network
 * failure, or upstream 5xx — the local DB path is a safer fallback).
 */
async function tryProxy(req: NextRequest, path: string): Promise<NextResponse | null> {
  const origin = backendOrigin(req);
  if (!origin) return null;
  try {
    const headers: Record<string, string> = {};
    const auth = req.headers.get('authorization');
    if (auth) headers.authorization = auth;
    const contentType = req.headers.get('content-type');
    if (contentType) headers['content-type'] = contentType;

    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();
    const upstream = await fetch(`${origin}/api/v1/messaging/${path}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    if (upstream.status >= 500) {
      console.error(`[messaging] backend ${upstream.status} — falling back to local handling`);
      return null;
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    logDbError('[messaging] backend proxy failed', err);
    return null;
  }
}

function parseDirectoryQuery(searchParams: URLSearchParams):
  | { ok: true; value: { search?: string; role?: string; take?: number } }
  | { ok: false; response: NextResponse } {
  const search = searchParams.get('search')?.trim() ?? '';
  if (search.length > 64) {
    return { ok: false, response: jsonError('Search is too long.', 400) };
  }
  const role = searchParams.get('role')?.trim().toUpperCase() ?? '';
  if (role && !USER_ROLES.includes(role)) {
    return { ok: false, response: jsonError('Unknown member role filter.', 400) };
  }
  const rawTake = searchParams.get('take');
  let take: number | undefined;
  if (rawTake != null) {
    take = Number(rawTake);
    if (!Number.isInteger(take) || take < 1 || take > 50) {
      return { ok: false, response: jsonError('take must be between 1 and 50.', 400) };
    }
  }
  return {
    ok: true,
    value: {
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(take ? { take } : {}),
    },
  };
}

async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function validateCreateConversation(body: Record<string, unknown> | null):
  | { ok: true; participantIds: string[]; propertyId?: string }
  | { ok: false; response: NextResponse } {
  if (!body) return { ok: false, response: jsonError('Invalid request body.', 400) };
  const rawIds = body.participantIds;
  if (!Array.isArray(rawIds) || rawIds.length < 1 || rawIds.length > 50) {
    return { ok: false, response: jsonError('Select at least one member to message.', 400) };
  }
  const participantIds = rawIds
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && id.length <= 64);
  if (participantIds.length !== rawIds.length) {
    return { ok: false, response: jsonError('One or more recipients are invalid.', 400) };
  }
  let propertyId: string | undefined;
  if (body.propertyId != null) {
    if (typeof body.propertyId !== 'string' || body.propertyId.length > 64) {
      return { ok: false, response: jsonError('Invalid property reference.', 400) };
    }
    propertyId = body.propertyId.trim() || undefined;
  }
  return { ok: true, participantIds, ...(propertyId ? { propertyId } : {}) };
}

function validateSendMessage(body: Record<string, unknown> | null):
  | { ok: true; content: string; type: string; mediaUrl?: string }
  | { ok: false; response: NextResponse } {
  if (!body) return { ok: false, response: jsonError('Invalid request body.', 400) };
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 4000) {
    return { ok: false, response: jsonError('Message must be between 1 and 4000 characters.', 400) };
  }
  const type = typeof body.type === 'string' ? body.type : 'text';
  if (!MESSAGE_TYPES.includes(type)) {
    return { ok: false, response: jsonError('Unsupported message type.', 400) };
  }
  let mediaUrl: string | undefined;
  if (body.mediaUrl != null) {
    if (typeof body.mediaUrl !== 'string' || body.mediaUrl.length > 2048) {
      return { ok: false, response: jsonError('Invalid media URL.', 400) };
    }
    try {
      const url = new URL(body.mediaUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error('bad protocol');
      mediaUrl = url.toString();
    } catch {
      return { ok: false, response: jsonError('Invalid media URL.', 400) };
    }
  }
  return { ok: true, content, type, ...(mediaUrl ? { mediaUrl } : {}) };
}

async function requireSql(): Promise<SqlClient | NextResponse> {
  const sql = await getSql();
  if (!sql) {
    return jsonError(
      'Messaging requires DATABASE_URL to be configured.',
      503,
      'DB_NOT_CONFIGURED',
    );
  }
  return sql;
}

function handleMessagingError(err: unknown): NextResponse {
  if (err instanceof MessagingError) {
    return jsonError(err.message, err.status);
  }
  if (isMissingTableError(err)) {
    return jsonError(
      'Database tables are not set up yet. Migrations run automatically on the next deployment — please try again shortly.',
      503,
      'DB_NOT_MIGRATED',
    );
  }
  logDbError('[messaging] unexpected failure', err);
  return jsonError('Something went wrong. Please try again.', 500, 'UNEXPECTED');
}

async function localHandler(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const userId = authUserId(req);
  if (!userId) {
    return jsonError('Your session has expired. Please sign in again.', 401, 'UNAUTHORIZED');
  }

  const sqlOrResponse = await requireSql();
  if (sqlOrResponse instanceof NextResponse) return sqlOrResponse;
  const sql = sqlOrResponse;

  const [root, conversationId, child] = segments;

  try {
    if (root === 'directory' && !conversationId && req.method === 'GET') {
      const parsed = parseDirectoryQuery(req.nextUrl.searchParams);
      if (!parsed.ok) return parsed.response;
      return NextResponse.json(
        await listDirectory(sql, { ...parsed.value, excludeUserId: userId }),
      );
    }

    if (root === 'unread' && !conversationId && req.method === 'GET') {
      return NextResponse.json(await countUnread(sql, userId));
    }

    if (root === 'conversations') {
      if (!conversationId && req.method === 'GET') {
        return NextResponse.json(await listConversations(sql, userId));
      }

      if (!conversationId && req.method === 'POST') {
        const parsed = validateCreateConversation(await readJson(req));
        if (!parsed.ok) return parsed.response;
        return NextResponse.json(
          await createConversation(sql, parsed.participantIds, parsed.propertyId, userId),
          { status: 201 },
        );
      }

      if (conversationId && !child && req.method === 'GET') {
        return NextResponse.json(await getConversation(sql, conversationId, userId));
      }

      if (conversationId && child === 'messages' && req.method === 'GET') {
        return NextResponse.json(await listMessages(sql, conversationId, userId));
      }

      if (conversationId && child === 'messages' && req.method === 'POST') {
        const parsed = validateSendMessage(await readJson(req));
        if (!parsed.ok) return parsed.response;
        return NextResponse.json(
          await sendMessage(
            sql,
            conversationId,
            userId,
            parsed.content,
            parsed.type,
            parsed.mediaUrl,
          ),
          { status: 201 },
        );
      }

      if (conversationId && child === 'read' && req.method === 'POST') {
        return NextResponse.json(await markRead(sql, conversationId, userId));
      }
    }

    return jsonError('Not found.', 404);
  } catch (err) {
    return handleMessagingError(err);
  }
}

async function handle(req: NextRequest, ctx: { params: { path?: string[] } }): Promise<NextResponse> {
  const segments = ctx.params.path ?? [];
  const path = segments.join('/');

  const proxied = await tryProxy(req, path);
  if (proxied) return proxied;

  return localHandler(req, segments);
}

export async function GET(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return handle(req, ctx);
}
