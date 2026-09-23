'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useClient, useClientNotes, useAddNote, useClientRatings, useAddRating, useInspections, useCreateInspection, useUpdateClient } from '@/hooks/use-crm';
import { useListings } from '@/hooks/use-listings';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#E8F7EE', color: '#1A7A4A', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#B45309', label: 'Pending' },
  documentation: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Documentation' },
  closed: { bg: '#F3E8FF', color: '#6B21A8', label: 'Closed' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: client, isLoading } = useClient(id);
  const { data: notes } = useClientNotes(id);
  const { data: ratings } = useClientRatings(id);
  const { data: inspections } = useInspections();
  const { data: listingsData } = useListings({ ownerId: user?.id ?? '', take: '100' });

  const addNote = useAddNote(id);
  const addRating = useAddRating(id);
  const createInspection = useCreateInspection();
  const updateClient = useUpdateClient(id);

  const [noteContent, setNoteContent] = useState('');
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [inspForm, setInspForm] = useState({ listingId: '', scheduledAt: '', notes: '' });
  const [activeTab, setActiveTab] = useState<'notes' | 'ratings' | 'inspections'>('notes');

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 skeleton rounded" />
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Client not found</p>
        <Link href="/dashboard/agent/clients" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--color-brand-accent)' }}>Back to clients</Link>
      </div>
    );
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    await addNote.mutateAsync(noteContent);
    setNoteContent('');
  };

  const handleAddRating = async () => {
    await addRating.mutateAsync({ score: ratingScore, review: ratingReview || undefined });
    setRatingReview('');
  };

  const handleScheduleInspection = async () => {
    if (!inspForm.listingId || !inspForm.scheduledAt) return;
    await createInspection.mutateAsync({
      clientId: id,
      listingId: inspForm.listingId,
      scheduledAt: inspForm.scheduledAt,
      notes: inspForm.notes || undefined,
    });
    setInspForm({ listingId: '', scheduledAt: '', notes: '' });
  };

  const averageRating = ratings && ratings.length > 0
    ? (ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length).toFixed(1)
    : '—';

  const clientInspections = (Array.isArray(inspections) ? inspections : []).filter((i: any) => i?.clientId === id);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/agent/clients"
        className="inline-flex items-center gap-1 text-sm font-semibold mb-4"
        style={{ color: 'var(--color-brand-accent)' }}
      >
        ← Back to clients
      </Link>

      {/* Client header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-full grid place-items-center text-lg font-bold shrink-0" style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-text-inverse)' }}>
          {client.buyer?.firstName?.[0]}{client.buyer?.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {client.buyer?.firstName} {client.buyer?.lastName}
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: statusConfig[client.status]?.bg ?? '#F3F4F6', color: statusConfig[client.status]?.color ?? '#6B7280' }}>
              {statusConfig[client.status]?.label ?? client.status}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{client.buyer?.email} · {client.buyer?.phone ?? 'No phone'}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>Avg Rating: <strong style={{ color: 'var(--color-text-accent)' }}>{averageRating}</strong></span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Notes: <strong>{notes?.length ?? 0}</strong></span>
            <span style={{ color: 'var(--color-text-secondary)' }}>Inspections: <strong>{clientInspections.length}</strong></span>
          </div>

          {/* Status changer */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Change status:</span>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => updateClient.mutate({ status: key })}
                className="text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  opacity: client.status === key ? 1 : 0.6,
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 pb-4 mb-5 overflow-x-auto scrollbar-none" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        {(['notes', 'ratings', 'inspections'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? 'var(--color-brand-accent)' : 'transparent',
              color: activeTab === tab ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
              border: activeTab === tab ? 'none' : '1px solid transparent',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── Notes Tab ─── */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex gap-2 mb-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 rounded-lg p-3 text-sm outline-none resize-none"
              style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteContent.trim() || addNote.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold self-end disabled:opacity-50"
              style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
            >
              {addNote.isPending ? '...' : 'Add'}
            </button>
          </div>

          <div className="space-y-3">
            {notes && notes.length > 0 ? notes.map((note: any) => (
              <div
                key={note.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                    {note.author?.firstName?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{note.content}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {note.author?.firstName} {note.author?.lastName} · {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No notes yet</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Ratings Tab ─── */}
      {activeTab === 'ratings' && (
        <div>
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Add Rating</h3>
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRatingScore(star)}
                className="w-8 h-8 rounded-full text-lg transition-transform hover:scale-110"
                style={{ color: star <= ratingScore ? 'var(--color-brand-accent)' : 'var(--color-border-strong)' }}
              >
                ★
              </button>
            ))}
            <span className="text-sm ml-2 font-semibold" style={{ color: 'var(--color-text-accent)' }}>{ratingScore}/5</span>
          </div>
          <textarea
            value={ratingReview}
            onChange={(e) => setRatingReview(e.target.value)}
            placeholder="Review (optional)..."
            rows={2}
            className="w-full rounded-lg p-3 text-sm outline-none resize-none mb-3"
            style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={handleAddRating}
            disabled={addRating.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            {addRating.isPending ? '...' : 'Submit Rating'}
          </button>
        </div>

          <div className="space-y-3">
            {ratings && ratings.length > 0 ? ratings.map((rating: any) => (
              <div
                key={rating.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                    {rating.author?.firstName?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {rating.author?.firstName} {rating.author?.lastName}
                      </span>
                      <span style={{ color: 'var(--color-brand-accent)' }}>
                        {'★'.repeat(rating.score)}{'☆'.repeat(5 - rating.score)}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{rating.score}/5</span>
                    </div>
                    {rating.review && (
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{rating.review}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{new Date(rating.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No ratings yet</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Inspections Tab ─── */}
      {activeTab === 'inspections' && (
        <div>
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Schedule Inspection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <select
                value={inspForm.listingId}
                onChange={(e) => setInspForm({ ...inspForm, listingId: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
              >
                <option value="">Select property</option>
                {listingsData?.listings?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={inspForm.scheduledAt}
                onChange={(e) => setInspForm({ ...inspForm, scheduledAt: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <textarea
              value={inspForm.notes}
              onChange={(e) => setInspForm({ ...inspForm, notes: e.target.value })}
              placeholder="Inspection notes (optional)..."
              rows={2}
              className="w-full rounded-lg p-3 text-sm outline-none resize-none mb-3"
              style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={handleScheduleInspection}
              disabled={!inspForm.listingId || !inspForm.scheduledAt || createInspection.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
            >
              {createInspection.isPending ? '...' : 'Schedule'}
            </button>
          </div>

          <div className="space-y-3">
            {clientInspections.length > 0 ? clientInspections.map((insp: any) => (
              <div
                key={insp.id}
                className="rounded-xl p-4"
                style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <Link href={`/properties/${insp.listingId}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                      {insp.listing?.title ?? 'Property'}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(insp.scheduledAt).toLocaleString()}
                    </p>
                    {insp.notes && <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{insp.notes}</p>}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ml-3" style={{
                    background: insp.status === 'completed' ? '#E8F7EE' : insp.status === 'ongoing' ? '#FEF3C7' : '#DBEAFE',
                    color: insp.status === 'completed' ? '#1A7A4A' : insp.status === 'ongoing' ? '#B45309' : '#1D4ED8',
                  }}>
                    {insp.status}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No inspections scheduled</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
