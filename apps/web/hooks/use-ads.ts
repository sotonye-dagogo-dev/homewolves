'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdSlots, fetchAdApplications } from '@/lib/ads';

export function useAdSlots() {
  return useQuery({ queryKey: ['ads', 'slots'], queryFn: fetchAdSlots, staleTime: 5 * 60 * 1000 });
}

export function useAdApplications() {
  return useQuery({ queryKey: ['ads', 'applications'], queryFn: fetchAdApplications, staleTime: 60 * 1000 });
}
