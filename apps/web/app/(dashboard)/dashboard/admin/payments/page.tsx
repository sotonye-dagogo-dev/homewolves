'use client';
import { getApiBase } from '@/lib/api-base';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HwButton, HwBadge, HwCard } from '@/components/ui';
import { useState } from 'react';

function getApi() { return `${getApiBase()}/transactions`; }

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
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
}

async function confirmPaymentApi(paymentId: string, status: 'confirmed' | 'rejected') {
  const r = await fetch(`${getApi()}/payments/confirm`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ paymentId, status, confirmedBy: 'admin' }),
  });
  if (!r.ok) throw new Error('Failed to confirm');
  return r.json();
}

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: fetchPendingPayments,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ paymentId, status }: { paymentId: string; status: 'confirmed' | 'rejected' }) =>
      confirmPaymentApi(paymentId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
    },
  });

  const filtered = Array.isArray(payments)
    ? filter === 'all' ? payments : payments.filter((p: any) => p.status === filter)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Payment Review</h1>
        <p className="text-sm text-white/50 mt-1">Admin — confirm or reject payment evidence</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['pending', 'confirmed', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === s
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/50 hover:text-white/80 border border-transparent'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <HwCard className="p-12 text-center">
          <p className="text-white/50">No payments to review</p>
          <p className="text-sm text-white/30 mt-1">All caught up!</p>
        </HwCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((payment: any) => (
            <HwCard key={payment.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">
                      ${payment.transaction?.listing?.title ?? 'Unknown'} ({payment.transaction?.listing?.propertyType ?? ''})
                    </h3>
                    <HwBadge className={
                      payment.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                      payment.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }>{payment.status}</HwBadge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-white/40 text-xs">Amount</p>
                      <p className="text-white">{payment.currency} {Number(payment.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Type</p>
                      <p className="text-white capitalize">{payment.type}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Buyer</p>
                      <p className="text-white truncate">
                        {payment.transaction?.buyer?.firstName} {payment.transaction?.buyer?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Date</p>
                      <p className="text-white">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {payment.evidenceUrl && (
                    <a
                      href={payment.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm mt-2"
                      style={{ color: 'var(--color-brand-accent)' }}
                    >
                      📎 View Evidence &rarr;
                    </a>
                  )}
                </div>

                {payment.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <HwButton
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => confirmMutation.mutate({ paymentId: payment.id, status: 'confirmed' })}
                      disabled={confirmMutation.isPending}
                    >
                      Confirm
                    </HwButton>
                    <HwButton
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
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
