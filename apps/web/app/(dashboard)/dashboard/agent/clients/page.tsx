'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, EllipsisVertical } from 'lucide-react';
import { useClients } from '@/hooks/use-crm';
import { chipToneStyle, CLIENT_STATUS_TONE } from '@/lib/status';

const statusLabels: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  documentation: 'Documentation',
  closed: 'Closed',
  rejected: 'Rejected',
};

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: clients } = useClients({ search: search || undefined, status: statusFilter || undefined });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Client CRM
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Manage your client relationships
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full flex-1 max-w-sm" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}>
          <span style={{ color: 'var(--color-text-muted)' }}><Search className="w-4 h-4" /></span>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-full text-sm outline-none"
          style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-secondary)' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="documentation">Documentation</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Client', 'Status', 'Last Activity', 'Property', ''].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients && clients.length > 0 ? clients.map((client: any) => (
              <tr
                key={client.id}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => router.push(`/dashboard/agent/clients/${client.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold shrink-0" style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-text-inverse)' }}>
                      {client.buyer?.firstName?.[0]}{client.buyer?.lastName?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                        {client.buyer?.firstName} {client.buyer?.lastName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{client.buyer?.phone ?? client.buyer?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ ...chipToneStyle(CLIENT_STATUS_TONE[client.status] ?? 'neutral') }}>
                    {statusLabels[client.status] ?? client.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(client.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {client.inspections?.[0]?.listing?.title ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/agent/clients/${client.id}`); }} className="w-8 h-8 rounded-full grid place-items-center transition-colors hover:bg-black/5" style={{ color: 'var(--color-text-muted)' }} aria-label="More actions"><EllipsisVertical className="w-4 h-4" /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {search ? 'No clients match your search' : 'No clients yet. Assign your first client.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
