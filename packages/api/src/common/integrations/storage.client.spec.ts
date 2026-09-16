import { describe, it, expect, vi, afterEach } from 'vitest';
import { StorageClient } from './storage.client';

const originalEnv = { ...process.env };

describe('StorageClient', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('isConfigured false when env missing', () => {
    delete process.env.S3_ENDPOINT;
    delete process.env.R2_ENDPOINT;
    delete process.env.S3_BUCKET;
    delete process.env.R2_BUCKET;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    const c = new StorageClient();
    expect(c.isConfigured).toBe(false);
  });

  it('upload simulated when unconfigured', async () => {
    delete process.env.S3_ENDPOINT;
    delete process.env.R2_ENDPOINT;
    delete process.env.S3_BUCKET;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    const c = new StorageClient();
    const r = await c.upload({ key: 'test/file.jpg', body: 'hello' });
    expect(r.key).toBe('test/file.jpg');
    expect(r.url).toContain('test/file.jpg');
  });

  it('getPublicUrl returns deterministic URL', () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_BUCKET = 'my-bucket';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    const c = new StorageClient();
    expect(c.getPublicUrl('a/b.jpg')).toBe('https://s3.example.com/my-bucket/a/b.jpg');
  });

  it('delete simulated when unconfigured does not throw', async () => {
    delete process.env.S3_ENDPOINT;
    delete process.env.R2_ENDPOINT;
    const c = new StorageClient();
    await expect(c.delete('some/key.jpg')).resolves.toBeUndefined();
  });

  it('upload with config calls fetch', async () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_BUCKET = 'bkt';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    const fm = vi.fn(async () => new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fm);
    const c = new StorageClient();
    const r = await c.upload({ key: 'x/y.jpg', body: Buffer.from('hi') });
    expect(r.url).toContain('x/y.jpg');
    expect(fm).toHaveBeenCalledOnce();
  });

  it('getStatus reflects config', () => {
    process.env.S3_ENDPOINT = 'https://e.com';
    process.env.S3_BUCKET = 'b';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    const c = new StorageClient();
    expect(c.getStatus().configured).toBe(true);
  });
});
