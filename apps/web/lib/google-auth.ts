import { getApiBase } from '@/lib/api-base';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: any) => void;
          renderButton: (el: HTMLElement, opts: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function loadGoogleScript(_clientId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (document.querySelector('script[data-google-gsi]')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.googleGsi = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google GSI'));
    document.head.appendChild(s);
  });
}

export async function exchangeGoogleCredential(credential: string, opts?: { referralCode?: string; role?: string }) {
  const res = await fetch(`${getApiBase()}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, ...opts }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Google sign-in failed');
  }
  return res.json() as Promise<{ accessToken: string; refreshToken: string; user: any }>;
}
