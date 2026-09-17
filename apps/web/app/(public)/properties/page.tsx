'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useListings } from '@/hooks/use-listings';
import { useFilterPills } from '@/hooks/use-platform-config';
import { incrementView } from '@/lib/listings';
import { MobileBar } from '@/components/landing/mobile-bar';
import Link from 'next/link';
import Image from 'next/image';
import { Search, LayoutGrid, List, Map, Heart, Share2, X, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ViewMode = 'grid' | 'list' | 'map';
type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'most_viewed';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'most_viewed', label: 'Most Viewed' },
];

const VALID_PILLS = ['sale', 'rent', 'shortlet', 'land', 'new_dev'];

function readSearchParam(name: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) ?? '';
}

export default function PropertiesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sort, setSort] = useState<SortOption>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState<string>(() => readSearchParam('search'));
  const [debouncedSearch, setDebouncedSearch] = useState<string>(() => readSearchParam('search'));
  const [activePill, setActivePill] = useState<string>(() => {
    const cat = readSearchParam('category');
    return cat && VALID_PILLS.includes(cat) ? cat : 'all';
  });
  const [page, setPage] = useState(0);
  const [listings, setListings] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const { data: filterPills } = useFilterPills();

  const searchTimerRef = useRef<NodeJS.Timeout>();

  const categoryMap: Record<string, string | undefined> = {
    all: undefined,
    sale: 'SALE',
    rent: 'RENT',
    shortlet: 'SHORTLET',
    land: 'LAND',
    new_dev: undefined,
  };

  const params: Record<string, string> = {};
  const cat = categoryMap[activePill];
  if (cat) params.category = cat;
  if (debouncedSearch) params.search = debouncedSearch;
  params.take = '12';
  params.skip = String(page * 12);

  const { data, isFetching } = useListings(params);

  useEffect(() => {
    if (data?.listings) {
      if (page === 0) {
        setListings(data.listings);
      } else {
        setListings((prev) => [...prev, ...data.listings]);
      }
      setHasMore(data.listings.length >= 12);
    }
  }, [data, page]);

  useEffect(() => {
    setPage(0);
    setListings([]);
    setHasMore(true);
  }, [activePill, debouncedSearch]);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const handleCardClick = useCallback(
    async (id: string) => {
      await incrementView(id).catch(() => {});
      router.push(`/properties/${id}`);
    },
    [router],
  );

  const sortedListings = [...listings];
  if (sort === 'price_asc')
    sortedListings.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  if (sort === 'price_desc')
    sortedListings.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  if (sort === 'most_viewed')
    sortedListings.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

  const activeFilters: { key: string; label: string }[] = [];
  if (activePill !== 'all') {
    const pill = filterPills?.find((p: any) => p.id === activePill);
    if (pill) activeFilters.push({ key: activePill, label: pill.label });
  }
  if (debouncedSearch) activeFilters.push({ key: 'search', label: `"${debouncedSearch}"` });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      {/* Skip link */}
      <a href="#listings-main" className="skip-link">
        Skip to content
      </a>

      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          height: '56px',
          background: 'var(--color-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--color-border-glass)',
        }}
      >
        <Link
          href="/"
          className="font-bold"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-brand-primary)',
          }}
        >
          Homewolves
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById('search-input')?.focus()}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Focus search"
          >
            <Search className="w-5 h-5" />
          </button>
          <Link
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Home"
          >
            <Map className="w-5 h-5" />
          </Link>
        </div>
      </header>
      <div className="md:hidden h-[56px]" aria-hidden />

      {/* Filter section */}
      <section
        className="sticky z-40 top-[56px] md:top-0"
        style={{
          background: 'var(--color-bg-base)',
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: 'var(--space-3) var(--space-4) var(--space-2)',
        }}
      >
        {/* Top row: search + view toggle */}
        <div className="flex items-center gap-3 mb-3">
          <div
            id="search"
            className="flex-1 flex items-center gap-2 rounded-full px-4 py-2 transition-shadow"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            <span className="shrink-0" style={{ color: 'var(--color-text-muted)' }}>
              <Search className="w-4 h-4" />
            </span>
            <input
              id="search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div
            className="hidden md:flex items-center gap-0.5 rounded-lg p-0.5 shrink-0"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            {(['grid', 'list', 'map'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="w-9 h-9 rounded flex items-center justify-center text-sm transition-all"
                style={{
                  background: viewMode === mode ? 'var(--color-brand-primary)' : 'transparent',
                  color:
                    viewMode === mode ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                }}
              >
                {mode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : mode === 'list' ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            onClick={() => setActivePill('all')}
            className="shrink-0 px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background:
                activePill === 'all' ? 'var(--color-brand-primary)' : 'var(--color-bg-elevated)',
              color:
                activePill === 'all' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              border: `1px solid ${activePill === 'all' ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
            }}
          >
            All{' '}
            <span
              className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px]"
              style={{
                background:
                  activePill === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--color-border-subtle)',
              }}
            >
              {data?.total ?? 0}
            </span>
          </button>
          {(filterPills ?? []).map((pill: any) => (
            <button
              key={pill.id}
              onClick={() => setActivePill(pill.id)}
              className="shrink-0 px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background:
                  activePill === pill.id
                    ? 'var(--color-brand-primary)'
                    : 'var(--color-bg-elevated)',
                color:
                  activePill === pill.id
                    ? 'var(--color-text-inverse)'
                    : 'var(--color-text-secondary)',
                border: `1px solid ${activePill === pill.id ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
              }}
            >
              {pill.label ?? pill.id}
            </button>
          ))}
        </div>

        {/* Sort row: active filters + results count + sort dropdown */}
        <div className="flex items-center justify-between mt-2 gap-3">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {activeFilters.map((f) => (
              <div
                key={f.key}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
                style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
                onClick={() => {
                  if (f.key === activePill) setActivePill('all');
                  if (f.key === 'search') {
                    setSearch('');
                    setDebouncedSearch('');
                  }
                }}
              >
                {f.label}
                <span className="w-4 h-4 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
          <span
            className="text-xs whitespace-nowrap shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <strong style={{ color: 'var(--color-text-primary)' }}>{data?.total ?? 0}</strong>{' '}
            results
          </span>
          <div ref={sortRef} className="relative shrink-0">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {sortOptions.find((o) => o.value === sort)?.label} <ChevronDown className="w-3 h-3" />
            </button>
            {sortOpen && (
              <div
                className="absolute top-full right-0 z-50 min-w-[180px] mt-1 rounded-xl overflow-hidden shadow-lg"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-default)',
                }}
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSort(opt.value);
                      setSortOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left transition-colors"
                    style={{
                      color:
                        sort === opt.value
                          ? 'var(--color-brand-accent)'
                          : 'var(--color-text-primary)',
                      fontWeight: sort === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <main id="listings-main" className="max-w-[1280px] mx-auto px-4 md:px-10 py-4 md:py-6">
        {/* Grid view (default) */}
        {viewMode === 'grid' && (
          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {sortedListings.map((listing) => (
              <PropertyCard
                key={listing.id}
                listing={listing}
                onClick={() => handleCardClick(listing.id)}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-3">
            {sortedListings.map((listing) => (
              <PropertyCardHorizontal
                key={listing.id}
                listing={listing}
                onClick={() => handleCardClick(listing.id)}
              />
            ))}
          </div>
        )}

        {/* Map view placeholder */}
        {viewMode === 'map' && (
          <div
            className="rounded-xl p-16 text-center"
            style={{ background: 'var(--color-bg-elevated)' }}
          >
            <div className="flex justify-center mb-3" style={{ color: 'var(--color-text-muted)' }}><Map className="w-10 h-10" /></div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Map view coming soon
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Interactive property map
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {isFetching && page === 0 && (
          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:gap-6 mt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {isFetching && page > 0 && (
          <div className="text-center py-4">
            <div
              className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: 'var(--color-border-default)',
                borderTopColor: 'var(--color-brand-accent)',
              }}
            />
          </div>
        )}
        {!hasMore && listings.length > 0 && (
          <p className="text-center text-xs py-6" style={{ color: 'var(--color-text-tertiary)' }}>
            You&apos;ve reached the end
          </p>
        )}

        {/* Empty state */}
        {!isFetching && listings.length === 0 && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-3" style={{ color: 'var(--color-text-muted)' }}><Search className="w-10 h-10" /></div>
            <p className="text-base font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              No properties found
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Try adjusting your filters
            </p>
          </div>
        )}
      </main>
      <MobileBar />
    </div>
  );
}

/* ─── Sub-components ─── */

function PropertyCard({ listing, onClick }: { listing: any; onClick: () => void }) {
  const [saved, setSaved] = useState(false);
  const primaryMedia = listing.media?.find((m: any) => m.isPrimary) ?? listing.media?.[0];
  const location = listing.locationJson as any;

  return (
    <article
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: 'var(--color-bg-elevated)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio: '16/9',
          overflow: 'hidden',
          background: 'var(--color-border-subtle)',
        }}
      >
        {primaryMedia?.url ? (
          <Image
            src={primaryMedia.url}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-400 hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--color-border-subtle)' }}
          >
            <Map className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSaved(!saved);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--color-bg-glass)',
              backdropFilter: 'var(--glass-blur-subtle)',
              border: '1px solid var(--color-border-glass)',
              color: saved ? 'var(--color-error)' : 'var(--color-text-inverse)',
            }}
          >
            <Heart className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--color-bg-glass)',
              backdropFilter: 'var(--glass-blur-subtle)',
              border: '1px solid var(--color-border-glass)',
              color: 'var(--color-text-inverse)',
            }}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        {/* Glass metadata strip */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2"
          style={{
            background: 'var(--color-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderTop: '1px solid var(--color-border-glass)',
          }}
        >
          <div
            className="flex items-baseline gap-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-text-accent)',
            }}
          >
            {listing.currency} {parseFloat(listing.price).toLocaleString()}
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                fontWeight: 400,
                color: 'var(--color-text-muted)',
              }}
            >
              / {listing.category === 'RENT' ? 'yr' : ''}
            </span>
          </div>
          <div
            className="text-xs flex items-center gap-2 mt-0.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {listing.metadata?.beds && <span>{listing.metadata.beds} bed</span>}
            {listing.metadata?.baths && <span>{listing.metadata.baths} bath</span>}
            {listing.metadata?.beds && '·'}
            <span>{location?.city ?? listing.locationJson?.city ?? ''}</span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3
          className="text-base font-semibold truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {listing.title}
        </h3>
        <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
          {location?.address ?? ''}
        </p>
        <div className="flex gap-1 mt-2 flex-wrap">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: '#DBEAFE', color: '#1D4ED8' }}
          >
            {listing.category}
          </span>
          {listing.verified && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: '#D1FAE5', color: '#065F46' }}
            >
              <Check className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-between pt-2 mt-2"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: 'var(--color-brand-secondary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              {listing.owner?.firstName?.[0]}
              {listing.owner?.lastName?.[0]}
            </div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {listing.owner?.firstName} {listing.owner?.lastName}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
            style={{
              background: 'var(--color-border-subtle)',
              color: 'var(--color-brand-secondary)',
            }}
          >
            Chat
          </button>
        </div>
      </div>
    </article>
  );
}

