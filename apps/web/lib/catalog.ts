import { getApiBase } from '@/lib/api-base';
import type { ProductItem, ServiceItem } from '@/config/fallbacks';
import { FALLBACK_PRODUCTS, FALLBACK_SERVICES } from '@/config/fallbacks';

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const data = await res.json();
    // Proxy may wrap as { products } / { services } or return arrays directly.
    if (Array.isArray(data)) return data as T;
    if (data && typeof data === 'object') {
      const vals = Object.values(data);
      const arr = vals.find((v) => Array.isArray(v));
      if (arr) return arr as T;
      if ((data as { value?: unknown }).value !== undefined) {
        const v = (data as { value: unknown }).value;
        if (Array.isArray(v)) return v as T;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function fetchProducts(): Promise<ProductItem[]> {
  return getJson<ProductItem[]>('/marketplace/products', FALLBACK_PRODUCTS);
}

export function fetchServices(): Promise<ServiceItem[]> {
  return getJson<ServiceItem[]>('/marketplace/services', FALLBACK_SERVICES);
}

export async function fetchProduct(id: string): Promise<ProductItem | null> {
  const all = await fetchProducts();
  return all.find((p) => p.id === id) ?? null;
}

export async function fetchService(id: string): Promise<ServiceItem | null> {
  const all = await fetchServices();
  return all.find((s) => s.id === id) ?? null;
}

export function formatNaira(amount: number, currency = 'NGN'): string {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
