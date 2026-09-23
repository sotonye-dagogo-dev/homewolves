'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRecentViews, useSavedListings } from '@/hooks/use-interactions';
import { useNotifications } from '@/hooks/use-notifications';
import { useMyTransactions } from '@/hooks/use-transactions';
import { useTransactionDocuments } from '@/hooks/use-documents';
import Link from 'next/link';

const TABS = [
  { id: 'transactions', label: 'Transactions', icon: '📄' },
  { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
  { id: 'recent', label: 'Recently Viewed', icon: '👁️' },
  { id: 'documents', label: 'Documents', icon: '📁' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ClientDashboardPage() {
  const { user, accessToken } = useAuth();
  const { data: recentViews, isLoading: recentLoading } = useRecentViews();
  const { data: savedData, isLoading: savedLoading } = useSavedListings();
  const { unreadCount } = useNotifications(user?.id, accessToken ?? undefined);
  const { data: txData, isLoading: txLoading } = useMyTransactions();
  const [activeTab, setActiveTab] = useState<TabId>('transactions');

  const savedListings = (Array.isArray(savedData) ? savedData : []).flatMap((col: any) => col?.listingIds ?? []);
  const recentList = Array.isArray(recentViews) ? recentViews : [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
          Client Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Welcome back, {user?.firstName ?? 'there'}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--color-brand-accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              border: activeTab === tab.id ? 'none' : '1px solid var(--color-border-default)',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'notifications' && unreadCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full" style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="space-y-4">
        {/* Transactions */}
        {activeTab === 'transactions' && (
          <div>
            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 skeleton rounded-xl" />
                ))}
              </div>
            ) : !txData || (Array.isArray(txData) ? txData : txData.transactions ?? []).length === 0 ? (
              <div className="p-8 text-center rounded-xl" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
                <div className="text-4xl mb-3">📄</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No transactions yet</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  When you start a transaction, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(txData) ? txData : Array.isArray(txData?.transactions) ? txData.transactions : []).map((tx: any) => (
                  <Link
                    key={tx.id}
                    href={`/dashboard/agent/transactions/${tx.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:translate-y-[-2px]"
                    style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="w-16 h-12 rounded-lg shrink-0 overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                      {tx.listing?.media?.[0]?.url && (
                        <img src={tx.listing.media[0].url} alt={tx.listing.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {tx.listing?.title ?? 'Transaction'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {tx.type} &middot; Step {tx.currentStep}/{(tx.stepsJson as any[])?.length ?? 5}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{
                      background: tx.status === 'COMPLETED' ? 'var(--color-success)' : tx.status === 'IN_PROGRESS' ? 'var(--color-warning)' : 'var(--color-border-default)',
                      color: 'var(--color-text-inverse)',
                    }}>
                      {tx.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            {savedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 skeleton rounded-xl" />
                ))}
              </div>
            ) : savedListings.length === 0 ? (
              <div className="p-8 text-center rounded-xl" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
                <div className="text-4xl mb-3">❤️</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Your wishlist is empty</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Save properties you love to come back to them later.
                </p>
                <Link
                  href="/properties"
                  className="inline-flex px-6 py-2 text-sm font-semibold rounded-full"
                  style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                >
                  Browse Properties
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedListings.map((listingId: string) => (
                  <Link
                    key={listingId}
                    href={`/properties/${listingId}`}
                    className="block p-4 rounded-xl transition-all hover:translate-y-[-2px]"
                    style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="aspect-[16/9] rounded-lg mb-3 skeleton" />
                    <div className="h-4 skeleton mb-2 w-3/4" />
                    <div className="h-3 skeleton w-1/2" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recently Viewed */}
        {activeTab === 'recent' && (
          <div>
            {recentLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 skeleton rounded-xl" />
                ))}
              </div>
            ) : recentList.length === 0 ? (
              <div className="p-8 text-center rounded-xl" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
                <div className="text-4xl mb-3">👁️</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No recently viewed properties</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Properties you view will show up here.
                </p>
                <Link
                  href="/properties"
                  className="inline-flex px-6 py-2 text-sm font-semibold rounded-full"
                  style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                >
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentList.map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/properties/${listing.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:translate-y-[-2px]"
                    style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="w-20 h-16 rounded-lg shrink-0 overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                      {listing.media?.[0] && (
                        <img src={listing.media[0].url} alt={listing.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {listing.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {(listing.locationJson as any)?.city ?? ''} {(listing.locationJson as any)?.state ?? ''}
                      </p>
                      <p className="text-sm font-display font-bold mt-1" style={{ color: 'var(--color-text-accent)' }}>
                        ₦{Number(listing.price).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <DocumentsVault transactions={Array.isArray(txData) ? txData : Array.isArray(txData?.transactions) ? txData.transactions : []} />
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="p-8 text-center rounded-xl" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No notifications'}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {unreadCount > 0 ? 'View and manage all your notifications.' : 'Stay tuned for updates on your properties and transactions.'}
            </p>
            <Link
              href="/dashboard/notifications"
              className="inline-flex px-6 py-2 text-sm font-semibold rounded-full"
              style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
            >
              View Notifications
            </Link>
          </div>
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
    (tx.documents ?? []).map((d: any) => ({ ...d, transaction: tx }))
  );

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
        <div className="text-4xl mb-3">📁</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No documents yet</h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Transaction documents and agreements will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedTx(null)}
          className="px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all"
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
            className="px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all"
            style={{
              background: selectedTx === tx.id ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
              color: selectedTx === tx.id ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
            }}
          >
            {tx.listing?.title?.slice(0, 20) ?? 'Tx'} ({(tx.documents ?? []).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border-glass)' }}>
        <table className="w-full text-sm" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)' }}>
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Size</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(selectedTx ? (isLoading ? [] : docs ?? []) : allDocs).map((doc: any) => (
              <tr key={doc.id} className="transition-all hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{doc.type === 'pdf' ? '📄' : doc.type === 'image' ? '🖼️' : '📎'}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{doc.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{doc.type}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '-'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full" style={{
                    background: doc.virusScanStatus === 'clean' ? 'var(--color-success-bg)' : doc.virusScanStatus === 'infected' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                    color: doc.virusScanStatus === 'clean' ? 'var(--color-success)' : doc.virusScanStatus === 'infected' ? 'var(--color-error)' : 'var(--color-warning)',
                  }}>
                    {doc.virusScanStatus === 'clean' ? '✓ Verified' : doc.virusScanStatus === 'infected' ? '✗ Flagged' : '⏳ Scanning'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
                      style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-secondary)' }}
                    >
                      Preview
                    </button>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
                      style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                    >
                      Download
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl p-6" style={{ background: 'var(--color-bg-elevated)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-2xl" style={{ color: 'var(--color-text-muted)' }}>×</button>
            </div>
            {previewDoc.type === 'image' || previewDoc.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewDoc.url} alt={previewDoc.name} className="w-full rounded-lg" />
            ) : previewDoc.type === 'pdf' || previewDoc.url?.match(/\.pdf$/i) ? (
              <iframe src={previewDoc.url} className="w-full h-[60vh] rounded-lg" title={previewDoc.name} />
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Preview not available for this file type.</p>
                <a href={previewDoc.url} target="_blank" rel="noreferrer" className="inline-block mt-4 px-6 py-2 text-sm font-semibold rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>Download File</a>
              </div>
            )}
            {previewDoc.signedUrl && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)' }}>
                <span style={{ color: 'var(--color-success)' }}>✓ Signed electronically</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
