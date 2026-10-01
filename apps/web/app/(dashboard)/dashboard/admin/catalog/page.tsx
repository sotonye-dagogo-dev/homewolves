'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useProducts, useServices } from '@/hooks/use-catalog';
import { formatNaira } from '@/lib/catalog';

/**
 * Admin catalogue management (config-driven).
 * The live catalogue is served from platform config with built-in fallbacks;
 * this screen shows the effective catalogue and links to the config source.
 * Full CRUD lands when the config service exposes write APIs — until then the
 * table reflects exactly what shoppers see, with active/featured flags visible.
 */
export default function AdminCatalogPage() {
  const { data: products, isLoading: loadingP } = useProducts();
  const { data: services, isLoading: loadingS } = useServices();

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto min-w-0">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent mb-4 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> Admin dashboard
      </Link>
      <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-brand-primary)' }}>
        Products &amp; Services
      </h1>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
        Config-driven catalogue. Served from <code>config/products</code>, <code>config/services</code> with
        built-in fallbacks so the storefront never goes blank. Toggle flags in platform config to
        feature or hide items.
      </p>

      <h2 className="font-display text-xl font-bold mt-8 mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Products ({products?.length ?? 0})
      </h2>
      {loadingP ? (
        <div className="h-24 rounded-xl skeleton" />
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr>
                {['Name', 'Category', 'Price', 'Vendor', 'Stock', 'Featured'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    <Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.category}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--color-text-primary)' }}>{formatNaira(p.price.amount, p.price.currency)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.vendor}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full"
                      style={p.inStock
                        ? { background: 'var(--color-success-bg)', color: 'var(--color-success)' }
                        : { background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                      {p.inStock ? 'In stock' : 'Out of stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.featured ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-display text-xl font-bold mt-8 mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Services ({services?.length ?? 0})
      </h2>
      {loadingS ? (
        <div className="h-24 rounded-xl skeleton" />
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr>
                {['Name', 'Category', 'From', 'Provider', 'Rating', 'Featured'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(services ?? []).map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    <Link href={`/services/${s.id}`} className="hover:underline">{s.name}</Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{s.category}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--color-text-primary)' }}>{formatNaira(s.priceFrom.amount, s.priceFrom.currency)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{s.provider}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{s.rating.toFixed(1)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{s.featured ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
