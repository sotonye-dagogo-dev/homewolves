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

import { fetchConversations, fetchMessages, fetchMessagingDirectory } from './messaging';

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

describe('fetchMessagingDirectory', () => {
  beforeEach(() => {
    getApiBase.mockClear();
    vi.unstubAllGlobals();
  });

  it('queries the directory endpoint without params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes([{ id: 'agent-1' }]));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchMessagingDirectory()).resolves.toEqual([{ id: 'agent-1' }]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api.test/v1/messaging/directory');
  });

  it('passes search/role/take and normalizes envelopes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ items: [{ id: 'u1' }] }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      fetchMessagingDirectory({ search: 'Ada', role: 'AGENT', take: 25 }),
    ).resolves.toEqual([{ id: 'u1' }]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://api.test/v1/messaging/directory?search=Ada&role=AGENT&take=25',
    );
  });

  it('returns [] for malformed bodies instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(null)));
    await expect(fetchMessagingDirectory()).resolves.toEqual([]);
  });
});
