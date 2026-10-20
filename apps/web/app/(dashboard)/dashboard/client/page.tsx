'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  Clock,
  Download,
  Eye,
  FileText,
  Folder,
  Heart,
  Loader2,
  ReceiptText,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRecentViews, useSavedListings } from '@/hooks/use-interactions';
import { useNotifications } from '@/hooks/use-notifications';
import { useMyTransactions } from '@/hooks/use-transactions';
import { useTransactionDocuments } from '@/hooks/use-documents';
import { EmptyState } from '@/components/shared/empty-state';
import {
  formatCurrency,
  formatDate,
  formatFileSize,
  safeText,
  toArray,
} from '@/lib/format';
import { statusToneStyle } from '@/lib/status';

const TABS = [
  { id: 'transactions', label: 'Transactions', Icon: ReceiptText },
  { id: 'wishlist', label: 'Wishlist', Icon: Heart },
  { id: 'recent', label: 'Recently Viewed', Icon: Eye },
  { id: 'documents', label: 'Documents', Icon: Folder },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ClientDashboardPage() {
  const { user, accessToken } = useAuth();
  const { data: recentViews, isLoading: recentLoading } = useRecentViews();
  const { data: savedData, isLoading: savedLoading } = useSavedListings();
  const { unreadCount } = useNotifications(user?.id, accessToken ?? undefined);
  const { data: txData, isLoading: txLoading } = useMyTransactions();
  const [activeTab, setActiveTab] = useState<TabId>('transactions');

  const savedListings = (Array.isArray(savedData) ? savedData : []).flatMap((col: any) =>
    toArray<any>(col?.listings),
  );
  const recentList = toArray<any>(recentViews);
  const transactions = Array.isArray(txData)
    ? txData
    : toArray<any>(txData?.transactions);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold md:text-2xl" style={{ color: 'var(--color-text-primary)' }}>
          Client Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Welcome back, {safeText(user?.firstName, 'there')}
        </p>
      </div>

      <div
        className="mb-6 flex gap-1 overflow-x-auto border-b pb-2"
        style={{ borderColor: 'var(--color-border-subtle)', scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Dashboard sections"
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: selected ? 'var(--color-brand-accent)' : 'transparent',
                color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                border: selected ? 'none' : '1px solid var(--color-border-default)',
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: selected ? 'rgba(255,255,255,0.3)' : 'var(--color-brand-accent)',
                    color: 'var(--color-text-inverse)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {activeTab === 'transactions' && (
          <div>
            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No transactions yet"
                description="When you start a transaction, it will appear here with its progress."
                actionLabel="Browse properties"
                actionHref="/properties"
              />
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: any) => (
                  <Link
                    key={tx.id}
                    href={`/dashboard/agent/transactions/${tx.id}`}
                    className="flex items-center gap-4 rounded-xl p-4 transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'var(--color-bg-glass)',
                      border: '1px solid var(--color-border-glass)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div
                      className="h-12 w-16 shrink-0 overflow-hidden rounded-lg"
                      style={{ background: 'var(--color-border-subtle)' }}
                    >
                      {tx.listing?.media?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tx.listing.media[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {safeText(tx.listing?.title, 'Transaction')}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {safeText(tx.type, 'Transaction')} · Step {Number(tx.currentStep ?? 0)}/
                        {toArray(tx.stepsJson).length || 5}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={statusToneStyle(tx.status)}
                    >
                      {safeText(tx.status, 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            {savedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : savedListings.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Your wishlist is empty"
                description="Save properties you love to come back to them later."
                actionLabel="Browse properties"
                actionHref="/properties"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedListings.map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/properties/${listing.id}`}
                    className="block overflow-hidden rounded-xl transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'var(--color-bg-glass)',
                      border: '1px solid var(--color-border-glass)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div className="aspect-[16/9]" style={{ background: 'var(--color-border-subtle)' }}>
                      {listing.media?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.media[0].url}
                          alt={safeText(listing.title, 'Property')}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {safeText(listing.title, 'Property')}
                      </p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-accent)' }}>
                        {formatCurrency(listing.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div>
            {recentLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : recentList.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="No recently viewed properties"
                description="Properties you view will show up here."
                actionLabel="Explore properties"
                actionHref="/properties"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {recentList.map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/properties/${listing.id}`}
                    className="flex items-center gap-4 rounded-xl p-4 transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'var(--color-bg-glass)',
                      border: '1px solid var(--color-border-glass)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div
                      className="h-16 w-20 shrink-0 overflow-hidden rounded-lg"
                      style={{ background: 'var(--color-border-subtle)' }}
                    >
                      {listing.media?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.media[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {safeText(listing.title, 'Property')}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {safeText(listing.locationJson?.city, '')} {safeText(listing.locationJson?.state, '')}
                      </p>
                      <p className="mt-1 font-display text-sm font-bold" style={{ color: 'var(--color-text-accent)' }}>
                        {formatCurrency(listing.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && <DocumentsVault transactions={transactions} />}

        {activeTab === 'notifications' && (
          <EmptyState
            icon={Bell}
            title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'No notifications'}
            description={
              unreadCount > 0
                ? 'View and manage all your notifications.'
                : 'Stay tuned for updates on your properties and transactions.'
            }
            actionLabel="View notifications"
            actionHref="/dashboard/notifications"
          />
        )}
      </div>
    </div>
  );
}

function DocumentsVault({ transactions }: { transactions: any[] }) {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const { data: docs, isLoading } = useTransactionDocuments(selectedTx ?? '');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const allDocs = transactions.flatMap((tx: any) =>
    toArray<any>(tx.documents).map((d: any) => ({ ...d, transaction: tx })),
  );

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No documents yet"
        description="Transaction documents and agreements will appear here."
      />
    );
  }

  const visibleDocs = selectedTx ? toArray<any>(docs) : allDocs;

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedTx(null)}
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            background: !selectedTx ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
            color: !selectedTx ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
          }}
        >
          All Documents ({allDocs.length})
        </button>
        {transactions.map((tx: any) => (
          <button
            key={tx.id}
            onClick={() => setSelectedTx(tx.id)}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: selectedTx === tx.id ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
              color: selectedTx === tx.id ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
            }}
          >
            {safeText(tx.listing?.title, 'Transaction').slice(0, 20)} (
            {toArray(tx.documents).length})
          </button>
        ))}
      </div>

      {selectedTx && isLoading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : visibleDocs.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No documents in this transaction"
          description="Documents will appear once they are uploaded."
          compact
        />
      ) : (
        <div
          className="overflow-x-auto rounded-xl border"
          style={{ borderColor: 'var(--color-border-glass)' }}
        >
          <table
            className="w-full text-sm"
            style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)' }}
          >
            <thead>
              <tr>
                {['Name', 'Type', 'Size', 'Status', 'Date', 'Action'].map((heading) => (
                  <th
                    key={heading}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${heading === 'Action' ? 'text-right' : 'text-left'}`}
                    style={{
                      color: 'var(--color-text-muted)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDocs.map((doc: any) => {
                const scan = safeText(doc.virusScanStatus, 'pending');
                return (
                  <tr key={doc.id} className="transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {safeText(doc.name, 'Document')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {safeText(doc.type, 'file')}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          background:
                            scan === 'clean'
                              ? 'var(--color-success-bg)'
                              : scan === 'infected'
                                ? 'var(--color-error-bg)'
                                : 'var(--color-warning-bg)',
                          color:
                            scan === 'clean'
                              ? 'var(--color-success)'
                              : scan === 'infected'
                                ? 'var(--color-error)'
                                : 'var(--color-warning)',
                        }}
                      >
                        {scan === 'clean' ? (
                          <Check className="h-3 w-3" />
                        ) : scan === 'infected' ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {scan === 'clean' ? 'Verified' : scan === 'infected' ? 'Flagged' : 'Scanning'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(doc.createdAt, '')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-secondary)' }}
                        >
                          Preview
                        </button>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                          style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {previewDoc && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Document preview"
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl p-6"
            style={{ background: 'var(--color-bg-elevated)' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {safeText(previewDoc.name, 'Document')}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                aria-label="Close preview"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {safeText(previewDoc.type, '').includes('image') ||
            safeText(previewDoc.url, '').match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewDoc.url} alt={safeText(previewDoc.name, 'Document')} className="w-full rounded-lg" />
            ) : safeText(previewDoc.type, '') === 'pdf' ||
              safeText(previewDoc.url, '').match(/\.pdf$/i) ? (
              <iframe
                src={previewDoc.url}
                className="h-[60vh] w-full rounded-lg"
                title={safeText(previewDoc.name, 'Document preview')}
              />
            ) : (
              <div className="p-8 text-center">
                <Clock className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Preview is not available for this file type.
                </p>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold"
                  style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                >
                  Download File
                </a>
              </div>
            )}
            {previewDoc.signedUrl && (
              <div
                className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2"
                style={{ background: 'var(--color-success-bg)' }}
              >
                <Check className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-success)' }}>Signed electronically</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
