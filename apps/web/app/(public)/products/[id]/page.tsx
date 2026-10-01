'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Store } from 'lucide-react';
import { useProduct } from '@/hooks/use-catalog';
import { formatNaira } from '@/lib/catalog';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data: product, isLoading } = useProduct(params.id);

  if (isLoading) {
    return (
      <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-8">
        <div className="h-72 rounded-2xl skeleton" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Product not found</h1>
        <p className="text-sm text-muted-foreground mt-2">It may have been removed or renamed.</p>
        <Link href="/products" className="btn-primary mt-6 inline-flex">Back to products</Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-8 min-w-0">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent mb-6 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> All products
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="rounded-2xl overflow-hidden border border-[var(--color-border-glass)] shadow-glass min-w-0">
          <img src={product.image} alt={product.name} className="w-full h-72 lg:h-96 object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.category}</p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mt-1 leading-tight break-words">{product.name}</h1>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
            <Store className="w-4 h-4" /> {product.vendor}
          </p>
          <p className="font-display text-3xl font-bold text-[var(--color-text-accent)] mt-4">
            {formatNaira(product.price.amount, product.price.currency)}
          </p>
          <p className="text-base text-secondary mt-4 leading-relaxed">{product.description}</p>
          <p className={`inline-flex items-center gap-1.5 text-sm font-semibold mt-4 px-3 py-1.5 rounded-full ${product.inStock ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-error-bg)] text-[var(--color-error)]'}`}>
            <Check className="w-4 h-4" /> {product.inStock ? 'In stock' : 'Out of stock'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href={`/messages?product=${product.id}`} className="btn-primary flex-1 text-center">
              Contact vendor
            </Link>
            <Link href="/products" className="btn-secondary flex-1 text-center">
              Continue browsing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
