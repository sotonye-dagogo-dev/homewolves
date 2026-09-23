import { describe, it, expect, vi, beforeEach } from 'vitest';

const getApiBase = vi.fn(() => 'http://api.test/v1');

vi.mock('@/lib/api-base', () => ({
  getApiBase: () => getApiBase(),
  backendOrigin: () => null,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: {
    getState: () => ({ accessToken: null }),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() })),
}));

import { fetchConversations, fetchMessages } from './messaging';

function jsonRes(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('messaging response normalization', () => {
  beforeEach(() => {
    getApiBase.mockClear();
    vi.unstubAllGlobals();
  });

  it('fetchConversations returns an array for a { conversations } envelope', async () => {
    const conversations = [{ id: 'c1' }, { id: 'c2' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ conversations })));
    await expect(fetchConversations()).resolves.toEqual(conversations);
  });

  it('fetchConversations returns an array for a bare array body', async () => {
    const conversations = [{ id: 'c1' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(conversations)));
    await expect(fetchConversations()).resolves.toEqual(conversations);
  });

  it('fetchConversations returns [] for null / object without arrays (never throws .filter)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(null)));
    await expect(fetchConversations()).resolves.toEqual([]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ unexpected: true })));
    await expect(fetchConversations()).resolves.toEqual([]);
  });

  it('fetchMessages normalizes { messages } and null alike', async () => {
    const messages = [{ id: 'm1' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ messages })));
    await expect(fetchMessages('c1')).resolves.toEqual(messages);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(null)));
    await expect(fetchMessages('c1')).resolves.toEqual([]);
  });

  it('propagates API errors as thrown Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ message: 'Boom' }, false, 500)));
    await expect(fetchConversations()).rejects.toThrow('Boom');
  });
});
