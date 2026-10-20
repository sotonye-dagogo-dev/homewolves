/**
 * Shared, null-safe formatting helpers.
 *
 * Every page renders values that come from an API, URL params, or optional
 * relations. These helpers guarantee we never surface `NaN`, `undefined`,
 * `null`, or `Invalid Date` in the UI — the caller always gets a string.
 */

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function formatNumber(value: unknown, options?: Intl.NumberFormatOptions, locale = 'en-NG'): string {
  const n = toNumber(value, Number.NaN);
  if (!Number.isFinite(n)) return '—';
  try {
    return n.toLocaleString(locale, options);
  } catch {
    return String(n);
  }
}

export function formatCurrency(
  value: unknown,
  currency = 'NGN',
  locale = 'en-NG',
): string {
  const n = toNumber(value, Number.NaN);
  if (!Number.isFinite(n)) return '—';
  try {
    const formatted = n.toLocaleString(locale, {
      maximumFractionDigits: 0,
    });
    return `${currency} ${formatted}`;
  } catch {
    return `${currency} ${n}`;
  }
}

export function formatRating(value: unknown, fallback = '—'): string {
  const n = toNumber(value, Number.NaN);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(1);
}

export function formatDate(value: unknown, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
}

export function formatDateTime(value: unknown, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  try {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
}

export function formatTime(value: unknown, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  try {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return fallback;
  }
}

export function formatFileSize(bytes: unknown, fallback = '—'): string {
  const n = toNumber(bytes, Number.NaN);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Safe display text for optional strings. */
export function safeText(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

/** Full name from optional first/last parts. */
export function fullName(
  first: unknown,
  last: unknown,
  fallback = 'Unknown user',
): string {
  const f = typeof first === 'string' ? first.trim() : '';
  const l = typeof last === 'string' ? last.trim() : '';
  if (!f && !l) return fallback;
  return `${f} ${l}`.trim();
}

export function initials(first: unknown, last: unknown, fallback = '?'): string {
  const f = typeof first === 'string' ? first.trim() : '';
  const l = typeof last === 'string' ? last.trim() : '';
  const value = `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  return value || fallback;
}

/** Guarantees an array for any API envelope. */
export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'list']) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

/** Clamp a number into a range, with a safe fallback. */
export function clamp(value: unknown, min: number, max: number, fallback = min): number {
  const n = toNumber(value, fallback);
  return Math.min(max, Math.max(min, n));
}
