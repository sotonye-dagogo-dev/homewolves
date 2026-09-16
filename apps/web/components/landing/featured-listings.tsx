'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useListings } from '@/hooks/use-listings';
import { ArrowRight, MapPin, BedDouble, Bath, Star } from 'lucide-react';

function currencyLabel(price: string, currency: string, category: string) {
  const n = parseFloat(price);
  if (Number.isNaN(n)) return `${currency} ${price}`;
  const formatted = n.toLocaleString('en-NG');
  if (category === 'RENT') return `${currency} ${formatted}/yr`;
  if (category === 'SHORTLET') return `${currency} ${formatted}/night`;
  return `${currency} ${formatted}`;
}

export function FeaturedListings() {
  const { data, isLoading } = useListings({ take: '6' });
  const listings: any[] = data?.listings ?? [];

  // Fallback when still loading or empty — show skeletons/empty
  if (isLoading) {
    return (
      <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Featured listings">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex items-center justify-between mb-8 lg:mb-10 gap-4">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight">Featured Properties</h2>
            <span className="text-sm text-muted-foreground">Loading…</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] animate-pulse">
                <div className="aspect-[16/10] bg-[var(--color-border-subtle)]" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-1/2 bg-[var(--color-border-subtle)] rounded" />
                  <div className="h-3 w-3/4 bg-[var(--color-border-subtle)] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Featured listings">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 lg:mb-10">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight">Featured Properties</h2>
            <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-xl border border-dashed border-[var(--color-border-default)] p-10 text-center bg-[var(--color-bg-elevated)]">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">No featured properties yet</p>
            <p className="text-xs mt-1 text-[var(--color-text-tertiary)]">Check back soon or browse all properties.</p>
            <Link href="/properties" className="inline-flex mt-4 px-5 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold">Explore properties</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Featured listings">
      <div className="max-w-[1120px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 lg:mb-10">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight">Featured Properties</h2>
          <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.slice(0, 6).map((l) => {
            const media = l.media?.[0];
            const loc = l.locationJson ?? {};
            return (
              <Link
                key={l.id}
                href={`/properties/${l.id}`}
                className="group rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-card hover:shadow-hover hover:-translate-y-1 transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-border-subtle)]">
                  {media?.url ? (
                    <Image src={media.url} alt={l.title} fill sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground"><MapPin className="w-8 h-8" /></div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/95 text-foreground shadow-sm">{l.category}</span>
                    {l.verified && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  {l.featured && (
                    <span className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-500 text-white">Featured</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="font-display text-lg font-bold text-[var(--color-text-accent)] leading-tight">
                    {currencyLabel(l.price, l.currency ?? 'NGN', l.category)}
                  </div>
                  <h3 className="text-sm font-semibold truncate mt-1 text-foreground group-hover:underline">{l.title}</h3>
                  <p className="text-xs mt-1 flex items-center gap-1 text-muted-foreground truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {loc.address ?? ((`${loc.city ?? ''} ${loc.area ?? ''}`.trim()) || '—')}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {l.metadata?.beds != null && (
                      <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {l.metadata.beds} bd</span>
                    )}
                    {l.metadata?.baths != null && (
                      <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {l.metadata.baths} ba</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                    <div className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold bg-primary text-primary-foreground shrink-0">
                      {l.owner?.firstName?.[0] ?? 'H'}{l.owner?.lastName?.[0] ?? ''}
                    </div>
                    <span className="text-xs font-medium text-secondary truncate">{l.owner?.firstName} {l.owner?.lastName}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
