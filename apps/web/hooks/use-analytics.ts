'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  trackEvent,
  fetchMyAnalytics,
  fetchListingAnalytics,
  fetchAgentAnalytics,
  fetchFunnel,
  fetchTopListings,
  fetchAdminSummary,
} from '@/lib/analytics';

export function useMyAnalytics(days?: number) {
  return useQuery({
    queryKey: ['my-analytics', days],
    queryFn: () => fetchMyAnalytics(days),
  });
}

export function useListingAnalytics(listingId: string, days?: number) {
  return useQuery({
    queryKey: ['listing-analytics', listingId, days],
    queryFn: () => fetchListingAnalytics(listingId, days),
    enabled: !!listingId,
  });
}

export function useAgentAnalytics(agentId: string, days?: number) {
  return useQuery({
    queryKey: ['agent-analytics', agentId, days],
    queryFn: () => fetchAgentAnalytics(agentId, days),
    enabled: !!agentId,
  });
}

export function useFunnel(days?: number) {
  return useQuery({
    queryKey: ['funnel', days],
    queryFn: () => fetchFunnel(days),
  });
}

export function useAdminSummary() {
  return useQuery({
    queryKey: ['admin-summary'],
    queryFn: fetchAdminSummary,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useTopListings(days?: number, limit = 10) {
  return useQuery({
    queryKey: ['top-listings', days, limit],
    queryFn: () => fetchTopListings(days, limit),
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: (payload: { event: string; listingId?: string; metadata?: Record<string, unknown> }) =>
      trackEvent(payload),
  });
}
