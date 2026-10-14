/** Shared, config-free price formatting with NaN guards. */

export function priceToNumber(price: unknown): number {
  if (typeof price === 'number' && Number.isFinite(price)) return price;
  const n = typeof price === 'string' ? Number.parseFloat(price) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function formatPrice(price: unknown, currency = 'NGN', locale = 'en-NG'): string {
  const n = priceToNumber(price);
  try {
    return `${currency} ${n.toLocaleString(locale)}`;
  } catch {
    return `${currency} ${n}`;
  }
}

export function comparePriceAsc(a: unknown, b: unknown): number {
  return priceToNumber((a as { price?: unknown })?.price ?? a) - priceToNumber((b as { price?: unknown })?.price ?? b);
}

export function comparePriceDesc(a: unknown, b: unknown): number {
  return comparePriceAsc(b, a);
}
