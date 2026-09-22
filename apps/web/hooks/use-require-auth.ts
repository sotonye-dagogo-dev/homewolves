'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/shared/Toast';

/**
 * Hook that gates actions behind authentication.
 * Returns a `requireAuth` function that:
 * - Returns `true` if the user is authenticated
 * - Shows a toast with CTA to sign in if not, returns `false`
 */
export function useRequireAuth(redirectPath?: string) {
  const { accessToken } = useAuth();
  const toast = useToast();

  const requireAuth = useCallback(
    (actionDescription?: string): boolean => {
      if (accessToken) return true;

      const message = actionDescription
        ? `${actionDescription} requires an account`
        : 'Sign in to continue';

      toast.info(message, { label: 'Sign in', href: redirectPath ? `/auth?redirect=${encodeURIComponent(redirectPath)}` : '/auth' });
      return false;
    },
    [accessToken, toast, redirectPath],
  );

  return { requireAuth, isAuthenticated: !!accessToken };
}
