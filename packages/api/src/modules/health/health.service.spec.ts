import { describe, it, expect, vi } from 'vitest';
import { HealthService } from './health.service';

function createService(overrides: Record<string, unknown> = {}) {
  const db = { execute: vi.fn(async () => []), ...(overrides.db as object ?? {}) } as unknown as { execute: ReturnType<typeof vi.fn> };
  const paystack = { isConfigured: false, ...(overrides.paystack as object ?? {}) } as unknown as { isConfigured: boolean };
  const docuseal = { isConfigured: false, ...(overrides.docuseal as object ?? {}) } as unknown as { isConfigured: boolean };
  const sms = { isConfigured: false, ...(overrides.sms as object ?? {}) } as unknown as { isConfigured: boolean };
  const storage = { isConfigured: false, ...(overrides.storage as object ?? {}) } as unknown as { isConfigured: boolean };
  const email = { providerConfigured: false, ...(overrides.email as object ?? {}) } as unknown as { providerConfigured: boolean };
  const svc = new HealthService(
    db as never,
    paystack as never,
    docuseal as never,
    sms as never,
    storage as never,
    email as never,
  );
  return { svc, db };
}

describe('HealthService', () => {
  it('liveness returns ok', async () => {
    const { svc } = createService();
    const r = await svc.liveness();
    expect(r.status).toBe('ok');
    expect(r.timestamp).toBeDefined();
  });

  it('readiness returns ok when db succeeds', async () => {
    const { svc } = createService();
    const r = await svc.readiness();
    expect(r.services.database!.status).toBe('ok');
    expect(r.status).toBe('ok');
    expect(r.services.paystack!.configured).toBe(false);
  });

  it('readiness returns down when db throws', async () => {
    const { svc } = createService({ db: { execute: vi.fn(async () => { throw new Error('db down'); }) } });
    const r = await svc.readiness();
    expect(r.services.database!.status).toBe('down');
    expect(r.status).toBe('down');
  });

  it('reflects provider configured flags', async () => {
    const { svc } = createService({
      paystack: { isConfigured: true },
      email: { providerConfigured: true },
    });
    const r = await svc.readiness();
    expect(r.services.paystack!.configured).toBe(true);
    expect(r.services.email!.configured).toBe(true);
  });
});
