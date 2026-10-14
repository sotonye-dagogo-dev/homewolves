'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAuditLog, useExportAuditCsv, useExportAuditPdf } from '@/hooks/use-audit';
import { BrandLogo } from '@/components/shared/brand-logo';
import { useTheme } from '@/components/shared/ThemeProvider';
import { Moon, Sun, LayoutDashboard, Home, ArrowLeftRight, FileText, Users, Settings } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'audit', label: 'Audit Log' },
] as const;

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'listings', label: 'Listings', badge: '12', Icon: Home },
  { id: 'transactions', label: 'Transactions', badge: '8', Icon: ArrowLeftRight },
  { id: 'audit', label: 'Audit Log', Icon: FileText },
] as const;

const BOTTOM_NAV = [
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'config', label: 'Config', Icon: Settings },
] as const;

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [entityType, setEntityType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: auditData, isLoading: auditLoading } = useAuditLog({
    entityType: entityType !== 'all' ? entityType : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    actorId: actorSearch || undefined,
    page,
    limit: 20,
  });

  const exportCsv = useExportAuditCsv();
  const exportPdf = useExportAuditPdf();

  return (
    <div className="admin-layout flex min-h-screen max-w-[1440px] mx-auto">
      {/* Side Navigation — §3.2 Design */}
      <nav
        className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0"
        style={{
          background: 'var(--color-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRight: '1px solid var(--color-border-glass)',
        }}
        role="navigation"
        aria-label="Admin navigation"
      >
        <div className="px-6 py-4 mb-6">
          <Link href="/" aria-label="Admin home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'overview' || item.id === 'audit') { setActiveTab(item.id); return; }
                if (item.id === 'listings') { router.push('/dashboard/agent/listings'); return; }
                if (item.id === 'transactions') { router.push('/dashboard/agent/transactions'); return; }
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                activeTab === item.id ? 'bg-white font-semibold shadow-xs' : ''
              }`}
              style={{
                color: activeTab === item.id ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                background: activeTab === item.id ? 'var(--color-bg-elevated)' : 'transparent',
              }}
            >
              <span className="w-5 flex items-center justify-center shrink-0">
                <item.Icon className="w-[18px] h-[18px]" />
              </span>
              <span>{item.label}</span>
              {'badge' in item && item.badge && (
                <span
                  className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-semibold"
                  style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <hr className="my-2 mx-4" style={{ borderColor: 'var(--color-border-subtle)' }} />

          {BOTTOM_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'users') { router.push('/dashboard/agent/clients'); return; }
                if (item.id === 'config') { router.push('/dashboard/admin/email-templates'); return; }
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span className="w-5 flex items-center justify-center shrink-0">
                <item.Icon className="w-[18px] h-[18px]" />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: 'var(--color-brand-primary)', color: 'var(--color-text-inverse)' }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {user?.role}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 md:px-8 py-4 border-b sticky top-0 z-50"
          style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}
        >
          <h1 className="text-xl md:text-2xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', color: 'var(--color-text-muted)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav
          className="flex border-b px-6 md:px-8"
          style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)' }}
          role="tablist"
          aria-label="Admin tabs"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px"
              role="tab"
              aria-selected={activeTab === tab.id}
              style={{
                color: activeTab === tab.id ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                borderColor: activeTab === tab.id ? 'var(--color-brand-accent)' : 'transparent',
                fontWeight: activeTab === tab.id ? 600 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/admin/moderation" className="p-5 rounded-xl transition-all hover:translate-y-[-2px]" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Pending Approvals</div>
                <div className="text-3xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>—</div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Listings awaiting review</div>
                <div className="flex items-center gap-1 text-sm font-semibold mt-2" style={{ color: 'var(--color-status-active)' }}>▲ 0%</div>
              </Link>

              <Link href="/dashboard/admin/moderation" className="p-5 rounded-xl transition-all hover:translate-y-[-2px]" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Flagged Listings</div>
                <div className="text-3xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>—</div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Reports to resolve</div>
                <div className="flex items-center gap-1 text-sm font-semibold mt-2" style={{ color: 'var(--color-status-rejected)' }}>▼ 0</div>
              </Link>

              <Link href="/dashboard/admin/payments" className="p-5 rounded-xl transition-all hover:translate-y-[-2px]" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Active Transactions</div>
                <div className="text-3xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>—</div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>In progress</div>
                <div className="flex items-center gap-1 text-sm font-semibold mt-2" style={{ color: 'var(--color-status-active)' }}>▲ 0</div>
              </Link>

              <div className="p-5 rounded-xl transition-all hover:translate-y-[-2px]" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Revenue MTD</div>
                <div className="text-3xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>₦—</div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Month to date</div>
                <div className="flex items-center gap-1 text-sm font-semibold mt-2" style={{ color: 'var(--color-status-active)' }}>▲ 0%</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Quick Actions</div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/admin/catalog" className="px-5 py-2 text-sm font-semibold rounded-full transition-all" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                    Manage Catalogue
                  </Link>
                  <Link href="/dashboard/admin/ads" className="px-5 py-2 text-sm font-semibold rounded-full transition-all" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                    Manage Ad Banner
                  </Link>
                  <Link href="/dashboard/admin/moderation" className="px-5 py-2 text-sm font-semibold rounded-full transition-all" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-primary)', border: '1px solid var(--color-brand-primary)' }}>
                    Moderate Listings
                  </Link>
                  <Link href="/dashboard/admin/payments" className="px-5 py-2 text-sm font-semibold rounded-full transition-all" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-primary)', border: '1px solid var(--color-brand-primary)' }}>
                    Review Payments
                  </Link>
                  <button onClick={() => setActiveTab('audit')} className="px-5 py-2 text-sm font-semibold rounded-full transition-all" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-primary)', border: '1px solid var(--color-brand-primary)' }}>
                    View Audit Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="p-6 md:p-8">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 mb-4 rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)', width: 145 }} />

              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)', width: 145 }} />

              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Entity</label>
              <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
                <option value="all">All</option>
                <option value="listing">Listing</option>
                <option value="transaction">Transaction</option>
                <option value="user">User</option>
                <option value="payment">Payment</option>
              </select>

              <input
                type="text"
                placeholder="Search actor..."
                value={actorSearch}
                onChange={(e) => { setActorSearch(e.target.value); setPage(1); }}
                className="flex-1 min-w-[180px] max-w-[240px] px-3 py-2 text-sm rounded-lg border"
                style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              />

              <div className="flex-1" />

              <button
                onClick={() => exportCsv({ entityType: entityType !== 'all' ? entityType : undefined, dateFrom, dateTo, actorId: actorSearch })}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all"
                style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV
              </button>

              <button
                onClick={() => exportPdf({ entityType: entityType !== 'all' ? entityType : undefined, dateFrom, dateTo, actorId: actorSearch })}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all"
                style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                PDF
              </button>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}>Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}>Actor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}>Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}>Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}>Device</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                      </tr>
                    ))
                  ) : auditData?.events?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No audit events found</td>
                    </tr>
                  ) : (
                    auditData?.events?.map((event: any) => (
                      <tr key={event.id} className="transition-all" style={{ background: 'transparent' }}>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: 'var(--color-brand-primary)', color: 'var(--color-text-inverse)' }}>
                              {(event.actorName ?? '?')[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{event.actorName}</div>
                              <span
                                className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                style={{
                                  background: event.actorRole === 'ADMIN' || event.actorRole === 'SUPER_ADMIN' ? 'var(--color-info-bg)' :
                                    event.actorRole === 'AGENT' ? 'var(--color-success-bg)' :
                                    event.actorRole === 'BUYER' ? 'var(--color-warning-bg)' : 'var(--color-bg-base)',
                                  color: event.actorRole === 'ADMIN' || event.actorRole === 'SUPER_ADMIN' ? 'var(--color-info)' :
                                    event.actorRole === 'AGENT' ? 'var(--color-status-active)' :
                                    event.actorRole === 'BUYER' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                                }}
                              >
                                {event.actorRole}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{event.action}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium" style={{ color: 'var(--color-brand-secondary)' }}>
                            {event.entityType} #{event.entityId?.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {event.deviceInfo?.browser ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {event.ipAddress ?? '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {auditData && (
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Page {auditData.page} of {Math.ceil((auditData.total ?? 0) / (auditData.limit ?? 20))} ({auditData.total} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="w-9 h-9 flex items-center justify-center text-sm rounded-lg border transition-all disabled:opacity-30"
                      style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil((auditData.total ?? 0) / (auditData.limit ?? 20))}
                      className="w-9 h-9 flex items-center justify-center text-sm rounded-lg border transition-all disabled:opacity-30"
                      style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
