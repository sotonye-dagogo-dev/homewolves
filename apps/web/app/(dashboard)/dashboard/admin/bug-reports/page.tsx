'use client';

import { useState } from 'react';
import { Bug, ChevronDown, Trash2 } from 'lucide-react';
import { HwButton, HwBadge, HwCard } from '@/components/ui';
import { useBugReports, useUpdateBugReportStatus, useBatchUpdateBugReports, useDeleteBugReport } from '@/hooks/use-bug-reports';
import { useBatchSelection } from '@/hooks/use-batch-selection';
import { HwBatchBar, type BatchAction } from '@/components/ui/hw-batch-bar';
import { useToast } from '@/components/shared/Toast';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  CLOSED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

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
        <h1 className="text-2xl font-semibold text-white">Bug Reports</h1>
        <p className="text-sm text-white/50 mt-1">Manage user-submitted bug reports</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CLOSED">Closed</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Types</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="UI_ISSUE">UI Issue</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="OTHER">Other</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <HwCard className="p-12 text-center">
          <Bug className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-lg">No bug reports found</p>
          <p className="text-sm text-white/30 mt-1">
            {statusFilter || typeFilter ? 'Try adjusting your filters' : 'Users can submit bug reports from the support page'}
          </p>
        </HwCard>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-3 text-white/50 font-medium">ID</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Type</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Description</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">User</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Date</th>
                  <th className="text-right py-3 px-3 text-white/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: any) => (
                  <tr key={report.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-3 text-white/40 font-mono text-xs">{report.id.slice(0, 8)}</td>
                    <td className="py-3 px-3">
                      <span className="text-white/70 text-xs">{TYPE_LABELS[report.type] ?? report.type}</span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-white/80 truncate">{report.description}</p>
                      {report.screenshots && Array.isArray(report.screenshots) && report.screenshots.length > 0 && (
                        <p className="text-xs text-white/30 mt-0.5">{report.screenshots.length} screenshot(s)</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-white/60">
                      {report.user?.firstName} {report.user?.lastName}
                    </td>
                    <td className="py-3 px-3">
                      <HwBadge className={STATUS_COLORS[report.status] ?? ''}>
                        {report.status.replace('_', ' ')}
                      </HwBadge>
                    </td>
                    <td className="py-3 px-3 text-white/40 text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {editingId === report.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="appearance-none px-2 py-1 rounded bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
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
                            className="w-32 px-2 py-1 rounded bg-white/10 border border-white/20 text-xs text-white placeholder:text-white/30 focus:outline-none"
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
              <p className="text-sm text-white/40">
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
