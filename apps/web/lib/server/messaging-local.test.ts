import { describe, it, expect } from 'vitest';
import type { SqlClient } from './local-db';
import {
  MessagingError,
  countUnread,
  createConversation,
  getConversation,
  isParticipant,
  listDirectory,
  markRead,
  sendMessage,
} from './messaging-local';

type Handler = (query: string, values: unknown[]) => unknown;

function fakeSql(handler: Handler): SqlClient {
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
    Promise.resolve(handler(strings.join('?'), values))) as unknown as SqlClient;
  (sql as unknown as { array: (values: unknown[]) => unknown }).array = (values: unknown[]) => values;
  return sql;
}

describe('messaging-local', () => {
  it('isParticipant matches only listed ids', () => {
    expect(isParticipant({ participantIds: ['a', 'b'] }, 'a')).toBe(true);
    expect(isParticipant({ participantIds: ['a', 'b'] }, 'c')).toBe(false);
  });

  it('listDirectory excludes the caller and never selects phone/email', async () => {
    const captured: Array<{ query: string; values: unknown[] }> = [];
    const sql = fakeSql((query, values) => {
      captured.push({ query, values });
      return [
        { id: 'agent-1', firstName: 'Emeka', lastName: 'Okonkwo', role: 'AGENT', verified: true },
      ];
    });

    const rows = await listDirectory(sql, { excludeUserId: 'me', take: 50 });

    expect(rows).toHaveLength(1);
    expect(captured[0]?.query).not.toMatch(/email/i);
    expect(captured[0]?.query).not.toContain('phone');
    expect(captured[0]?.values).toContain('me');
  });

  it('createConversation rejects a single participant without touching SQL', async () => {
    const sql = fakeSql(() => {
      throw new Error('SQL should not run');
    });
    await expect(createConversation(sql, [], undefined, 'me')).rejects.toMatchObject({
      status: 400,
    });
  });

  it('getConversation returns 404 when the id does not exist', async () => {
    const sql = fakeSql(() => []);
    await expect(getConversation(sql, 'missing', 'me')).rejects.toBeInstanceOf(MessagingError);
    await expect(getConversation(sql, 'missing', 'me')).rejects.toMatchObject({ status: 404 });
  });

  it('getConversation forbids non-participants', async () => {
    const sql = fakeSql((query) => {
      if (query.includes('FROM "Conversation"')) {
        return [
          {
            id: 'c1',
            propertyId: null,
            participantIds: ['someone-else'],
            lastMessageAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }
      return [];
    });
    await expect(getConversation(sql, 'c1', 'me')).rejects.toMatchObject({ status: 403 });
  });

  it('markRead only marks the other participant messages and reports the count', async () => {
    const calls: Array<{ query: string; values: unknown[] }> = [];
    const sql = fakeSql((query, values) => {
      calls.push({ query, values });
      if (query.includes('SELECT "participantIds"')) return [{ participantIds: ['me', 'them'] }];
      if (query.includes('UPDATE "Message"')) return [{ id: 'm1' }, { id: 'm2' }];
      return [];
    });

    await expect(markRead(sql, 'c1', 'me')).resolves.toEqual({ ok: true, updated: 2 });
    expect(calls[1]?.values).toContain('me');
    expect(calls[1]?.query).toContain('readAt');
  });

  it('countUnread coerces the Postgres bigint-ish count to a number', async () => {
    const sql = fakeSql(() => [{ value: 3 }]);
    await expect(countUnread(sql, 'me')).resolves.toBe(3);
  });

  it('sendMessage verifies membership before inserting and returns the sender', async () => {
    const sql = fakeSql((query) => {
      if (query.includes('SELECT "participantIds"')) return [{ participantIds: ['me', 'them'] }];
      if (query.includes('INSERT INTO "Message"')) {
        return [
          {
            id: 'm1',
            conversationId: 'c1',
            senderId: 'me',
            content: 'hello',
            type: 'text',
            mediaUrl: null,
            readAt: null,
            createdAt: new Date(),
          },
        ];
      }
      if (query.includes('SELECT id, "firstName"')) {
        return [{ id: 'me', firstName: 'Ada', lastName: 'Obi', role: 'BUYER', avatar: null }];
      }
      return [];
    });

    const message = await sendMessage(sql, 'c1', 'me', 'hello');
    expect(message.id).toBe('m1');
    expect(message.sender?.firstName).toBe('Ada');
  });

  it('sendMessage rejects non-participants', async () => {
    const sql = fakeSql(() => [{ participantIds: ['them'] }]);
    await expect(sendMessage(sql, 'c1', 'me', 'hello')).rejects.toMatchObject({ status: 403 });
  });
});