function PropertyCardHorizontal({ listing, onClick }: { listing: any; onClick: () => void }) {
  const primaryMedia = listing.media?.find((m: any) => m.isPrimary) ?? listing.media?.[0];
  const location = listing.locationJson as any;

  return (
    <article
      onClick={onClick}
      className="flex flex-col sm:flex-row rounded-xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: 'var(--color-bg-elevated)',
        boxShadow: 'var(--shadow-card)',
        maxHeight: '200px',
      }}
    >
      <div
        className="sm:w-[280px] min-w-[240px] shrink-0 relative"
        style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--color-border-subtle)' }}
      >
        {primaryMedia?.url ? (
          <Image
            src={primaryMedia.url}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Map className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} /></div>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1"
          style={{ background: 'var(--color-bg-glass)' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: 'var(--color-text-accent)',
            }}
          >
            {listing.currency} {parseFloat(listing.price).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="p-3 flex flex-col justify-center flex-1">
        <h3
          className="font-semibold text-base truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {listing.title}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {location?.address ?? location?.city ?? ''}
        </p>
        <div className="flex gap-1 mt-2">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: '#DBEAFE', color: '#1D4ED8' }}
          >
            {listing.category}
          </span>
          {listing.verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#D1FAE5', color: '#065F46' }}>
              <Check className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-between mt-2 pt-2"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{
                background: 'var(--color-brand-secondary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              {listing.owner?.firstName?.[0]}
              {listing.owner?.lastName?.[0]}
            </div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {listing.owner?.firstName}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)' }}>
      <div
        className="w-full animate-pulse"
        style={{
          aspectRatio: '16/9',
          background:
            'linear-gradient(90deg, var(--color-border-subtle) 25%, var(--color-bg-elevated) 50%, var(--color-border-subtle) 75%)',
          backgroundSize: '200% 100%',
        }}
      />
      <div className="p-3 space-y-2">
        <div
          className="h-3 rounded"
          style={{ background: 'var(--color-border-subtle)', width: '80%' }}
        />
        <div
          className="h-2 rounded"
          style={{ background: 'var(--color-border-subtle)', width: '50%' }}
        />
        <div
          className="h-2 rounded"
          style={{ background: 'var(--color-border-subtle)', width: '60%' }}
        />
      </div>
    </div>
  );
}
