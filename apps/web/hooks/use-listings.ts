'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createListing,
  updateListing,
  deleteListing,
  fetchListings,
  fetchListingById,
  fetchFeaturedListings,
  type CreateListingPayload,
} from '@/lib/listings';

export function useListings(params?: Record<string, string>, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => fetchListings(params),
    staleTime: 30_000,
    enabled: opts?.enabled ?? true,
  });
}

export function useListing(id: string, initialData?: unknown) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListingById(id),
    enabled: !!id,
    initialData: initialData as never,
  });
}

export function useFeaturedListings() {
  return useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: fetchFeaturedListings,
    staleTime: 60_000,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingPayload) => createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateListingPayload> & { status?: string }) => updateListing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
