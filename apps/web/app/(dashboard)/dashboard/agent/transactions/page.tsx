'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { useAgentTransactions, useCreateTransaction } from '@/hooks/use-transactions';
import { useListings } from '@/hooks/use-listings';
import { HwButton, HwInput, HwBadge, HwCard } from '@/components/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { emitToast, errorMessage } from '@/lib/toast';
import { formatCurrency, fullName, safeText, toArray } from '@/lib/format';
import { statusToneStyle } from '@/lib/status';

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Purchase',
  RENTAL: 'Rental',
  SHORTLET: 'Shortlet',
};

const STATUS_FILTERS = ['', 'INITIATED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

export default function AgentTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, isError, refetch } = useAgentTransactions(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const createTx = useCreateTransaction();
  const { data: listingsData } = useListings({ ownerId: 'self' });

  const transactions = toArray<any>(data?.transactions);
  const listings = toArray<any>(listingsData?.listings);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await createTx.mutateAsync({
        listingId: String(fd.get('listingId') ?? ''),
        buyerId: String(fd.get('buyerId') ?? '').trim(),
        type: fd.get('type') as 'PURCHASE' | 'RENTAL' | 'SHORTLET',
      });
      emitToast('Transaction created', 'success');
      setShowCreate(false);
    } catch (error) {
      emitToast(errorMessage(error, 'Could not create the transaction.'), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Transactions
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Manage deal lifecycles from inspection to completion
          </p>
        </div>
        <HwButton onClick={() => setShowCreate(true)} variant="primary">
          <Plus className="h-4 w-4" />
          New Transaction
        </HwButton>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {STATUS_FILTERS.map((s) => {
          const selected = statusFilter === s;
          return (
            <button
              key={s || 'all'}
              role="tab"
              aria-selected={selected}
              onClick={() => setStatusFilter(s)}
              className="rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{
                background: selected ? 'var(--color-brand-accent)' : 'var(--color-bg-elevated)',
                color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                border: `1px solid ${selected ? 'var(--color-brand-accent)' : 'var(--color-border-default)'}`,
              }}
            >
              {s ? s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'All'}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-28 rounded-xl"
              style={{ background: 'var(--color-bg-glass)' }}
            />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={FileText}
          title="Could not load transactions"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={statusFilter ? 'No transactions with this status' : 'No transactions yet'}
          description={
            statusFilter
              ? 'Try a different status filter.'
              : 'Create your first transaction to start the deal workflow.'
          }
          actionLabel={statusFilter ? 'Clear filter' : 'New Transaction'}
          onAction={() => (statusFilter ? setStatusFilter('') : setShowCreate(true))}
        />
      ) : (
        <div className="grid gap-4">
          {transactions.map((tx: any) => {
            const media = toArray<any>(tx.listing?.media)[0];
            const steps = toArray<any>(tx.stepsJson);
            return (
              <Link key={tx.id} href={`/dashboard/agent/transactions/${tx.id}`}>
                <HwCard className="cursor-pointer p-4 transition-colors hover:brightness-[0.98]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-4">
                      {media?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media.url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div
                          className="grid h-14 w-14 shrink-0 place-items-center rounded-lg"
                          style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-muted)' }}
                        >
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {safeText(tx.listing?.title, 'Untitled listing')}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Buyer: {fullName(tx.buyer?.firstName, tx.buyer?.lastName, 'Unknown')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {TYPE_LABELS[tx.type] ?? safeText(tx.type, 'Transaction')}
                          {tx.listing?.price ? ` · ${formatCurrency(tx.listing.price)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Step {Number(tx.currentStep ?? 0)}/{steps.length || 5}
                      </span>
                      <HwBadge style={statusToneStyle(tx.status)}>
                        {safeText(tx.status, 'UNKNOWN').replace(/_/g, ' ')}
                      </HwBadge>
                    </div>
                  </div>
                </HwCard>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
          role="dialog"
          aria-modal="true"
          aria-label="New transaction"
        >
          <HwCard
            className="w-full max-w-lg space-y-4 p-6"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              New Transaction
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Listing
                </label>
                <select
                  name="listingId"
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">Select listing</option>
                  {listings.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {safeText(l.title, l.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Buyer ID
                </label>
                <HwInput name="buyerId" required placeholder="Buyer user ID" />
              </div>
              <div>
                <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Type
                </label>
                <select
                  name="type"
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="PURCHASE">Purchase</option>
                  <option value="RENTAL">Rental</option>
                  <option value="SHORTLET">Shortlet</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <HwButton type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </HwButton>
                <HwButton type="submit" variant="primary" disabled={createTx.isPending}>
                  {createTx.isPending ? 'Creating…' : 'Create Transaction'}
                </HwButton>
              </div>
            </form>
          </HwCard>
        </div>
      )}
    </div>
  );
}
