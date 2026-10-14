'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useListing, useUpdateListing } from '@/hooks/use-listings';
import { HwButton, HwInput } from '@/components/ui';

const STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD', 'RENTED', 'ARCHIVED'] as const;

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const updateListing = useUpdateListing(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (listing && !seeded) {
      setTitle((listing as { title?: string }).title ?? '');
      setDescription((listing as { description?: string }).description ?? '');
      setPrice(String((listing as { price?: unknown }).price ?? ''));
      setStatus((listing as { status?: string }).status ?? 'ACTIVE');
      setSeeded(true);
    }
  }, [listing, seeded]);

  const handleSave = async () => {
    try {
      await updateListing.mutateAsync({
        title,
        description,
        price: Number.parseFloat(price),
        status,
      } as Parameters<typeof updateListing.mutateAsync>[0]);
      window.dispatchEvent(new CustomEvent('hw-toast', { detail: { message: 'Listing updated', type: 'success' } }));
      router.push('/dashboard/agent/listings');
    } catch (e) {
      window.dispatchEvent(new CustomEvent('hw-toast', { detail: { message: e instanceof Error ? e.message : 'Could not update listing', type: 'error' } }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading listing…</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Listing not found</p>
        <button onClick={() => router.push('/dashboard/agent/listings')} className="btn-secondary mt-4">Back to listings</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
        ← Back
      </button>
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Listing</h1>
      <p className="text-sm mt-0.5 mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
        Update the core fields below. For full media/amenity edits, use the listing detail page.
      </p>
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Title</span>
          <HwInput value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="Listing title" aria-label="Title" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Description</span>
          <HwInput value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Description" aria-label="Description" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Price (NGN)</span>
          <HwInput value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="mt-1" placeholder="0" aria-label="Price" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
            style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-3 pt-2">
          <HwButton variant="primary" onClick={handleSave} disabled={updateListing.isPending}>
            {updateListing.isPending ? 'Saving…' : 'Save changes'}
          </HwButton>
          <HwButton variant="secondary" onClick={() => router.push('/dashboard/agent/listings')}>
            Cancel
          </HwButton>
        </div>
      </div>
    </div>
  );
}
