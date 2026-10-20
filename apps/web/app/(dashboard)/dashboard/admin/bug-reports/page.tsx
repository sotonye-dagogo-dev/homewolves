'use client';

import { useState } from 'react';
import { Bug, ChevronDown, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate, fullName, safeText } from '@/lib/format';
import { statusToneStyle } from '@/lib/status';
import { HwButton, HwBadge } from '@/components/ui';
import { useBugReports, useUpdateBugReportStatus, useBatchUpdateBugReports, useDeleteBugReport } from '@/hooks/use-bug-reports';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import { HwBatchBar, type BatchAction } from '@/components/ui/hw-batch-bar';
import { useToast } from '@/components/shared/Toast';

const TYPE_LABELS: Record<string, string> = {
  BUG: 'Bug',
  FEATURE_REQUEST: 'Feature',
  UI_ISSUE: 'UI Issue',
  PERFORMANCE: 'Performance',
  OTHER: 'Other',
};

export default function AdminBugReportsPage() {
  const { success, error: toastError } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');

  const { data, isLoading } = useBugReports({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    page,
    limit: 25,
  });

  const updateStatus = useUpdateBugReportStatus();
  const batchUpdate = useBatchUpdateBugReports();
  const deleteReport = useDeleteBugReport();
  const batch = useBatchSelection();

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const allIds = reports.map((r: any) => r.id);

  const startEdit = (report: any) => {
    setEditingId(report.id);
    setEditStatus(report.status);
    setEditNote(report.adminNote ?? '');
  };

  const saveEdit = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, data: { status: editStatus, adminNote: editNote || undefined } });
      success('Status updated');
      setEditingId(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleBatchAction = async (status: string) => {
    const ids = Array.from(batch.selectedIds);
    if (ids.length === 0) return;
    try {
      await batchUpdate.mutateAsync({ ids, status });
      success(`${ids.length} report(s) updated to ${status}`);
      batch.clear();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Batch update failed');
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(batch.selectedIds);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await deleteReport.mutateAsync(id);
      }
      success(`${ids.length} report(s) deleted`);
      batch.clear();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Batch delete failed');
    }
  };

  const batchActions: BatchAction[] = [
    { label: 'Open', onClick: () => handleBatchAction('OPEN'), variant: 'secondary' },
    { label: 'Under Review', onClick: () => handleBatchAction('UNDER_REVIEW'), variant: 'secondary' },
    { label: 'Closed', onClick: () => handleBatchAction('CLOSED'), variant: 'secondary' },
    { label: 'Delete', onClick: handleBatchDelete, variant: 'ghost', icon: <Trash2 className="w-3.5 h-3.5" />, className: 'text-[var(--color-error)]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Bug Reports</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage user-submitted bug reports</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CLOSED">Closed</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          >
            <option value="">All Types</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="UI_ISSUE">UI Issue</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="OTHER">Other</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="No bug reports found"
          description={
            statusFilter || typeFilter
              ? 'Try adjusting your filters.'
              : 'Users can submit bug reports from the support page.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border-default)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                  {['ID', 'Type', 'Description', 'User', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: any) => (
                  <tr key={report.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>{String(report.id ?? '').slice(0, 8)}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{TYPE_LABELS[report.type] ?? safeText(report.type, 'Other')}</span>
                    </td>
                    <td className="max-w-xs px-3 py-3">
                      <p className="truncate" style={{ color: 'var(--color-text-primary)' }}>{safeText(report.description, 'No description')}</p>
                      {Array.isArray(report.screenshots) && report.screenshots.length > 0 && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{report.screenshots.length} screenshot(s)</p>
                      )}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {fullName(report.user?.firstName, report.user?.lastName, 'Unknown')}
                    </td>
                    <td className="px-3 py-3">
                      <HwBadge style={statusToneStyle(report.status)}>
                        {safeText(report.status, 'OPEN').replace('_', ' ')}
                      </HwBadge>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {editingId === report.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="appearance-none rounded px-2 py-1 text-xs focus:outline-none"
                            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
                          >
                            <option value="OPEN">Open</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Note (optional)"
                            className="w-32 rounded px-2 py-1 text-xs focus:outline-none"
                            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
                          />
                          <HwButton variant="primary" size="sm" onClick={() => saveEdit(report.id)} disabled={updateStatus.isPending}>
                            Save
                          </HwButton>
                          <HwButton variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </HwButton>
                        </div>
                      ) : (
                        <HwButton variant="ghost" size="sm" onClick={() => startEdit(report)}>
                          Edit
                        </HwButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 25 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex gap-2">
                <HwButton variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </HwButton>
                <HwButton variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 25 >= total}>
                  Next
                </HwButton>
              </div>
            </div>
          )}
        </>
      )}

      <HwBatchBar
        selectedCount={batch.count}
        isAllSelected={batch.isAllSelected(allIds)}
        onSelectAll={() => batch.selectAll(allIds)}
        onInvertSelect={() => batch.invertSelect(allIds)}
        onUndo={batch.undo}
        onClear={batch.clear}
        actions={batchActions}
        selectedIds={Array.from(batch.selectedIds)}
      />
    </div>
  );
}
