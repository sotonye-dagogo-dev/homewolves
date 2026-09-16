import { FALLBACK_AMENITIES, FALLBACK_FILTER_PILLS, FALLBACK_NAV_ITEMS, FALLBACK_PROPERTY_TYPES, FALLBACK_FEATURE_FLAGS } from '@/config/fallbacks';
import { getApiBase } from '@/lib/api-base';



export interface ConfigResponse {
  key: string;
  value: unknown;
}

async function fetchConfig(key: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${getApiBase()}/config/${key}`);
    if (!res.ok) return null;
    const data: ConfigResponse = await res.json();
    return data.value;
  } catch {
    return null;
  }
}

async function fetchAllConfigs(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${getApiBase()}/config`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export function getFallbackFor(key: string): unknown {
  switch (key) {
    case 'amenities':
      return FALLBACK_AMENITIES;
    case 'filter_pills':
      return FALLBACK_FILTER_PILLS;
    case 'nav_items':
      return FALLBACK_NAV_ITEMS;
    case 'property_types':
      return FALLBACK_PROPERTY_TYPES;
    case 'feature_flags':
      return FALLBACK_FEATURE_FLAGS;
    default:
      return null;
  }
}

export function resolveConfig<T>(key: string, apiValue: T | null | undefined): T {
  if (apiValue) return apiValue;
  const fallback = getFallbackFor(key);
  return (fallback ?? apiValue) as T;
}

export { fetchConfig, fetchAllConfigs };
