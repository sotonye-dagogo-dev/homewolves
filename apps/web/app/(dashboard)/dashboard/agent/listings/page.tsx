'use client';

import { useListings, useDeleteListing } from '@/hooks/use-listings';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function AgentListingsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useListings({ ownerId: user?.id ?? '' });
  const deleteListing = useDeleteListing();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await deleteListing.mutateAsync(id);
    } catch (error) {
      void error;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">My Listings</h1>
          <p className="text-sm mt-0.5 text-[var(--color-text-tertiary)]">
            Manage your property listings
          </p>
        </div>
        <Link href="/dashboard/agent/listings/new" className="btn-primary text-sm">
          + New Listing
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse bg-[var(--color-bg-elevated)]">
              <div className="h-4 w-3/4 rounded mb-3 bg-[var(--color-bg-glass)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-bg-glass)]" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!data?.listings || data.listings.length === 0) && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-3 text-muted-foreground"><Home className="w-10 h-10" /></div>
          <p className="text-base font-medium text-[var(--color-text-secondary)]">
            No listings yet
          </p>
          <p className="text-sm mt-1 text-[var(--color-text-tertiary)]">
            Create your first listing to get started
          </p>
          <Link
            href="/dashboard/agent/listings/new"
            className="btn-primary inline-block mt-4 text-sm"
          >
            Create Listing
          </Link>
        </div>
      )}

      {data?.listings && data.listings.length > 0 && (
        <div className="space-y-3">
          {data.listings.map((listing: any) => (
            <div
              key={listing.id}
              className="rounded-xl p-4 md:p-5 transition-all bg-[var(--color-bg-elevated)]"
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg shrink-0 flex items-center justify-center bg-[var(--color-bg-glass)] overflow-hidden relative">
                  {listing.media?.[0]?.url ? (
                    <Image src={listing.media[0].url} alt="" fill className="object-cover rounded-lg" sizes="80px" />
                  ) : (
                    <Home className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/properties/${listing.id}`}
                        className="text-sm font-semibold hover:underline text-[var(--color-text-primary)]"
                      >
                        {listing.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            listing.status === 'ACTIVE'
                              ? 'bg-[rgba(34,197,94,0.15)] text-[var(--color-success)]'
                              : listing.status === 'DRAFT'
                                ? 'bg-[rgba(107,114,128,0.15)] text-[var(--color-text-tertiary)]'
                                : 'bg-[rgba(234,179,8,0.15)] text-[var(--color-warning,#ca8a04)]'
                          }`}
                        >
                          {listing.status}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {listing.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        {listing.currency} {parseFloat(listing.price).toLocaleString()}
                      </p>
                      <p className="text-xs mt-0.5 text-[var(--color-text-tertiary)]">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Link
                      href={`/dashboard/agent/listings/${listing.id}/edit`}
                      className="text-xs font-medium transition-colors text-[var(--color-brand-secondary)]"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="text-xs font-medium transition-colors text-[var(--color-danger)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
