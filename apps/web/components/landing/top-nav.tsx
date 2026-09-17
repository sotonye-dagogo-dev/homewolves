'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, X } from 'lucide-react';
import { HwButton } from '@/components/ui';

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const doSearch = () => {
    router.push(searchQuery.trim() ? `/properties?search=${encodeURIComponent(searchQuery.trim())}` : '/properties');
    setMobileOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[var(--bp-3xl,1920px)] h-14 lg:h-16 flex items-center justify-between px-4 lg:px-10 transition-[background] duration-normal ease-default ${
          scrolled || mobileOpen
            ? 'bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--color-border-glass)]'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 lg:gap-6">
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className={`lg:hidden w-10 h-10 rounded-full grid place-items-center transition-colors ${
              scrolled || mobileOpen ? 'text-foreground hover:bg-[var(--color-border-subtle)]' : 'text-white hover:bg-white/10'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link
            href="/"
            className={`font-display text-xl lg:text-2xl font-bold tracking-tight transition-colors duration-normal ${
              scrolled || mobileOpen ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-inverse)]'
            }`}
          >
            Homewolves
          </Link>

          <div
            className="hidden lg:flex items-center gap-2 bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-full px-4 py-1 w-[280px] xl:w-[320px] focus-within:w-[360px] xl:focus-within:w-[400px] transition-[width] duration-normal ease-default"
            role="search"
          >
            <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
            <input
              type="text"
              placeholder="Search properties..."
              aria-label="Search properties"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSearch();
              }}
              className={`flex-1 bg-transparent border-none outline-none font-body text-sm py-1 placeholder:transition-colors ${
                scrolled ? 'text-foreground placeholder:text-muted-foreground' : 'text-[var(--color-text-inverse)] placeholder:text-white/50'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <Link
            href="/properties"
            className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
              scrolled ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]' : 'text-white/80 hover:text-white'
            }`}
          >
            Properties
          </Link>
          <Link
            href="/pricing"
            className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
              scrolled ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]' : 'text-white/80 hover:text-white'
            }`}
          >
            Pricing
          </Link>
          <HwButton variant="primary" size="sm" className="hidden lg:inline-flex" onClick={() => router.push('/dashboard/agent/listings/new')}>
            Post Property
          </HwButton>

          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className={`w-10 h-10 rounded-full grid place-items-center transition-colors duration-fast ${
              scrolled || mobileOpen ? 'text-foreground hover:bg-[var(--color-border-subtle)]' : 'text-[var(--color-text-inverse)] hover:bg-white/10'
            }`}
          >
            <Bell className="w-5 h-5" />
          </Link>

          <Link
            href="/dashboard/client"
            className="w-9 h-9 rounded-full bg-accent grid place-items-center text-inverse text-xs font-semibold border-2 border-transparent hover:border-accent transition-colors duration-fast shrink-0"
            aria-label="Profile"
          >
            HW
          </Link>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99] lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button aria-label="Close menu backdrop" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 left-0 right-0 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] shadow-xl p-4 flex flex-col gap-3 max-h-[calc(100dvh-56px)] overflow-y-auto">
            <div className="flex items-center gap-2 rounded-full px-4 py-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-default)]" role="search">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search properties..."
                aria-label="Search properties"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
              <button onClick={doSearch} className="text-sm font-semibold text-accent shrink-0">
                Search
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/properties" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Properties
              </Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Pricing
              </Link>
              <Link href="/blog" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Blog
              </Link>
              <Link href="/messages" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Messages
              </Link>
            </div>
            <Link href="/dashboard/agent/listings/new" onClick={() => setMobileOpen(false)} className="w-full text-center rounded-full py-3 text-sm font-semibold bg-accent text-accent-foreground">
              Post Property
            </Link>
            <div className="flex gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <Link href="/about" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 text-secondary">
                About
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 text-secondary">
                Contact
              </Link>
              <Link href="/faq" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 text-secondary">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
