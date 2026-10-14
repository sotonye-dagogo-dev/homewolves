'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--color-bg-canvas)' }}>
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, color: 'var(--color-warning)', display: 'flex', justifyContent: 'center' }}><TriangleAlert width={48} height={48} strokeWidth={1.8} /></div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-primary)' }}>
              Fatal error
            </h1>
            <p style={{ fontSize: 14, marginBottom: 24, color: 'var(--color-text-secondary)' }}>
              The application failed to load. Please try again.
              {error?.digest ? ` (ref ${error.digest})` : ''}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--color-brand-accent)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Go home
            </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
