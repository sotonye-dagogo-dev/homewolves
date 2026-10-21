'use client';

import { useAuth } from '@/hooks/use-auth';
import { useDashboardStats, useRecentClients } from '@/hooks/use-crm';
import { useListings } from '@/hooks/use-listings';
import { useInspections } from '@/hooks/use-crm';
import { useMyStats } from '@/hooks/use-activity';
import { useMyAnalytics } from '@/hooks/use-analytics';
import { useNotifications } from '@/hooks/use-notifications';
import { useAgentTransactions } from '@/hooks/use-transactions';
import Link from 'next/link';
import { Bell, Calendar, Link2, BarChart3, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/format-price';
import { formatCurrency, formatDate, safeText, toArray, toNumber } from '@/lib/format';
import { tierBadgeStyle } from '@/lib/status';
import { statusToneStyle } from '@/lib/status';

function emitToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hw-toast', { detail: { message, type } }));
  }
}

export default function AgentDashboardPage() {
  const { user, accessToken } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: analytics } = useMyAnalytics(90);
  const { notifications } = useNotifications(user?.id, accessToken ?? undefined);
  const { data: transactionsData } = useAgentTransactions({ limit: 50 });
  const { data: activityStats } = useMyStats();
  const { data: recentClients } = useRecentClients();
  const { data: listingsData } = useListings({ ownerId: user?.id ?? '', take: '5' }, { enabled: Boolean(user?.id) });
  const today = new Date().toISOString().split('T')[0];
  const { data: inspections } = useInspections(today);

  const eventCounts = (analytics?.events ?? {}) as Record<string, number>;
  const listingPerformance = toArray<any>(analytics?.listings).slice(0, 7);
  const maxPerformance = Math.max(
    1,
    ...listingPerformance.flatMap((l) => [toNumber(l.viewCount), toNumber(l.enquiryCount)]),
  );
  const agentTransactions = toArray<any>(transactionsData?.transactions);
  const confirmedPayments = agentTransactions
    .flatMap((tx) => toArray<any>(tx.payments))
    .filter((payment) => payment.status === 'confirmed');
  const confirmedTotal = confirmedPayments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0,
  );
  const funnel = [
    { label: 'Views', count: eventCounts.listing_view ?? 0 },
    { label: 'Enquiries', count: eventCounts.listing_enquiry ?? 0 },
    { label: 'Saved', count: eventCounts.listing_saved ?? 0 },
    { label: 'Started', count: eventCounts.transaction_started ?? 0 },
    { label: 'Closed', count: eventCounts.transaction_completed ?? 0 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Dashboard Header */}
      <header
        className="flex items-center justify-between p-4 md:p-0 md:pb-6 md:bg-transparent sticky top-0 z-50 md:static"
        style={{
          background: 'var(--color-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--color-border-glass)',
        }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Welcome back, {user?.firstName ?? 'Agent'}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/messages" className="grid h-10 w-10 place-items-center rounded-full" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-secondary)' }} aria-label="Messages">
            <Bell className="h-5 w-5" />
          </Link>
          <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
            {safeText(user?.firstName, '?').charAt(0)}{safeText(user?.lastName, '').charAt(0)}
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5 mt-6">
        {/* ─── Row 1: Active Clients (2x1) ─── */}
        <div className="lg:col-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Active Clients</span>
            <Link href="/dashboard/agent/clients" className="text-xs font-semibold" style={{ color: 'var(--color-brand-accent)' }}>View all</Link>
          </div>
          <div className="flex gap-5">
            <div className="flex-1">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stats?.activeClients ?? 0}</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>Active</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stats?.newThisMonth ?? 0}</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>New This Month</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stats?.pendingClients ?? 0}</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>Pending</div>
            </div>
          </div>
          {recentClients && recentClients.length > 0 && (
            <div className="mt-3 space-y-2">
              {recentClients.slice(0, 3).map((client: any) => (
                <div key={client.id} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0" style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-text-inverse)' }}>
                    {safeText(client.buyer?.firstName, '?').charAt(0)}{safeText(client.buyer?.lastName, '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {client.buyer?.firstName} {client.buyer?.lastName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {client.buyer?.email}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={statusToneStyle(client.status)}>
                    {safeText(client.status, 'active').replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Row 1: Today's Inspections (1x1) ─── */}
        <div className="lg:col-span-1 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Inspections</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>{stats?.todayInspections ?? 0} today</span>
          </div>
          <div className="space-y-3">
            {Array.isArray(inspections) && inspections.length > 0 ? inspections.slice(0, 3).map((insp: any) => (
              <div key={insp.id} className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 min-w-[48px] text-center" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-brand-accent)' }}>
                  {new Date(insp.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {insp.listing?.title ?? 'Property'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {insp.client?.buyer?.firstName} {insp.client?.buyer?.lastName}
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: insp.status === 'ongoing' ? 'var(--color-success)' : 'var(--color-warning)' }} />
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>No inspections today</p>
            )}
          </div>
          <Link href="/dashboard/agent/clients" className="w-full text-center py-2 text-xs font-semibold rounded-lg mt-2" style={{ color: 'var(--color-brand-accent)' }}>
            Schedule inspection
          </Link>
        </div>

        {/* ─── Row 1: Unread Messages (1x1) ─── */}
        <div className="lg:col-span-1 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Messages</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>{stats?.unreadMessages ?? 0}</span>
          </div>
          <Link href="/messages" className="block text-sm text-center py-8 font-semibold rounded-lg transition-colors" style={{ color: 'var(--color-brand-accent)' }}>
            {stats?.unreadMessages ? `${stats.unreadMessages} unread messages` : 'No unread messages'}
          </Link>
        </div>

        {/* ─── Row 1: Activity Points (1x1) ─── */}
        <div className="lg:col-span-1 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Activity Points</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase" style={tierBadgeStyle(activityStats?.tier)}>
              {activityStats?.tier ?? 'bronze'}
            </span>
          </div>
          <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>
            {activityStats?.totalPoints ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Total points earned</div>
          {activityStats?.recentActivity && activityStats.recentActivity.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {activityStats.recentActivity.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{a.ruleLabel}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-success)' }}>+{a.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Row 2: Listing Performance Chart (2x2) ─── */}
        <div className="lg:col-span-2 lg:row-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Listing Performance</span>
            <Link href="/dashboard/agent/listings" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-brand-accent)' }}>Full report</Link>
          </div>
          {listingPerformance.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Performance data will appear as your listings receive views.
            </div>
          ) : (
            <div className="flex items-end gap-2 h-[200px] pt-4">
              {listingPerformance.map((listing, index) => {
                const views = toNumber(listing.viewCount);
                const enquiries = toNumber(listing.enquiryCount);
                return (
                  <div key={listing.id ?? index} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full max-w-[40px] rounded-t-sm transition-all duration-500" title={`${views} views`} style={{ height: `${Math.max((views / maxPerformance) * 100, views > 0 ? 4 : 1)}%`, background: 'var(--color-brand-primary)', opacity: 0.6 }} />
                    <div className="w-full max-w-[40px] rounded-t-sm transition-all duration-500" title={`${enquiries} enquiries`} style={{ height: `${Math.max((enquiries / maxPerformance) * 100, enquiries > 0 ? 4 : 1)}%`, background: 'var(--color-brand-accent)', opacity: 0.8 }} />
                    <span className="text-[9px] text-center line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                      {safeText(listing.title, `#${index + 1}`).slice(0, 8)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-5 justify-center pt-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-brand-primary)', opacity: 0.6 }} />
              Views
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-brand-accent)' }} />
              Inquiries
            </div>
          </div>
        </div>

        {/* ─── Row 2: Recent Activity (2x2) ─── */}
        <div className="lg:col-span-2 lg:row-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Recent Activity</span>
            <Link href="/dashboard/notifications" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-brand-accent)' }}>View all</Link>
          </div>
          <div className="space-y-1">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No recent activity yet.
              </p>
            ) : (
              notifications.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex gap-3 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', color: 'var(--color-brand-accent)' }}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      <strong>{safeText(item.title, 'Update')}</strong> {safeText(item.body, '')}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(item.createdAt, '')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Row 3: Commission Tracker (2x1) ─── */}
        <div className="lg:col-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Confirmed Payments</span>
            <Link href="/dashboard/agent/transactions" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-brand-accent)' }}>Breakdown</Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{formatCurrency(confirmedTotal)}</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>All confirmed</div>
            </div>
            <div className="flex-1 space-y-2">
              {confirmedPayments.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No confirmed payments yet.</p>
              ) : (
                confirmedPayments.slice(0, 3).map((payment: any) => {
                  const tx = agentTransactions.find((t) => t.id === payment.transactionId);
                  return (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <span className="truncate pr-3" style={{ color: 'var(--color-text-secondary)' }}>{safeText(tx?.listing?.title, 'Transaction')}</span>
                      <span className="font-semibold shrink-0" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(payment.amount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ─── Row 3: Lead Funnel (2x1) ─── */}
        <div className="lg:col-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Lead Funnel</span>
            <Link href="/dashboard/agent/clients" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-brand-accent)' }}>Full funnel</Link>
          </div>
          <div className="flex gap-3">
            {funnel.map((stage, i) => (
              <div key={stage.label} className="flex-1 text-center p-3 rounded-lg" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
                <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stage.count}</div>
                <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>{stage.label}</div>
                {i < funnel.length - 1 && <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>→</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Row 4: Quick Actions (full width) ─── */}
        <div className="lg:col-span-4 rounded-xl p-5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="bento-title mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Quick Actions</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/dashboard/agent/listings/new" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
              <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-brand-primary)', color: 'var(--color-text-inverse)' }}><Plus className="w-5 h-5" /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>New Listing</span>
            </Link>
            <Link href="/dashboard/agent/clients" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
              <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-text-inverse)' }}><Calendar className="w-5 h-5" /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Schedule Visit</span>
            </Link>
            <button onClick={() => emitToast('Referral link copied — share it with your client', 'success')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
              <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}><Link2 className="w-5 h-5" /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Refer Client</span>
            </button>
            <Link href="/dashboard/agent/transactions" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
              <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-success)', color: 'var(--color-text-inverse)' }}><BarChart3 className="w-5 h-5" /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Listings Section */}
      {listingsData?.listings && listingsData.listings.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Listings</h2>
            <Link href="/dashboard/agent/listings" className="text-xs font-semibold" style={{ color: 'var(--color-brand-secondary)' }}>View all</Link>
          </div>
          <div className="space-y-2">
            {listingsData.listings.map((listing: any) => (
              <Link
                key={listing.id}
                href={`/properties/${listing.id}`}
                className="block rounded-lg p-3 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--color-bg-elevated)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{listing.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{listing.category} · {listing.locationJson?.city ?? ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {formatPrice(listing.price, listing.currency ?? 'NGN')}
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={statusToneStyle(listing.status)}>
                      {safeText(listing.status, 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
