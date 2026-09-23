'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchConfig, resolveConfig } from '@/lib/platform-config';

export function usePlatformConfig<T = unknown>(key: string) {
  return useQuery<T | null>({
    queryKey: ['platform-config', key],
    queryFn: () => fetchConfig(key) as Promise<T | null>,
    staleTime: 5 * 60 * 1000,
    select: (data) => resolveConfig<T>(key, data),
  });
}

export function useBrand() {
  return usePlatformConfig<BrandConfig>('brand');
}

export function useAmenities() {
  return usePlatformConfig<AmenityConfig[]>('amenities');
}

export function useFilterPills() {
  return usePlatformConfig<FilterPillConfig[]>('filter_pills');
}

export function useNavItems() {
  return usePlatformConfig<NavItemConfig[]>('nav_items');
}

export function usePropertyTypes() {
  return usePlatformConfig<PropertyTypeConfig[]>('property_types');
}

export function useFeatureFlag(flagId: string) {
  const { data: flags } = usePlatformConfig<FeatureFlag[]>('feature_flags');
  const flag = flags?.find((f) => f.id === flagId);
  return { enabled: flag?.enabled ?? false, flag };
}

export function useGoogleOauth() {
  const { data } = usePlatformConfig<{ clientId?: string; enabled?: boolean }>('google_oauth');
  return {
    clientId: data?.clientId ?? null,
    enabled: Boolean(data?.enabled && data.clientId),
  };
}
