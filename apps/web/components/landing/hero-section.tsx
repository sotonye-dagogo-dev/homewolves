'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  return (
    <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden" role="banner">
      <Image
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2560&q=80"
        alt="Beautiful African property"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/65" />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 lg:pb-20 px-4 lg:px-10">
        <h1 className="font-display text-hero font-bold text-[var(--color-text-inverse)] leading-tight text-center max-w-[800px] mb-4">
          Discover Your Next Home in Africa
        </h1>
        <p className="font-body text-lg text-white/85 leading-snug text-center max-w-[560px] mb-8">
          Verified properties, trusted agents, and seamless transactions across the continent.
        </p>
        <form
          action="/properties"
          method="GET"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(
              query.trim()
                ? `/properties?search=${encodeURIComponent(query.trim())}`
                : '/properties',
            );
          }}
          className="flex items-center gap-3 bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border border-[var(--color-border-glass)] rounded-full px-6 py-3 shadow-glass w-full max-w-[560px]"
        >
          <Search className="w-5 h-5 text-white/70 shrink-0" aria-hidden="true" />
          <input
            type="text"
            name="search"
            placeholder="Search by city, property type, or agent..."
            aria-label="Search properties"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-body text-base text-[var(--color-text-inverse)] placeholder:text-white/55 py-2"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 border-none rounded-full bg-accent text-accent-foreground font-body text-base font-semibold shrink-0 hover:bg-[var(--color-brand-accent-alt)] transition-colors duration-fast"
          >
            Search
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
