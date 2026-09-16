import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmsClient } from './sms.client';

const originalEnv = { ...process.env };

describe('SmsClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('isConfigured is false when TERMII_API_KEY unset', () => {
    delete process.env.TERMII_API_KEY;
    const c = new SmsClient();
    expect(c.isConfigured).toBe(false);
  });

  it('isConfigured is true when key set', () => {
    process.env.TERMII_API_KEY = 'test-key';
    const c = new SmsClient();
    expect(c.isConfigured).toBe(true);
  });

  it('send returns simulated when unconfigured (no throw)', async () => {
    delete process.env.TERMII_API_KEY;
    const c = new SmsClient();
    const r = await c.send({ to: '+2348000000000', message: 'hello' });
    expect(r.status).toBe('simulated');
    expect(r.provider).toBe('simulated');
  });

  it('sendOtp delegates to send (simulated)', async () => {
    delete process.env.TERMII_API_KEY;
    const c = new SmsClient();
    const r = await c.sendOtp('+2348000000000', '123456');
    expect(r.status).toBe('simulated');
  });

  it('send with configured key calls fetch and returns sent', async () => {
    process.env.TERMII_API_KEY = 'k';
    process.env.TERMII_SENDER_ID = 'HW';
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ code: 'ok', message_id: 'mid-1' }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const c = new SmsClient();
    const r = await c.send({ to: '+2348000000000', message: 'hi' });
    expect(r.status).toBe('sent');
    expect(r.provider).toBe('termii');
    expect(r.messageId).toBe('mid-1');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('send throws BadGateway when provider returns non-ok', async () => {
    process.env.TERMII_API_KEY = 'k';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('error', { status: 500 })));
    const c = new SmsClient();
    await expect(c.send({ to: '+234', message: 'hi' })).rejects.toThrow();
  });
});
