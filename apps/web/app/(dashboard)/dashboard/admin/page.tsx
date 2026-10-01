'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuditLog, useExportAuditCsv, useExportAuditPdf } from '@/hooks/use-audit';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'audit', label: 'Audit Log' },
] as const;

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z' },
  { id: 'listings', label: 'Listings', badge: '12', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { id: 'transactions', label: 'Transactions', badge: '8', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'audit', label: 'Audit Log', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8' },
] as const;

const BOTTOM_NAV = [
  { id: 'users', label: 'Users', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'config', label: 'Config', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
] as const;

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' ').map((d, i) => {
        if (d.startsWith('M')) return <path key={i} d={d} />;
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const { user } = useAuth();

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
          <div className="font-display text-xl font-bold" style={{ color: 'var(--color-brand-primary)' }}>
            Homewolves
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'overview' || item.id === 'audit') setActiveTab(item.id);
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
                <NavIcon path={item.icon} />
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
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span className="w-5 flex items-center justify-center shrink-0">
                <NavIcon path={item.icon} />
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
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', color: 'var(--color-text-muted)' }}
              aria-label="Toggle theme"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
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
