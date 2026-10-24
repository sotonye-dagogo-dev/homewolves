/**
 * Local (Postgres) implementation of the messaging domain.
 *
 * Used by the messaging route when no off-site NestJS backend is configured.
 * Mirrors `packages/api/src/modules/messaging/messaging.service.ts`:
 *  - find-or-create 1:1 conversations (idempotent for repeated "Chat Agent")
 *  - participant-only access to conversations/messages
 *  - privacy-safe directory (never phone/email)
 *  - read receipts + unread counts
 *
 * Raw SQL is used deliberately: the web app does not bundle Drizzle and the
 * schema is already migration-managed in `packages/api`.
 */
import { randomUUID } from 'node:crypto';
import type { SqlClient } from './local-db';

export type MessagingStatus = 400 | 403 | 404 | 409 | 500;

export class MessagingError extends Error {
  constructor(
    public readonly status: MessagingStatus,
    message: string,
  ) {
    super(message);
    this.name = 'MessagingError';
  }
}

interface ParticipantRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  avatar: string | null;
  phone?: string | null;
  verified?: boolean | null;
}

export interface ConversationRow {
  id: string;
  propertyId: string | null;
  participantIds: string[];
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
  sender?: ParticipantRow | null;
}

export interface ConversationView extends ConversationRow {
  participants: ParticipantRow[];
  messages: MessageRow[];
}

export interface DirectoryOptions {
  search?: string;
  role?: string;
  take?: number;
  excludeUserId?: string;
}

