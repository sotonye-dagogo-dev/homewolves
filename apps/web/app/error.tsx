'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TriangleAlert, Bug } from 'lucide-react';
import { ErrorReportModal } from '@/components/shared/ErrorReportModal';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-canvas)' }}>
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4" style={{ color: 'var(--color-warning)' }}><TriangleAlert className="w-12 h-12" /></div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          >
            Go home
          </Link>
          <button
            onClick={() => setShowReport(true)}
            className="px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)' }}
          >
            <Bug className="w-3.5 h-3.5" />
            Report
          </button>
        </div>
      </div>

      <ErrorReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        errorMessage={error.message}
        stackTrace={error.stack}
        componentName="RootErrorBoundary"
        url={typeof window !== 'undefined' ? window.location.href : undefined}
        digest={error.digest}
      />
    </div>
  );
}
