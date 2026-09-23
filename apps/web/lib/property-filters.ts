// Shared helpers for the properties page: URL ↔ filter-pill sync and
// safe response parsing. Extracted for unit testing.

export const CATEGORY_MAP: Record<string, string | undefined> = {
  all: undefined,
  sale: 'SALE',
  rent: 'RENT',
  shortlet: 'SHORTLET',
  land: 'LAND',
  new_dev: undefined,
};

export const VALID_PILL_IDS = [
  'all',
  'sale',
  'rent',
  'shortlet',
  'land',
  'new_dev',
  'furnished',
  'verified',
] as const;

export function isValidPillId(id: string | null | undefined): id is string {
  return typeof id === 'string' && (VALID_PILL_IDS as readonly string[]).includes(id);
}

/** Reads a query param from a query string (or window.location.search). */
export function readSearchParamFromQueryString(qs: string, name: string): string {
  return new URLSearchParams(qs).get(name) ?? '';
}

/** Resolves the active pill from the URL `category` param. */
export function pillFromSearchParams(qs: string): string {
  const cat = readSearchParamFromQueryString(qs, 'category');
  return isValidPillId(cat) ? cat : 'all';
}

/** Builds the listings API query params for a given pill/search/page. */
export function buildListingParams(
  activePill: string,
  search: string,
  page: number,
): Record<string, string> {
  const params: Record<string, string> = {};
  const cat = CATEGORY_MAP[activePill];
  if (cat) params.category = cat;
  if (search) params.search = search;
  if (activePill === 'verified') params.verified = 'true';
  if (activePill === 'furnished') params.furnished = 'true';
  if (activePill === 'new_dev') params.type = 'new_dev';
  params.take = '12';
  params.skip = String(page * 12);
  return params;
}

/** Client-side predicates for pills the API cannot filter server-side. */
export function matchesPillClientSide(listing: any, pillId: string): boolean {
  if (!pillId || pillId === 'all') return true;
  if (pillId === 'verified') return listing?.verified === true;
  if (pillId === 'furnished') {
    const meta = listing?.metadata;
    return meta?.furnished === true || meta?.isFurnished === true;
  }
  if (pillId === 'new_dev') {
    const meta = listing?.metadata;
    return meta?.newDevelopment === true || meta?.new_dev === true || meta?.isNewDevelopment === true;
  }
  // Category pills are filtered server-side.
  return true;
}

/** Normalizes a listings API response to a safe array of listings. */
export function parseListingResponse(data: unknown): any[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  if (Array.isArray(record.listings)) return record.listings as any[];
  if (Array.isArray(data)) return data as any[];
  return [];
}

/** De-duplicates config pills so a hardcoded "All" never doubles up. */
export function dedupePills<T extends { id?: string }>(pills: T | T[] | null | undefined): T[] {
  const arr = Array.isArray(pills) ? pills : [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of arr) {
    if (!p || typeof p.id !== 'string') continue;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
