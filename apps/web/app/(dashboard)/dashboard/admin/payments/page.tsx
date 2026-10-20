'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HwButton, HwBadge, HwCard } from '@/components/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { CreditCard, Paperclip } from 'lucide-react';
import { useState } from 'react';
import { getApiBase } from '@/lib/api-base';
import { emitToast, errorMessage } from '@/lib/toast';
import { formatCurrency, formatDate, fullName, safeText, toArray } from '@/lib/format';
import { statusToneStyle } from '@/lib/status';

function getApi() {
  return `${getApiBase()}/transactions`;
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

async function fetchPendingPayments() {
  const r = await fetch(`${getApi()}/payments/pending`, { headers: authHeaders() });
  if (!r.ok) throw new Error('Could not load payments');
  return r.json();
}

async function confirmPaymentApi(paymentId: string, status: 'confirmed' | 'rejected') {
  const r = await fetch(`${getApi()}/payments/confirm`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ paymentId, status, confirmedBy: 'admin' }),
  });
  if (!r.ok) throw new Error('Could not update payment');
  return r.json();
}

const FILTERS = ['pending', 'confirmed', 'rejected', 'all'] as const;

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('pending');

  const { data: payments, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: fetchPendingPayments,
    retry: 1,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ paymentId, status }: { paymentId: string; status: 'confirmed' | 'rejected' }) =>
      confirmPaymentApi(paymentId, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-summary'] });
      emitToast(
        variables.status === 'confirmed' ? 'Payment confirmed' : 'Payment rejected',
        'success',
      );
    },
    onError: (error) => emitToast(errorMessage(error, 'Could not update the payment.'), 'error'),
  });

  const allPayments = toArray<any>(payments);
  const filtered =
    filter === 'all' ? allPayments : allPayments.filter((p: any) => p.status === filter);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Payment Review
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Confirm or reject payment evidence submitted by buyers
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter payments">
        {FILTERS.map((s) => {
          const selected = filter === s;
          return (
            <button
              key={s}
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(s)}
              className="rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{
                background: selected ? 'var(--color-brand-accent)' : 'var(--color-bg-elevated)',
                color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                border: `1px solid ${selected ? 'var(--color-brand-accent)' : 'var(--color-border-default)'}`,
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={CreditCard}
          title="Could not load payments"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={filter === 'pending' ? 'No payments to review' : `No ${filter} payments`}
          description={filter === 'pending' ? 'All caught up — new evidence will appear here.' : 'Try a different filter.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((payment: any) => (
            <HwCard key={payment.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {safeText(payment.transaction?.listing?.title, 'Unknown listing')}
                      {payment.transaction?.listing?.propertyType
                        ? ` (${payment.transaction.listing.propertyType})`
                        : ''}
                    </h3>
                    <HwBadge style={statusToneStyle(payment.status)}>
                      {safeText(payment.status, 'pending').replace(/_/g, ' ')}
                    </HwBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Amount</p>
                      <p style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Type</p>
                      <p className="capitalize" style={{ color: 'var(--color-text-primary)' }}>
                        {safeText(payment.type, 'Payment')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Buyer</p>
                      <p className="truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {fullName(payment.transaction?.buyer?.firstName, payment.transaction?.buyer?.lastName, 'Unknown')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Date</p>
                      <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>

                  {payment.evidenceUrl ? (
                    <a
                      href={payment.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm hover:underline"
                      style={{ color: 'var(--color-brand-accent)' }}
                    >
                      <Paperclip className="h-4 w-4" /> View evidence
                    </a>
                  ) : null}
                </div>

                {payment.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <HwButton
                      variant="primary"
                      style={{ background: 'var(--color-status-active)' }}
                      onClick={() => confirmMutation.mutate({ paymentId: payment.id, status: 'confirmed' })}
                      disabled={confirmMutation.isPending}
                    >
                      Confirm
                    </HwButton>
                    <HwButton
                      variant="ghost"
                      style={{ color: 'var(--color-status-rejected)' }}
                      onClick={() => confirmMutation.mutate({ paymentId: payment.id, status: 'rejected' })}
                      disabled={confirmMutation.isPending}
                    >
                      Reject
                    </HwButton>
                  </div>
                )}
              </div>
            </HwCard>
          ))}
        </div>
      )}
    </div>
  );
}
