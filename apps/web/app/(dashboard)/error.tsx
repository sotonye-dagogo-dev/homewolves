'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard] error boundary:', error);
  }, [error]);
  return (
    <div className="flex items-center justify-center p-6" style={{ minHeight: '60vh' }}>
      <div className="max-w-md w-full text-center rounded-xl p-6" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}>
        <div className="flex justify-center mb-4" style={{ color: 'var(--color-warning)' }}><TriangleAlert className="w-10 h-10" /></div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Dashboard error</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>This section failed to load. Try again or return home.</p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="px-5 py-2 rounded-full text-sm font-semibold" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>Retry</button>
          <Link href="/" className="px-5 py-2 rounded-full text-sm font-semibold" style={{ background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}>Go home</Link>
        </div>
      </div>
    </div>
  );
}
