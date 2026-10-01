'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAdSlots, useAdApplications } from '@/hooks/use-ads';
import { saveAdSlot, reviewAdApplication } from '@/lib/ads';

/**
 * Admin ad management: live banner slots (config-driven) + advertiser
 * applications submitted via /advertise. Slot edits persist when the config
 * service exposes write APIs and fall back to local preview otherwise.
 */
export default function AdminAdsPage() {
  const qc = useQueryClient();
  const { data: slots, isLoading: loadingSlots } = useAdSlots();
  const { data: applications, isLoading: loadingApps } = useAdApplications();
  const [editing, setEditing] = useState<Record<string, { title: string; subtitle: string; ctaLabel: string; ctaHref: string; active: boolean }>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const startEdit = (id: string, current: { title: string; subtitle: string; ctaLabel: string; ctaHref: string; active: boolean }) => {
    setEditing((e) => ({ ...e, [id]: { ...current } }));
  };

  const save = async (id: string) => {
    const draft = editing[id];
    if (!draft) return;
    setBusy(id);
    setError('');
    try {
      await saveAdSlot({ id, ...draft });
      qc.invalidateQueries({ queryKey: ['ads', 'slots'] });
      setEditing((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the ad slot.');
    } finally {
      setBusy('');
    }
  };

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(id);
    setError('');
    try {
      await reviewAdApplication(id, status);
      qc.invalidateQueries({ queryKey: ['ads', 'applications'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the application.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto min-w-0">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent mb-4 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> Admin dashboard
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-brand-primary)' }}>
            Ad Banner Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Homepage banner slots are config-driven (<code>config/ad_slots</code>). Edits apply platform-wide.
          </p>
        </div>
        <Link href="/advertise" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-accent min-h-[44px]">
          View application form <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium rounded-md px-3 py-2.5 my-4 border"
          style={{ color: 'var(--color-error)', backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error)' }}>
          {error}
        </p>
      )}

      <h2 className="font-display text-xl font-bold mt-8 mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Banner slots
      </h2>
      {loadingSlots ? (
        <div className="h-32 rounded-xl skeleton" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(slots ?? []).map((slot) => {
            const draft = editing[slot.id];
            return (
              <div key={slot.id} className="rounded-xl border p-5" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
                {draft ? (
                  <div className="space-y-3">
                    {(['title', 'subtitle', 'ctaLabel', 'ctaHref'] as const).map((field) => (
                      <label key={field} className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{field}</span>
                        <input
                          value={draft[field]}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [slot.id]: { ...draft, [field]: e.target.value } }))}
                          className="mt-1 w-full min-h-[44px] px-3 rounded-lg border text-sm"
                          style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                        />
                      </label>
                    ))}
                    <label className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [slot.id]: { ...draft, active: e.target.checked } }))}
                        className="w-4 h-4"
                      />
                      Active
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => save(slot.id)} disabled={busy === slot.id} className="px-5 py-2 text-sm font-semibold rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                        {busy === slot.id ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing((e) => { const n = { ...e }; delete n[slot.id]; return n; })} className="px-5 py-2 text-sm font-semibold rounded-full border" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{slot.title}</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{slot.subtitle}</p>
                        <p className="text-xs mt-2 font-mono break-all" style={{ color: 'var(--color-text-muted)' }}>{slot.ctaLabel} → {slot.ctaHref}</p>
                      </div>
                      <span className="shrink-0 inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full"
                        style={slot.active
                          ? { background: 'var(--color-success-bg)', color: 'var(--color-success)' }
                          : { background: 'var(--color-bg-base)', color: 'var(--color-text-muted)' }}>
                        {slot.active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <button
                      onClick={() => startEdit(slot.id, { title: slot.title, subtitle: slot.subtitle, ctaLabel: slot.ctaLabel, ctaHref: slot.ctaHref, active: slot.active })}
                      className="mt-4 px-5 py-2 text-sm font-semibold rounded-full border"
                      style={{ borderColor: 'var(--color-brand-primary)', color: 'var(--color-brand-primary)' }}
                    >
                      Edit slot
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="font-display text-xl font-bold mt-8 mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Advertiser applications ({applications?.length ?? 0})
      </h2>
      {loadingApps ? (
        <div className="h-24 rounded-xl skeleton" />
      ) : (applications ?? []).length === 0 ? (
        <p className="text-sm rounded-xl border p-5" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
          No applications yet. Share <Link href="/advertise" className="font-semibold underline">/advertise</Link> with prospective advertisers.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr>
                {['Name', 'Company', 'Email', 'Message', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(applications ?? []).map((app) => (
                <tr key={app.id} className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{app.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{app.company}</td>
                  <td className="px-4 py-3 break-all" style={{ color: 'var(--color-text-secondary)' }}>{app.email}</td>
                  <td className="px-4 py-3 max-w-[280px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{app.message}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{app.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => review(app.id, 'approved')} disabled={busy === app.id} className="px-3 py-1.5 text-xs font-semibold rounded-full" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                        Approve
                      </button>
                      <button onClick={() => review(app.id, 'rejected')} disabled={busy === app.id} className="px-3 py-1.5 text-xs font-semibold rounded-full" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
