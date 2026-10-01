'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Megaphone } from 'lucide-react';
import { useAdSlots } from '@/hooks/use-ads';

/**
 * Config-driven ad banner. Replaces the static stats strip: slots are served
 * from /api/v1/ads/slots (admin-managed, config fallback) and rotate
 * automatically. Includes an "Advertise here" entry point to the application flow.
 */
export function AdBanner() {
  const { data: slots, isLoading } = useAdSlots();
  const [index, setIndex] = useState(0);
  const active = (slots ?? []).filter((s) => s.active).sort((a, b) => a.displayOrder - b.displayOrder);
  const current = active.length > 0 ? active[index % active.length] : null;

  return (
    <section aria-label="Sponsored" className="w-full px-4 lg:px-10 py-8">
      <div className="max-w-[1120px] mx-auto">
        {isLoading && <div className="h-[180px] lg:h-[220px] rounded-2xl skeleton" />}
        {!isLoading && current && (
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-glass)] shadow-glass min-h-[180px] lg:min-h-[220px] flex">
            <img
              src={current.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
            <div className="relative flex-1 flex flex-col justify-center gap-2 p-6 lg:p-10 max-w-[640px]">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                <Megaphone className="w-3.5 h-3.5" /> Sponsored
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-white leading-tight">
                {current.title}
              </h2>
              <p className="text-white/80 text-sm lg:text-base">{current.subtitle}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Link
                  href={current.ctaHref}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:bg-[var(--color-brand-accent-alt)] transition-colors min-h-[44px]"
                >
                  {current.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/advertise" className="text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white">
                  Advertise here
                </Link>
              </div>
            </div>
            {active.length > 1 && (
              <div className="absolute bottom-4 right-5 flex gap-2">
                {active.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ad ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === index % active.length ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {!isLoading && !current && (
          <Link
            href="/advertise"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-strong p-8 text-sm font-semibold text-secondary hover:border-secondary transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            Your brand here — advertise on Homewolves
          </Link>
        )}
      </div>
    </section>
  );
}
