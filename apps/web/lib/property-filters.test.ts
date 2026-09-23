import { describe, it, expect } from 'vitest';
import {
  CATEGORY_MAP,
  VALID_PILL_IDS,
  isValidPillId,
  readSearchParamFromQueryString,
  pillFromSearchParams,
  buildListingParams,
  matchesPillClientSide,
  parseListingResponse,
  dedupePills,
} from './property-filters';

describe('isValidPillId', () => {
  it('accepts every valid pill id', () => {
    for (const id of VALID_PILL_IDS) {
      expect(isValidPillId(id)).toBe(true);
    }
  });

  it('rejects invalid or missing ids', () => {
    expect(isValidPillId('nope')).toBe(false);
    expect(isValidPillId(null)).toBe(false);
    expect(isValidPillId(undefined)).toBe(false);
    expect(isValidPillId('')).toBe(false);
  });
});

describe('readSearchParamFromQueryString', () => {
  it('reads a named param', () => {
    expect(readSearchParamFromQueryString('?search=lekki&category=sale', 'search')).toBe('lekki');
    expect(readSearchParamFromQueryString('?search=lekki&category=sale', 'category')).toBe('sale');
  });

  it('returns empty string when missing', () => {
    expect(readSearchParamFromQueryString('', 'search')).toBe('');
    expect(readSearchParamFromQueryString('?other=1', 'search')).toBe('');
  });
});

describe('pillFromSearchParams', () => {
  it('resolves a valid category from the URL', () => {
    expect(pillFromSearchParams('?category=rent')).toBe('rent');
    expect(pillFromSearchParams('?category=sale')).toBe('sale');
  });

  it('falls back to "all" for missing or invalid category', () => {
    expect(pillFromSearchParams('')).toBe('all');
    expect(pillFromSearchParams('?category=bogus')).toBe('all');
    expect(pillFromSearchParams('?category=')).toBe('all');
  });
});

describe('buildListingParams', () => {
  it('maps category pills to API category values', () => {
    expect(buildListingParams('sale', '', 0).category).toBe('SALE');
    expect(buildListingParams('rent', '', 0).category).toBe('RENT');
    expect(buildListingParams('shortlet', '', 0).category).toBe('SHORTLET');
    expect(buildListingParams('land', '', 0).category).toBe('LAND');
  });

  it('omits category for "all" and non-category pills', () => {
    expect(buildListingParams('all', '', 0)).not.toHaveProperty('category');
    expect(buildListingParams('verified', '', 0)).not.toHaveProperty('category');
    expect(buildListingParams('furnished', '', 0)).not.toHaveProperty('category');
    expect(buildListingParams('new_dev', '', 0)).not.toHaveProperty('category');
  });

  it('includes search, pagination, and pill-specific params', () => {
    const params = buildListingParams('verified', 'ikoyi', 2);
    expect(params.search).toBe('ikoyi');
    expect(params.verified).toBe('true');
    expect(params.skip).toBe('24');
    expect(params.take).toBe('12');

    expect(buildListingParams('furnished', '', 0).furnished).toBe('true');
    expect(buildListingParams('new_dev', '', 0).type).toBe('new_dev');
  });

  it('omits empty search', () => {
    expect(buildListingParams('all', '', 0)).not.toHaveProperty('search');
  });
});

describe('matchesPillClientSide', () => {
  const listing = {
    verified: true,
    metadata: { furnished: true, newDevelopment: true },
  };

  it('passes everything for "all" and empty pill', () => {
    expect(matchesPillClientSide(listing, 'all')).toBe(true);
    expect(matchesPillClientSide(listing, '')).toBe(true);
  });

  it('filters verified listings', () => {
    expect(matchesPillClientSide({ verified: true }, 'verified')).toBe(true);
    expect(matchesPillClientSide({ verified: false }, 'verified')).toBe(false);
    expect(matchesPillClientSide({}, 'verified')).toBe(false);
  });

  it('filters furnished via metadata flags', () => {
    expect(matchesPillClientSide({ metadata: { furnished: true } }, 'furnished')).toBe(true);
    expect(matchesPillClientSide({ metadata: { isFurnished: true } }, 'furnished')).toBe(true);
    expect(matchesPillClientSide({ metadata: {} }, 'furnished')).toBe(false);
  });

  it('filters new_dev via metadata flags', () => {
    expect(matchesPillClientSide({ metadata: { newDevelopment: true } }, 'new_dev')).toBe(true);
    expect(matchesPillClientSide({ metadata: { isNewDevelopment: true } }, 'new_dev')).toBe(true);
    expect(matchesPillClientSide({ metadata: {} }, 'new_dev')).toBe(false);
  });

  it('passes category pills (filtered server-side)', () => {
    expect(matchesPillClientSide({ category: 'SALE' }, 'sale')).toBe(true);
    expect(matchesPillClientSide({ category: 'RENT' }, 'rent')).toBe(true);
  });
});

describe('parseListingResponse', () => {
  it('returns listings from a { listings } envelope', () => {
    expect(parseListingResponse({ listings: [{ id: '1' }] })).toEqual([{ id: '1' }]);
  });

  it('returns a bare array', () => {
    expect(parseListingResponse([{ id: '1' }])).toEqual([{ id: '1' }]);
  });

  it('returns [] for null, non-object, and object without listings', () => {
    expect(parseListingResponse(null)).toEqual([]);
    expect(parseListingResponse(undefined)).toEqual([]);
    expect(parseListingResponse('nope')).toEqual([]);
    expect(parseListingResponse(42)).toEqual([]);
    expect(parseListingResponse({ items: [] })).toEqual([]);
    expect(parseListingResponse({ listings: 'not-an-array' })).toEqual([]);
  });
});

describe('dedupePills', () => {
  it('removes duplicate ids while preserving order', () => {
    const pills = [
      { id: 'all', label: 'All' },
      { id: 'sale', label: 'For Sale' },
      { id: 'all', label: 'All (dup)' },
      { id: 'rent', label: 'Rent' },
    ];
    const result = dedupePills(pills);
    expect(result.map((p) => p.id)).toEqual(['all', 'sale', 'rent']);
    expect(result[0]?.label).toBe('All');
  });

  it('drops entries without a string id and handles non-arrays', () => {
    expect(dedupePills([{ label: 'no id' } as never, { id: 'all' }, { id: 'all' }])).toEqual([{ id: 'all' }]);
    expect(dedupePills(null)).toEqual([]);
    expect(dedupePills(undefined)).toEqual([]);
    expect(dedupePills({ id: 'all' } as never)).toEqual([]);
  });
});

describe('CATEGORY_MAP', () => {
  it('maps known category pills and leaves others undefined', () => {
    expect(CATEGORY_MAP.sale).toBe('SALE');
    expect(CATEGORY_MAP.all).toBeUndefined();
    expect(CATEGORY_MAP.furnished).toBeUndefined();
  });
});
