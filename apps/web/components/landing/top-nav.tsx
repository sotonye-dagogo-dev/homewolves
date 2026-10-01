'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, X } from 'lucide-react';
import { HwButton } from '@/components/ui';
import { BrandLogo } from '@/components/shared/brand-logo';
import { useRequireAuth } from '@/hooks/use-require-auth';

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { requireAuth } = useRequireAuth('/dashboard/agent/listings/new');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <div className="flex items-center gap-2 lg:gap-6 min-w-0">
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className={`lg:hidden w-10 h-10 rounded-full grid place-items-center transition-colors shrink-0 ${
              scrolled || mobileOpen ? 'text-foreground hover:bg-[var(--color-border-subtle)]' : 'text-white hover:bg-white/10'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link
            href="/"
            aria-label="Homewolves home"
            className="flex items-center min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className={scrolled || mobileOpen ? '[&>span>span:last-child]:!text-[var(--color-brand-primary)]' : '[&>span>span:last-child]:!text-white'}>
              <BrandLogo size="sm" />
            </span>
          </Link>

        </div>

        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <Link
            href="/properties"
            className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
              scrolled ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]' : 'text-white/80 hover:text-white'
            }`}
          >
            Properties
          </Link>
          <Link
            href="/products"
            className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
              scrolled ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]' : 'text-white/80 hover:text-white'
            }`}
          >
            Products
          </Link>
          <Link
            href="/services"
            className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
              scrolled ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]' : 'text-white/80 hover:text-white'
            }`}
          >
            Services
          </Link>
          <Link
            href="/pricing"
            className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
              scrolled ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]' : 'text-white/80 hover:text-white'
            }`}
          >
            Pricing
          </Link>
          <HwButton variant="primary" size="sm" className="hidden lg:inline-flex" onClick={() => { if (requireAuth('Posting a property')) router.push('/dashboard/agent/listings/new'); }}>
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
            <div className="grid grid-cols-2 gap-2">
              <Link href="/properties" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Properties
              </Link>
              <Link href="/products" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Products
              </Link>
              <Link href="/services" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Services
              </Link>
              <Link href="/advertise" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-center">
                Advertise
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
            <button onClick={() => { setMobileOpen(false); if (requireAuth('Posting a property')) router.push('/dashboard/agent/listings/new'); }} className="w-full text-center rounded-full py-3 text-sm font-semibold bg-accent text-accent-foreground">
              Post Property
            </button>
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
