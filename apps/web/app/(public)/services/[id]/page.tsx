'use client';

import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { useService } from '@/hooks/use-catalog';
import { formatNaira } from '@/lib/catalog';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const { data: service, isLoading } = useService(params.id);

  if (isLoading) {
    return (
      <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-8">
        <div className="h-72 rounded-2xl skeleton" />
      </main>
    );
  }

  if (!service) {
    return (
      <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Service not found</h1>
        <p className="text-sm text-muted-foreground mt-2">It may have been removed or renamed.</p>
        <Link href="/services" className="btn-primary mt-6 inline-flex">Back to services</Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1120px] mx-auto px-4 lg:px-10 py-8 min-w-0">
      <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent mb-6 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> All services
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="rounded-2xl overflow-hidden border border-[var(--color-border-glass)] shadow-glass min-w-0">
          <img src={service.image} alt={service.name} className="w-full h-72 lg:h-96 object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{service.category}</p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mt-1 leading-tight break-words">{service.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">by {service.provider}</p>
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-secondary mt-2">
            <Star className="w-4 h-4 fill-current text-accent" /> {service.rating.toFixed(1)} rated
          </p>
          <p className="font-display text-3xl font-bold text-[var(--color-text-accent)] mt-4">
            From {formatNaira(service.priceFrom.amount, service.priceFrom.currency)}
          </p>
          <p className="text-base text-secondary mt-4 leading-relaxed">{service.description}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href={`/messages?service=${service.id}`} className="btn-primary flex-1 text-center">
              Request this service
            </Link>
            <Link href="/services" className="btn-secondary flex-1 text-center">
              Browse services
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
