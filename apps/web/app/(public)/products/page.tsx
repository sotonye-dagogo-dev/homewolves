'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Search } from 'lucide-react';
import { useProducts } from '@/hooks/use-catalog';
import { formatNaira } from '@/lib/catalog';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><p className="text-secondary">Loading products…</p></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') ?? '';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const { data: products, isLoading } = useProducts();

  const categories = useMemo(() => {
    const set = new Set((products ?? []).map((p) => p.category));
    return ['', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (category && p.category !== category) return false;
      if (q && !(p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q))) return false;
      return p.active;
    });
  }, [products, query, category]);

  return (
    <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-8 lg:py-12 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-11 h-11 rounded-md bg-accent text-accent-foreground grid place-items-center shrink-0">
          <Package className="w-6 h-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Building materials &amp; accessories from verified vendors</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-4">
        <label className="flex-1 flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-white px-4 min-h-[48px]">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cement, tiles, doors…"
            aria-label="Search products"
            className="flex-1 bg-transparent outline-none text-base min-w-0"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-full border border-[var(--color-border-default)] bg-white px-4 min-h-[48px] text-sm font-semibold min-w-0"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <option value="">All categories</option>
          {categories.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl skeleton" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-foreground font-semibold">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or category.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="rounded-xl overflow-hidden border border-[var(--color-border-glass)] bg-[var(--color-bg-glass)] shadow-card hover:shadow-hover hover:-translate-y-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="relative h-44 w-full overflow-hidden bg-[var(--color-border-subtle)]">
              <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
              {p.featured && (
                <span className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                  Featured
                </span>
              )}
              {!p.inStock && (
                <span className="absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 text-white">
                  Out of stock
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{p.category} · {p.vendor}</p>
              <h2 className="font-body text-base font-semibold text-foreground mt-1 leading-snug">{p.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
              <p className="font-display text-lg font-bold text-[var(--color-text-accent)] mt-2">
                {formatNaira(p.price.amount, p.price.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
