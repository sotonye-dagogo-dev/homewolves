'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HwButton, HwBadge, HwCard } from '@/components/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { Image as ImageIcon, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { getApiBase } from '@/lib/api-base';
import { emitToast, errorMessage } from '@/lib/toast';
import { formatCurrency, fullName, safeText, toArray } from '@/lib/format';
import { statusToneStyle } from '@/lib/status';

function getApi() {
  return `${getApiBase()}/listings`;
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem('hw-auth');
  if (!raw) return {};
  try {
    const { state } = JSON.parse(raw);
    if (!state.accessToken) return {};
    return { Authorization: `Bearer ${state.accessToken}` };
  } catch {
    return {};
  }
}

async function fetchPending() {
  const r = await fetch(`${getApi()}/admin/pending`, { headers: authHeaders() });
  if (!r.ok) throw new Error('Could not load moderation queue');
  return r.json();
}

async function moderateListing(id: string, action: 'approve' | 'reject') {
  const r = await fetch(`${getApi()}/${id}/moderate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action }),
  });
  if (!r.ok) throw new Error('Could not moderate listing');
  return r.json();
}

export default function AdminModerationPage() {
  const qc = useQueryClient();
  const { data: listings, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-moderation'],
    queryFn: fetchPending,
    retry: 1,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      moderateListing(id, action),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pending-moderation'] });
      qc.invalidateQueries({ queryKey: ['admin-summary'] });
      emitToast(variables.action === 'approve' ? 'Listing approved' : 'Listing rejected', 'success');
    },
    onError: (error) => emitToast(errorMessage(error, 'Could not moderate the listing.'), 'error'),
  });

  const pendings = toArray<any>(listings);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Moderation Queue
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Review and approve or reject pending listings
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={ShieldCheck}
          title="Could not load the moderation queue"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : pendings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="All caught up!"
          description="No listings are pending moderation right now."
        />
      ) : (
        <div className="space-y-4">
          {pendings.map((listing: any) => {
            const image = toArray<any>(listing.media)[0];
            return (
              <HwCard key={listing.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.url} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div
                      className="grid h-20 w-24 shrink-0 place-items-center rounded-lg"
                      style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-muted)' }}
                    >
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/properties/${listing.id}`}
                        className="truncate font-medium hover:underline"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {safeText(listing.title, 'Untitled listing')}
                      </Link>
                      <HwBadge style={statusToneStyle('PENDING')}>PENDING</HwBadge>
                    </div>
                    <p className="line-clamp-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {safeText(listing.description, 'No description provided.')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{formatCurrency(listing.price)}</span>
                      <span>{safeText(listing.propertyType, 'Property')}</span>
                      <span>{safeText(listing.category, '')}</span>
                      <span>
                        by {fullName(listing.owner?.firstName, listing.owner?.lastName, 'Unknown')}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <HwButton
                      variant="primary"
                      style={{ background: 'var(--color-status-active)' }}
                      onClick={() => moderateMutation.mutate({ id: listing.id, action: 'approve' })}
                      disabled={moderateMutation.isPending}
                    >
                      Approve
                    </HwButton>
                    <HwButton
                      variant="ghost"
                      style={{ color: 'var(--color-status-rejected)' }}
                      onClick={() => moderateMutation.mutate({ id: listing.id, action: 'reject' })}
                      disabled={moderateMutation.isPending}
                    >
                      Reject
                    </HwButton>
                  </div>
                </div>
              </HwCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
