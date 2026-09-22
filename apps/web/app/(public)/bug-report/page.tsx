'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bug, Upload, X, Send } from 'lucide-react';
import { HwButton } from '@/components/ui';
import { useCreateBugReport } from '@/hooks/use-bug-reports';
import { useToast } from '@/components/shared/Toast';

const BUG_TYPES = [
  { value: 'BUG', label: 'Bug Report' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'UI_ISSUE', label: 'UI Issue' },
  { value: 'PERFORMANCE', label: 'Performance Issue' },
  { value: 'OTHER', label: 'Other' },
];

export default function BugReportPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const createBugReport = useCreateBugReport();

  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const canSubmit = type && description.trim().length >= 10 && !createBugReport.isPending;

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || screenshots.length >= 3) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (screenshots.length >= 3) break;
        const reader = new FileReader();
        const url = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        setScreenshots((prev) => [...prev, url].slice(0, 3));
      }
    } catch {
      toastError('Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await createBugReport.mutateAsync({ type, description, screenshots });
      success('Bug report submitted successfully');
      router.push('/dashboard/client');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to submit bug report');
    }
  };

  return (
    <main className="min-h-screen px-4 py-16 lg:px-10 bg-[var(--color-bg-base)]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-accent)]/10 grid place-items-center">
            <Bug className="w-5 h-5 text-[var(--color-brand-accent)]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              Support
            </p>
            <h1 className="font-display text-2xl font-bold text-[var(--color-brand-primary)]">
              Report a Bug
            </h1>
          </div>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          Found something wrong? Let us know and we&apos;ll fix it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="bug-type" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Bug Type *
            </label>
            <select
              id="bug-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)] focus:border-transparent min-h-[44px]"
              required
            >
              <option value="">Select a type...</option>
              {BUG_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={5}
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)] focus:border-transparent resize-none"
              required
              minLength={10}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {description.length}/5000 characters (min 10)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Screenshots (optional, max 3)
            </label>
            <div className="flex flex-wrap gap-3">
              {screenshots.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-border-default)]">
                  <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--color-error)] text-white grid place-items-center hover:opacity-80"
                    aria-label={`Remove screenshot ${i + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {screenshots.length < 3 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--color-border-default)] grid place-items-center cursor-pointer hover:border-[var(--color-brand-accent)] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-[var(--color-brand-accent)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-[var(--color-text-muted)]" />
                  )}
                </label>
              )}
            </div>
          </div>

          <HwButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            className="w-full"
          >
            {createBugReport.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Bug Report
              </span>
            )}
          </HwButton>
        </form>
      </div>
    </main>
  );
}
