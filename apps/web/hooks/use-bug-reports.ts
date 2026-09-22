'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBugReport,
  fetchBugReports,
  fetchMyBugReports,
  fetchBugReport,
  updateBugReportStatus,
  batchUpdateBugReports,
  deleteBugReport,
} from '@/lib/bug-reports';

export function useBugReports(params?: { status?: string; type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['bug-reports', params],
    queryFn: () => fetchBugReports(params),
  });
}

export function useMyBugReports(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['bug-reports', 'mine', params?.page ?? 1],
    queryFn: () => fetchMyBugReports(params),
  });
}

export function useBugReport(id: string) {
  return useQuery({
    queryKey: ['bug-report', id],
    queryFn: () => fetchBugReport(id),
    enabled: !!id,
  });
}

export function useCreateBugReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBugReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bug-reports'] });
      qc.invalidateQueries({ queryKey: ['bug-reports', 'mine'] });
    },
  });
}

export function useUpdateBugReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; adminNote?: string } }) =>
      updateBugReportStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bug-reports'] }),
  });
}

export function useBatchUpdateBugReports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: batchUpdateBugReports,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bug-reports'] }),
  });
}

export function useDeleteBugReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBugReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bug-reports'] }),
  });
}
