'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BrandLogo } from '@/components/shared/brand-logo';

function parseFragment(url: string): URLSearchParams {
  const params = new URLSearchParams();
  try {
    const { hash, search } = new URL(url);
    for (const [k, v] of new URLSearchParams(hash.replace(/^#/, '')).entries()) params.set(k, v);
    for (const [k, v] of new URLSearchParams(search).entries()) params.set(k, v);
  } catch {
    /* ignore malformed URLs */
  }
  return params;
}

function readReferralCode(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('ref') ?? '').trim().toUpperCase().slice(0, 20);
}

function readRedirect(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') ?? '';
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const exchangeSupabase = useAuth((s) => s.exchangeSupabase);
  const [message, setMessage] = useState('Completing your sign-in...');

  useEffect(() => {
    const params = parseFragment(window.location.href);
    const urlError = params.get('error');
    const urlErrorDescription = params.get('error_description');
    const accessToken = params.get('access_token');
    const code = params.get('code');

    if (urlError) {
      setMessage(urlErrorDescription || urlError);
      return;
    }

    // PKCE/code flow returns ?code= with no fragment token — exchange it via
    // Supabase client when available, else surface a clear message.
    if (!accessToken && code) {
      setMessage('Completing your sign-in...');
      import('@/lib/supabase')
        .then(async ({ getSupabaseClient }) => {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error('no-supabase');
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error || !data.session?.access_token) throw error ?? new Error('no-session');
          const referralCode = readReferralCode();
          await exchangeSupabase(data.session.access_token, referralCode ? { referralCode } : undefined);
          router.replace(readRedirect());
        })
        .catch(() => {
          setMessage('We could not link your account. Please try again.');
        });
      return;
    }

    if (!accessToken) {
      setMessage('Sign-in could not be completed. Please try again.');
      return;
    }

    const referralCode = readReferralCode();
    exchangeSupabase(accessToken, referralCode ? { referralCode } : undefined)
      .then(() => {
        router.replace(readRedirect());
      })
      .catch(() => {
        setMessage('We could not link your Google account. Please try again.');
      });
  }, [exchangeSupabase, router]);

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="max-w-sm w-full p-8 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-glass)] shadow-glass text-center">
        <div className="flex justify-center mb-4">
          <BrandLogo size="lg" showName={false} />
        </div>
        <p className="text-foreground font-body text-base">{message}</p>
        {message !== 'Completing your sign-in...' && (
          <button onClick={() => router.replace('/auth')} className="btn-secondary w-full mt-6">
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}