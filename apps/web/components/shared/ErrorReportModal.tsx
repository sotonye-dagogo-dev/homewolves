'use client';

import { useState } from 'react';
import { X, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { HwButton } from '@/components/ui';
import { useCreateBugReport } from '@/hooks/use-bug-reports';
import { useToast } from '@/components/shared/Toast';

interface ErrorReportModalProps {
  open: boolean;
  onClose: () => void;
  errorMessage?: string;
  stackTrace?: string;
  componentName?: string;
  url?: string;
  digest?: string;
}

export function ErrorReportModal({
  open,
  onClose,
  errorMessage,
  stackTrace,
  componentName,
  url,
  digest,
}: ErrorReportModalProps) {
  const [notes, setNotes] = useState('');
  const [showStack, setShowStack] = useState(false);
  const createReport = useCreateBugReport();
  const toast = useToast();

  if (!open) return null;

  const description = [
    errorMessage ? `Error: ${errorMessage}` : '',
    componentName ? `Component: ${componentName}` : '',
    url ? `URL: ${url}` : '',
    digest ? `Digest: ${digest}` : '',
    notes ? `\nUser notes: ${notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  async function handleSubmit() {
    if (description.trim().length < 10) return;

    try {
      await createReport.mutateAsync({
        type: 'BUG',
        description: description.trim().slice(0, 5000),
        errorMessage: errorMessage?.slice(0, 2000),
        stackTrace: stackTrace?.slice(0, 10000),
        componentName: componentName?.slice(0, 200),
        url: url?.slice(0, 2000),
      });
      toast.success('Bug report submitted — thank you!');
      onClose();
      setNotes('');
    } catch {
      toast.error('Failed to submit report. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl p-6"
        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5" style={{ color: 'var(--color-brand-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Report this error
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5" style={{ color: 'var(--color-text-tertiary)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Help us fix this issue. The error details below will be included with your report.
        </p>

        {/* Error details */}
        <div className="space-y-3 mb-4">
          {errorMessage && (
            <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Error</p>
              <p className="text-sm font-mono break-all" style={{ color: 'var(--color-text-primary)' }}>{errorMessage}</p>
            </div>
          )}

          {componentName && (
            <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Component</p>
              <p className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>{componentName}</p>
            </div>
          )}

          {stackTrace && (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
              <button
                onClick={() => setShowStack(!showStack)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium"
                style={{ background: 'var(--color-bg-canvas)', color: 'var(--color-text-tertiary)' }}
              >
                Stack trace
                {showStack ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showStack && (
                <pre className="p-3 text-xs font-mono overflow-x-auto max-h-48" style={{ background: 'var(--color-bg-canvas)', color: 'var(--color-text-secondary)' }}>
                  {stackTrace}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* User notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Additional notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What were you doing when this happened?"
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]"
            style={{
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <HwButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </HwButton>
          <HwButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={createReport.isPending || description.trim().length < 10}
          >
            {createReport.isPending ? 'Submitting...' : 'Submit report'}
          </HwButton>
        </div>
      </div>
    </div>
  );
}
