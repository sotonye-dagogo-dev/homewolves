'use client';
import { getApiBase } from '@/lib/api-base';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HwButton, HwBadge, HwCard } from '@/components/ui';
import Link from 'next/link';

function getApi() { return `${getApiBase()}/listings`; }

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
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
}

async function moderateListing(id: string, action: 'approve' | 'reject') {
  const r = await fetch(`${getApi()}/${id}/moderate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action }),
  });
  if (!r.ok) throw new Error('Failed to moderate');
  return r.json();
}

export default function AdminModerationPage() {
  const qc = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ['pending-moderation'],
    queryFn: fetchPending,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => moderateListing(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-moderation'] });
    },
  });

  const pendings = Array.isArray(listings) ? listings : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Moderation Queue</h1>
        <p className="text-sm text-white/50 mt-1">Review and approve/reject pending listings</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : pendings.length === 0 ? (
        <HwCard className="p-12 text-center">
          <p className="text-white/50 text-lg">All caught up!</p>
          <p className="text-sm text-white/30 mt-1">No listings pending moderation</p>
        </HwCard>
      ) : (
        <div className="space-y-4">
          {pendings.map((listing: any) => (
            <HwCard key={listing.id} className="p-4">
              <div className="flex items-start gap-4">
                {listing.media?.[0]?.url ? (
                  <img src={listing.media[0].url} alt="" className="w-24 h-20 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-24 h-20 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-white/30 text-xs">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/properties/${listing.id}`} className="text-white font-medium hover:underline truncate">
                      {listing.title}
                    </Link>
                    <HwBadge className="bg-amber-500/10 text-amber-400 border-amber-500/30">PENDING</HwBadge>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    <span>₦{Number(listing.price).toLocaleString()}</span>
                    <span>{listing.propertyType}</span>
                    <span>{listing.category}</span>
                    <span>by {listing.owner?.firstName} {listing.owner?.lastName}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <HwButton
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => moderateMutation.mutate({ id: listing.id, action: 'approve' })}
                    disabled={moderateMutation.isPending}
                  >
                    Approve
                  </HwButton>
                  <HwButton
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => moderateMutation.mutate({ id: listing.id, action: 'reject' })}
                    disabled={moderateMutation.isPending}
                  >
                    Reject
                  </HwButton>
                </div>
              </div>
            </HwCard>
          ))}
        </div>
      )}
    </div>
  );
}
