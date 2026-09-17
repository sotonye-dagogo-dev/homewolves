'use client';

import { useAuth } from '@/hooks/use-auth';
import { useDashboardStats, useRecentClients } from '@/hooks/use-crm';
import { useListings } from '@/hooks/use-listings';
import { useInspections } from '@/hooks/use-crm';
import { useMyStats } from '@/hooks/use-activity';
import Link from 'next/link';
import { Moon, Home, ClipboardList, Phone, BadgeCheck, Calendar, Link2, BarChart3, Plus, Wallet } from 'lucide-react';

const chartData = [
  { month: 'Jan', views: 45, inquiries: 30 },
  { month: 'Feb', views: 55, inquiries: 35 },
  { month: 'Mar', views: 40, inquiries: 25 },
  { month: 'Apr', views: 60, inquiries: 40 },
  { month: 'May', views: 70, inquiries: 50 },
  { month: 'Jun', views: 65, inquiries: 55 },
  { month: 'Jul', views: 80, inquiries: 60 },
];

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#E8F7EE', color: '#1A7A4A', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#B45309', label: 'Pending' },
  documentation: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Documentation' },
  closed: { bg: '#F3E8FF', color: '#6B21A8', label: 'Closed' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

export default function AgentDashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: activityStats } = useMyStats();
  const { data: recentClients } = useRecentClients();
  const { data: listingsData } = useListings({ ownerId: user?.id ?? '', take: '5' });
  const today = new Date().toISOString().split('T')[0];
  const { data: inspections } = useInspections(today);

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
          <button className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-secondary)' }} aria-label="Theme toggle">
            <Moon className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
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
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--color-success)' }}>↑ 12%</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stats?.newThisMonth ?? 0}</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>New This Month</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--color-success)' }}>↑ 8%</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stats?.pendingClients ?? 0}</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>Pending</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--color-error)' }}>↓ 3%</div>
            </div>
          </div>
          {recentClients && recentClients.length > 0 && (
            <div className="mt-3 space-y-2">
              {recentClients.slice(0, 3).map((client: any) => (
                <div key={client.id} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--color-brand-secondary)' }}>
                    {client.buyer?.firstName?.[0]}{client.buyer?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {client.buyer?.firstName} {client.buyer?.lastName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {client.buyer?.email}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: statusConfig[client.status]?.bg ?? '#E8F7EE', color: statusConfig[client.status]?.color ?? '#1A7A4A' }}>
                    {statusConfig[client.status]?.label ?? client.status}
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
            {inspections && inspections.length > 0 ? inspections.slice(0, 3).map((insp: any) => (
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
          <button className="w-full text-center py-2 text-xs font-semibold rounded-lg mt-2" style={{ color: 'var(--color-brand-accent)' }}>
            Schedule inspection
          </button>
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase" style={{ background: activityStats?.tier === 'diamond' ? '#8B5CF6' : activityStats?.tier === 'platinum' ? '#6366F1' : activityStats?.tier === 'gold' ? '#F59E0B' : activityStats?.tier === 'silver' ? '#9CA3AF' : '#D97706', color: '#fff' }}>
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
            <span className="text-xs font-semibold" style={{ color: 'var(--color-brand-accent)' }}>Full report</span>
          </div>
          <div className="flex items-end gap-2 h-[200px] pt-4">
            {chartData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full max-w-[40px] rounded-t-sm transition-all duration-500" style={{ height: `${d.views}%`, background: 'var(--color-brand-primary)', opacity: 0.6 }} />
                <div className="w-full max-w-[40px] rounded-t-sm transition-all duration-500" style={{ height: `${d.inquiries}%`, background: 'var(--color-brand-accent)', opacity: 0.8 }} />
                <span className="text-[9px] text-center" style={{ color: 'var(--color-text-muted)' }}>{d.month}</span>
              </div>
            ))}
          </div>
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
            <span className="text-xs font-semibold" style={{ color: 'var(--color-brand-accent)' }}>View all</span>
          </div>
          <div className="space-y-1">
            {[
              { Icon: ClipboardList, title: 'New Listing', desc: '3-bedroom apartment in Ikoyi was published', time: '2 hours ago' },
              { Icon: Phone, title: 'Client Call', desc: 'Chidi Okafor requested a viewing', time: '4 hours ago' },
              { Icon: Wallet, title: 'Offer Received', desc: '₦85M offer on 5-bedroom in Lekki', time: 'Yesterday' },
              { Icon: Home, title: 'Inspection Completed', desc: 'Property inspection at 12 Admiralty Way', time: 'Yesterday' },
              { Icon: BadgeCheck, title: 'Deal Closed', desc: 'Sale completed for 3-bedroom in VI', time: '2 days ago' },
            ].map((item, i) => {
              const Icon = item.Icon;
              return (
              <div key={i} className="flex gap-3 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <div className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-brand-accent)' }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    <strong>{item.title}</strong> {item.desc}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.time}</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* ─── Row 3: Commission Tracker (2x1) ─── */}
        <div className="lg:col-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Commission Tracker</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-brand-accent)' }}>Breakdown</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>₦2.4M</div>
              <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>This Quarter</div>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { prop: '3-Bed Ikoyi', amt: '₦850K' },
                { prop: '5-Bed Lekki', amt: '₦1.2M' },
                { prop: 'Studio VI', amt: '₦350K' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{c.prop}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.amt}</span>
                </div>
              ))}
              <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--color-border-subtle)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: '65%', background: 'var(--color-brand-accent)' }} />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>Monthly target: ₦3.5M</span>
                <span>65%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Row 3: Lead Funnel (2x1) ─── */}
        <div className="lg:col-span-2 rounded-xl p-5 transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Lead Funnel</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-brand-accent)' }}>Full funnel</span>
          </div>
          <div className="flex gap-3">
            {[
              { count: '24', label: 'Leads' },
              { count: '18', label: 'Contacted' },
              { count: '12', label: 'Viewings' },
              { count: '6', label: 'Offers' },
              { count: '3', label: 'Closed' },
            ].map((stage, i) => (
              <div key={i} className="flex-1 text-center p-3 rounded-lg" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
                <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-accent)' }}>{stage.count}</div>
                <div className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>{stage.label}</div>
                {i < 4 && <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>→</div>}
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
            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
              <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}><Link2 className="w-5 h-5" /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Refer Client</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-center transition-all hover:-translate-y-0.5" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
              <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'var(--color-success)', color: 'var(--color-text-inverse)' }}><BarChart3 className="w-5 h-5" /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Analytics</span>
            </button>
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
                      {listing.currency} {parseFloat(listing.price).toLocaleString()}
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                      background: listing.status === 'ACTIVE' ? '#E8F7EE' : listing.status === 'PENDING' ? '#FEF3C7' : '#F3F4F6',
                      color: listing.status === 'ACTIVE' ? '#1A7A4A' : listing.status === 'PENDING' ? '#B45309' : '#6B7280',
                    }}>
                      {listing.status}
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