interface RawConversation {
  id: string;
  propertyId: string | null;
  participantIds: string[] | null;
  lastMessageAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

function asDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function toConversation(row: RawConversation): ConversationRow {
  return {
    id: row.id,
    propertyId: row.propertyId ?? null,
    participantIds: Array.isArray(row.participantIds) ? row.participantIds : [],
    lastMessageAt: asDate(row.lastMessageAt),
    createdAt: asDate(row.createdAt) ?? new Date(0),
    updatedAt: asDate(row.updatedAt) ?? new Date(0),
  };
}

function toMessage(row: RawMessage): MessageRow {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    type: row.type,
    mediaUrl: row.mediaUrl ?? null,
    readAt: asDate(row.readAt),
    createdAt: asDate(row.createdAt) ?? new Date(0),
  };
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function isParticipant(conversation: { participantIds: string[] }, userId: string): boolean {
  return conversation.participantIds.includes(userId);
}

async function participantProfiles(
  sql: SqlClient,
  participantIds: string[],
): Promise<ParticipantRow[]> {
  const ids = uniqueIds(participantIds);
  if (ids.length === 0) return [];
  // Conversation participants may see each other's phone (matches the
  // NestJS service). The directory never selects phone/email.
  const rows = await sql`
    SELECT id, "firstName", "lastName", role, avatar, phone
    FROM "User"
    WHERE id = ANY(${sql.array(ids)}::text[])
  `;
  return rows as unknown as ParticipantRow[];
}

export async function listDirectory(
  sql: SqlClient,
  options: DirectoryOptions,
): Promise<ParticipantRow[]> {
  const take = Math.max(1, Math.min(options.take ?? 25, 50));
  const search = options.search?.trim() ?? '';
  const searchPattern = `%${search}%`;
  const role = options.role?.trim().toUpperCase() ?? '';
  const roleParam = role || null;
  const exclude = options.excludeUserId?.trim() ?? '';

  const rows = await sql`
    SELECT id, "firstName", "lastName", role, avatar, verified
    FROM "User"
    WHERE id <> ${exclude}
      AND (${search}::text = '' OR "firstName" ILIKE ${searchPattern} OR "lastName" ILIKE ${searchPattern})
      AND (${roleParam}::"UserRole" IS NULL OR role = ${roleParam}::"UserRole")
    ORDER BY verified DESC, "firstName" ASC
    LIMIT ${take}
  `;
  return rows as unknown as ParticipantRow[];
}

export async function listConversations(
  sql: SqlClient,
  userId: string,
): Promise<ConversationView[]> {
  const rows = (await sql`
    SELECT id, "propertyId", "participantIds", "lastMessageAt", "createdAt", "updatedAt"
    FROM "Conversation"
    WHERE "participantIds" @> ARRAY[${userId}]::text[]
    ORDER BY COALESCE("lastMessageAt", "createdAt") DESC
  `) as unknown as RawConversation[];

  if (rows.length === 0) return [];
  const conversations = rows.map(toConversation);
  const conversationIds = conversations.map((c) => c.id);

  const lastMessages = (await sql`
    SELECT DISTINCT ON ("conversationId")
      id, "conversationId", "senderId", content, type, "mediaUrl", "readAt", "createdAt"
    FROM "Message"
    WHERE "conversationId" = ANY(${sql.array(conversationIds)}::text[])
    ORDER BY "conversationId", "createdAt" DESC
  `) as unknown as RawMessage[];

  const profiles = await participantProfiles(
    sql,
    conversations.flatMap((c) => c.participantIds),
  );

  const lastByConversation = new Map(lastMessages.map((m) => [m.conversationId, toMessage(m)]));
  return conversations.map((conversation) => ({
    ...conversation,
    participants: profiles.filter((p) => conversation.participantIds.includes(p.id)),
    messages: lastByConversation.has(conversation.id)
      ? [lastByConversation.get(conversation.id) as MessageRow]
      : [],
  }));
}

export async function getConversation(
  sql: SqlClient,
  conversationId: string,
  userId: string,
): Promise<ConversationView> {
  const rows = (await sql`
    SELECT id, "propertyId", "participantIds", "lastMessageAt", "createdAt", "updatedAt"
    FROM "Conversation"
    WHERE id = ${conversationId}
    LIMIT 1
  `) as unknown as RawConversation[];
  const raw = rows[0];
  if (!raw) throw new MessagingError(404, 'Conversation not found');
  const conversation = toConversation(raw);
  if (!isParticipant(conversation, userId)) {
    throw new MessagingError(403, 'Not a participant');
  }
  return hydrateConversation(sql, conversation);
}

async function hydrateConversation(
  sql: SqlClient,
  conversation: ConversationRow,
): Promise<ConversationView> {
  const [profiles, messageRows] = await Promise.all([
    participantProfiles(sql, conversation.participantIds),
    sql`
      SELECT id, "conversationId", "senderId", content, type, "mediaUrl", "readAt", "createdAt"
      FROM "Message"
      WHERE "conversationId" = ${conversation.id}
      ORDER BY "createdAt" ASC
    ` as unknown as Promise<RawMessage[]>,
  ]);

  const byId = new Map(profiles.map((p) => [p.id, p]));
  return {
    ...conversation,
    participants: profiles,
    messages: messageRows.map((m) => ({ ...toMessage(m), sender: byId.get(m.senderId) ?? null })),
  };
}

export async function createConversation(
  sql: SqlClient,
  requestedParticipantIds: string[],
  propertyId: string | undefined,
  creatorId: string,
): Promise<ConversationView> {
  const ids = uniqueIds([...requestedParticipantIds, creatorId]);
  if (ids.length < 2) {
    throw new MessagingError(400, 'Select at least one other participant to message.');
  }

  const known = (await sql`
    SELECT id FROM "User" WHERE id = ANY(${sql.array(ids)}::text[])
  `) as unknown as Array<{ id: string }>;
  const missing = ids.filter((id) => !known.some((k) => k.id === id));
  if (missing.length > 0) {
    throw new MessagingError(404, `User not found: ${missing[0]}`);
  }

  const candidates = (await sql`
    SELECT id, "propertyId", "participantIds", "lastMessageAt", "createdAt", "updatedAt"
    FROM "Conversation"
    WHERE "participantIds" @> ${sql.array(ids)}::text[]
    ORDER BY COALESCE("lastMessageAt", "createdAt") DESC
  `) as unknown as RawConversation[];

  const existing = candidates
    .map(toConversation)
    .find(
      (c) =>
        c.participantIds.length === ids.length &&
        ids.every((id) => c.participantIds.includes(id)) &&
        (c.propertyId ?? null) === (propertyId ?? null),
    );
  if (existing) return hydrateConversation(sql, existing);

  const inserted = (await sql`
    INSERT INTO "Conversation" (id, "propertyId", "participantIds", "lastMessageAt", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${propertyId ?? null}, ${sql.array(ids)}::text[], NULL, now(), now())
    RETURNING id, "propertyId", "participantIds", "lastMessageAt", "createdAt", "updatedAt"
  `) as unknown as RawConversation[];

  const row = inserted[0];
  if (!row) throw new MessagingError(500, 'Failed to create conversation');
  return hydrateConversation(sql, toConversation(row));
}

export async function listMessages(
  sql: SqlClient,
  conversationId: string,
  userId: string,
): Promise<MessageRow[]> {
  await assertParticipant(sql, conversationId, userId);
  const rows = (await sql`
    SELECT id, "conversationId", "senderId", content, type, "mediaUrl", "readAt", "createdAt"
    FROM "Message"
    WHERE "conversationId" = ${conversationId}
    ORDER BY "createdAt" ASC
  `) as unknown as RawMessage[];
  const profiles = await participantProfiles(sql, rows.map((m) => m.senderId));
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return rows.map((m) => ({ ...toMessage(m), sender: byId.get(m.senderId) ?? null }));
}

export async function sendMessage(
  sql: SqlClient,
  conversationId: string,
  senderId: string,
  content: string,
  type = 'text',
  mediaUrl?: string,
): Promise<MessageRow> {
  await assertParticipant(sql, conversationId, senderId);

  const inserted = (await sql`
    INSERT INTO "Message" (id, "conversationId", "senderId", content, type, "mediaUrl", "readAt", "createdAt")
    VALUES (${randomUUID()}, ${conversationId}, ${senderId}, ${content}, ${type}, ${mediaUrl ?? null}, NULL, now())
    RETURNING id, "conversationId", "senderId", content, type, "mediaUrl", "readAt", "createdAt"
  `) as unknown as RawMessage[];
  const row = inserted[0];
  if (!row) throw new MessagingError(500, 'Failed to send message');

  await sql`
    UPDATE "Conversation"
    SET "lastMessageAt" = now(), "updatedAt" = now()
    WHERE id = ${conversationId}
  `;

  const sender = (await sql`
    SELECT id, "firstName", "lastName", role, avatar
    FROM "User"
    WHERE id = ${senderId}
    LIMIT 1
  `) as unknown as ParticipantRow[];

  return { ...toMessage(row), sender: sender[0] ?? null };
}

export async function markRead(
  sql: SqlClient,
  conversationId: string,
  userId: string,
): Promise<{ ok: true; updated: number }> {
  await assertParticipant(sql, conversationId, userId);
  const rows = (await sql`
    UPDATE "Message"
    SET "readAt" = now()
    WHERE "conversationId" = ${conversationId}
      AND "senderId" <> ${userId}
      AND "readAt" IS NULL
    RETURNING id
  `) as unknown as Array<{ id: string }>;
  return { ok: true, updated: rows.length };
}

export async function countUnread(sql: SqlClient, userId: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS value
    FROM "Message" m
    JOIN "Conversation" c ON c.id = m."conversationId"
    WHERE c."participantIds" @> ARRAY[${userId}]::text[]
      AND m."senderId" <> ${userId}
      AND m."readAt" IS NULL
  `) as unknown as Array<{ value: number }>;
  return Number(rows[0]?.value ?? 0);
}

async function assertParticipant(
  sql: SqlClient,
  conversationId: string,
  userId: string,
): Promise<void> {
  const rows = (await sql`
    SELECT "participantIds" FROM "Conversation" WHERE id = ${conversationId} LIMIT 1
  `) as unknown as Array<{ participantIds: string[] | null }>;
  const row = rows[0];
  if (!row) throw new MessagingError(404, 'Conversation not found');
  if (!Array.isArray(row.participantIds) || !row.participantIds.includes(userId)) {
    throw new MessagingError(403, 'Not a participant');
  }
}
