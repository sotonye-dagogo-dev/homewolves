'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiBase } from '@/lib/api-base';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verified: boolean;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
  isLoading: boolean;
  error: string | null;

  register: (email: string) => Promise<{ otp: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  completeProfile: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role?: string;
    referralCode?: string;
  }) => Promise<void>;
  login: (email: string) => Promise<{ otp: string }>;
  exchangeSupabase: (accessToken: string, opts?: { referralCode?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      isLoading: false,
      error: null,

      register: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message ?? 'Registration failed');
          }
          const data = await res.json();
          return data;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message ?? 'Verification failed');
          }
          const data = await res.json();
          set({
            accessToken: data.accessToken,
            user: data.user,
          });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      completeProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/complete-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message ?? 'Profile completion failed');
          }
          const result = await res.json();
          set({
            accessToken: result.accessToken,
            user: result.user,
          });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message ?? 'Login failed');
          }
          const data = await res.json();
          return data;
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      exchangeSupabase: async (accessToken, opts) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/supabase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken, ...opts }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message ?? 'OAuth sign-in failed');
          }
          const data = await res.json();
          set({
            accessToken: data.accessToken,
            user: data.user,
          });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const { accessToken } = get();
        try {
          await fetch(`${getApiBase()}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } catch {
          // Ignore network errors on logout
        }
        set({ user: null, accessToken: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'hw-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (_state, error) => {
        if (!error) {
          useAuth.setState({ hydrated: true });
        }
      },
      // Skip hydration on server — prevents SSR mismatch and avoids localStorage access
      skipHydration: false,
    },
  ),
);

// Client-only hydration flag — handles SSR where persist is unavailable
// and ensures hasHydrated() synchronous case is covered without throwing during prerender
if (typeof window !== 'undefined') {
  // Zustand persist may already be hydrated synchronously (e.g. localStorage available)
  // Guard with optional chaining so server-side prerender (persist is undefined) never throws
  const persist = (useAuth as unknown as { persist?: { hasHydrated: () => boolean; onFinishHydration: (cb: () => void) => void } }).persist;
  if (persist?.hasHydrated()) {
    useAuth.setState({ hydrated: true });
  } else {
    persist?.onFinishHydration(() => useAuth.setState({ hydrated: true }));
  }
}
