import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { StorageClient } from './storage.client';

vi.mock('cloudinary', () => {
  const upload = vi.fn();
  const destroy = vi.fn();
  const url = vi.fn((_id: string, _opts?: unknown) => `https://res.cloudinary.com/test/image/upload/${_id}`);
  return {
    v2: {
      config: vi.fn(),
      uploader: { upload, destroy },
      url,
    },
  };
});

const originalEnv = { ...process.env };

describe('StorageClient', () => {
  beforeEach(() => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_FOLDER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('isConfigured false when env missing', () => {
    const c = new StorageClient();
    expect(c.isConfigured).toBe(false);
  });

  it('isConfigured true when all env vars set', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'key123';
    process.env.CLOUDINARY_API_SECRET = 'secret456';
    const c = new StorageClient();
    expect(c.isConfigured).toBe(true);
  });

  it('upload simulated when unconfigured', async () => {
    const c = new StorageClient();
    const r = await c.upload({ key: 'test/file.jpg', body: 'hello' });
    expect(r.key).toBe('test/file.jpg');
    expect(r.url).toContain('test/file.jpg');
    expect(r.url).toContain('placeholder');
  });

  it('upload calls cloudinary.uploader.upload when configured', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'key123';
    process.env.CLOUDINARY_API_SECRET = 'secret456';
    process.env.CLOUDINARY_FOLDER = 'hw-assets';

    const { v2: cloudinary } = await import('cloudinary');
    (cloudinary.uploader.upload as ReturnType<typeof vi.fn>).mockImplementation(
      (_dataUrl: string, _opts: unknown, cb: (err: unknown, result: unknown) => void) => {
        cb(null, {
          public_id: 'hw-assets/listings/photo',
          secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/listings/photo.jpg',
        });
      },
    );

    const c = new StorageClient();
    const r = await c.upload({ key: 'listings/photo.jpg', body: Buffer.from('img'), contentType: 'image/jpeg' });

    expect(r.key).toBe('hw-assets/listings/photo');
    expect(r.url).toBe('https://res.cloudinary.com/test-cloud/image/upload/v1/listings/photo.jpg');
    expect(cloudinary.uploader.upload).toHaveBeenCalledOnce();
  });

  it('getPublicUrl returns deterministic URL when unconfigured', () => {
    const c = new StorageClient();
    expect(c.getPublicUrl('a/b.jpg')).toContain('a/b.jpg');
    expect(c.getPublicUrl('a/b.jpg')).toContain('placeholder');
  });

  it('getPublicUrl uses cloudinary.url when configured', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'key123';
    process.env.CLOUDINARY_API_SECRET = 'secret456';

    const { v2: cloudinary } = await import('cloudinary');
    (cloudinary.url as ReturnType<typeof vi.fn>).mockReturnValue('https://res.cloudinary.com/test-cloud/image/upload/homewolves/x/y.jpg');

    const c = new StorageClient();
    const result = c.getPublicUrl('x/y.jpg');
    expect(result).toBe('https://res.cloudinary.com/test-cloud/image/upload/homewolves/x/y.jpg');
    expect(cloudinary.url).toHaveBeenCalledWith('homewolves/x/y.jpg', { secure: true });
  });

  it('delete simulated when unconfigured does not throw', async () => {
    const c = new StorageClient();
    await expect(c.delete('some/key.jpg')).resolves.toBeUndefined();
  });

  it('delete calls cloudinary.uploader.destroy when configured', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'key123';
    process.env.CLOUDINARY_API_SECRET = 'secret456';

    const { v2: cloudinary } = await import('cloudinary');
    (cloudinary.uploader.destroy as ReturnType<typeof vi.fn>).mockResolvedValue({ result: 'ok' });

    const c = new StorageClient();
    await c.delete('listings/photo.jpg');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('homewolves/listings/photo.jpg');
  });

  it('getStatus reflects config', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'my-cloud';
    process.env.CLOUDINARY_API_KEY = 'k';
    process.env.CLOUDINARY_API_SECRET = 's';
    process.env.CLOUDINARY_FOLDER = 'assets';

    const c = new StorageClient();
    const status = c.getStatus();
    expect(status.configured).toBe(true);
    expect(status.cloudName).toBe('my-cloud');
    expect(status.folder).toBe('assets');
  });

  it('getStatus returns default folder when CLOUDINARY_FOLDER unset', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'c';
    process.env.CLOUDINARY_API_KEY = 'k';
    process.env.CLOUDINARY_API_SECRET = 's';

    const c = new StorageClient();
    expect(c.getStatus().folder).toBe('homewolves');
  });
});
