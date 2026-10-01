'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchServices, fetchProduct, fetchService } from '@/lib/catalog';

export function useProducts() {
  return useQuery({ queryKey: ['catalog', 'products'], queryFn: fetchProducts, staleTime: 5 * 60 * 1000 });
}

export function useServices() {
  return useQuery({ queryKey: ['catalog', 'services'], queryFn: fetchServices, staleTime: 5 * 60 * 1000 });
}

export function useProduct(id: string) {
  return useQuery({ queryKey: ['catalog', 'product', id], queryFn: () => fetchProduct(id), enabled: Boolean(id), staleTime: 5 * 60 * 1000 });
}

export function useService(id: string) {
  return useQuery({ queryKey: ['catalog', 'service', id], queryFn: () => fetchService(id), enabled: Boolean(id), staleTime: 5 * 60 * 1000 });
}
