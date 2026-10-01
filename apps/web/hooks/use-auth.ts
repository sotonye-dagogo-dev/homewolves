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
  registerWithPassword: (input: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: string; referralCode?: string }) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ resetToken?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
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
  exchangeGoogle: (credential: string, opts?: { referralCode?: string; role?: string }) => Promise<void>;
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
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 409) throw new Error('This email already has an account. Try signing in instead.');
            throw new Error(data.message ?? 'Could not send a code. Please try again.');
          }
          return data;
        } catch (e: any) {
          const msg = e?.message === 'Failed to fetch'
            ? 'Could not reach the server. Check your connection and try again.'
            : (e.message ?? 'Could not send a code. Please try again.');
          set({ error: msg, isLoading: false });
          throw new Error(msg);
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
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 401) throw new Error('That code is incorrect or expired. Check your email and try again.');
            throw new Error(data.message ?? 'Could not verify that code. Please try again.');
          }
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

      registerWithPassword: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/register-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message ?? 'Could not create your account. Please try again.');
          set({ accessToken: data.accessToken ?? null, user: data.user ?? null });
        } catch (e: any) {
          const msg = e?.message === 'Failed to fetch'
            ? 'Could not reach the server. Check your connection and try again.'
            : (e.message ?? 'Could not create your account. Please try again.');
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithPassword: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/login-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message ?? 'Email or password is incorrect.');
          set({ accessToken: data.accessToken ?? null, user: data.user ?? null });
        } catch (e: any) {
          const msg = e?.message === 'Failed to fetch'
            ? 'Could not reach the server. Check your connection and try again.'
            : (e.message ?? 'Email or password is incorrect.');
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      requestPasswordReset: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message ?? 'Could not send the reset link. Please try again.');
          return data;
        } catch (e: any) {
          const msg = e?.message ?? 'Could not send the reset link. Please try again.';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message ?? 'That reset link is invalid or expired.');
          set({ accessToken: data.accessToken ?? null, user: data.user ?? null });
        } catch (e: any) {
          const msg = e?.message ?? 'That reset link is invalid or expired.';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      resendVerification: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message ?? 'Could not resend the code. Please try again.');
          return;
        } catch (e: any) {
          const msg = e?.message ?? 'Could not resend the code. Please try again.';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      completeProfile: async (profile) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/complete-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
          });
          const result = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(result.message ?? 'Could not save your profile. Please try again.');
          }
          set({
            accessToken: result.accessToken ?? null,
            user: result.user ?? null,
          });
        } catch (e: any) {
          const msg = e?.message === 'Failed to fetch'
            ? 'Could not reach the server. Check your connection and try again.'
            : (e.message ?? 'Could not save your profile. Please try again.');
          set({ error: msg, isLoading: false });
          throw new Error(msg);
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

      exchangeGoogle: async (credential, opts) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${getApiBase()}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential, ...opts }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message ?? 'Google sign-in failed');
          }
          const data = await res.json();
          set({ accessToken: data.accessToken, user: data.user });
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
        // Always mark hydration complete — an error (corrupted storage, disabled
        // localStorage, etc.) must never leave consumers stuck on a loading gate.
        void error;
        useAuth.setState({ hydrated: true });
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
