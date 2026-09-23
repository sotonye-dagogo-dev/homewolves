import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/api-base', () => ({
  getApiBase: () => 'http://api.test/v1',
  backendOrigin: () => null,
}));

import { useAuth } from './use-auth';

describe('useAuth hydration', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ user: null, accessToken: null, hydrated: false, isLoading: false, error: null });
  });

  it('marks hydrated after rehydration completes', async () => {
    // Force a rehydrate cycle by calling persist.rehydrate if available
    const persist = (useAuth as unknown as { persist?: { rehydrate?: () => Promise<void>; hasHydrated?: () => boolean } }).persist;
    expect(persist).toBeTruthy();
    await persist?.rehydrate?.();
    expect(useAuth.getState().hydrated).toBe(true);
  });

  it('still marks hydrated when persisted storage is corrupted (error path)', async () => {
    localStorage.setItem('hw-auth', '{not-valid-json');
    const persist = (useAuth as unknown as { persist?: { rehydrate?: () => Promise<void> } }).persist;
    await persist?.rehydrate?.();
    // The onRehydrateStorage callback must set hydrated:true even when the
    // rehydrate callback receives an error — otherwise loading gates hang forever.
    expect(useAuth.getState().hydrated).toBe(true);
  });

  it('does not leave isLoading stuck true after a failed register', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Registration failed' }),
      }),
    );
    await expect(useAuth.getState().register('a@b.com')).rejects.toThrow('Registration failed');
    expect(useAuth.getState().isLoading).toBe(false);
    expect(useAuth.getState().error).toBe('Registration failed');
    vi.unstubAllGlobals();
  });

  it('hydrates accessToken and user from verifyOtp success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'tok-1',
          user: { id: 'u-1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'BUYER', verified: false },
        }),
      }),
    );
    await useAuth.getState().verifyOtp('a@b.com', '123456');
    expect(useAuth.getState().accessToken).toBe('tok-1');
    expect(useAuth.getState().user?.id).toBe('u-1');
    expect(useAuth.getState().isLoading).toBe(false);
    vi.unstubAllGlobals();
  });
});
