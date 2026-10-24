'use client';

import Link from 'next/link';
import { Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { useBrand } from '@/hooks/use-platform-config';
import { FALLBACK_BRAND } from '@/config/fallbacks';

const footerNav = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Properties', href: '/properties' },
      { label: 'Products', href: '/products' },
      { label: 'Services', href: '/services' },
      { label: 'Advertise', href: '/advertise' },
    ],
  },
  {
    title: 'Navigation',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/homewolves', aria: 'Instagram' },
  { icon: Twitter, href: 'https://x.com/homewolves', aria: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/homewolves', aria: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/@homewolves', aria: 'YouTube' },
];

export function Footer() {
  const { data: brand } = useBrand();
  const companyName = brand?.companyName || FALLBACK_BRAND.companyName;
  const devCreditLabel = brand?.developerCreditLabel ?? FALLBACK_BRAND.developerCreditLabel;
  const devCreditUrl = brand?.developerCreditUrl ?? FALLBACK_BRAND.developerCreditUrl;
  const showDevCredit = Boolean(devCreditLabel && devCreditUrl);

  return (
    <footer
      // Extra bottom padding on mobile so the fixed mobile menu bar can
      // never cover the credit line at the end of the page scroll.
      className="w-full py-16 pb-32 lg:pt-20 lg:pb-20 px-4 lg:px-10 bg-[var(--color-bg-elevated)] border-t border-border"
      role="contentinfo"
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-16 mb-12">
          <div className="max-w-[260px]">
            <div className="mb-4">
              <BrandLogo size="md" />
            </div>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Africa&apos;s real estate operating system — connecting agents, buyers, developers,
              and homeowners with verified listings and seamless transactions.
            </p>
          </div>

          {/* Link columns stay in a 3-column grid from the smallest viewport. */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-16">
            {footerNav.map((col) => (
              <div key={col.title} className="min-w-0 lg:min-w-[140px]">
                <div className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {col.title}
                </div>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block font-body text-sm text-secondary py-1 transition-colors duration-fast hover:text-accent truncate lg:whitespace-normal"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="min-w-0 lg:min-w-[140px]">
            <div className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Social
            </div>
            <div className="flex gap-3">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.aria}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.aria}
                    className="w-10 h-10 rounded-full bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] grid place-items-center text-muted-foreground transition-all duration-fast hover:text-accent hover:border-accent"
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between pt-8 border-t border-[var(--color-border-subtle)] gap-6">
          <div className="text-xs text-muted-foreground order-2 lg:order-1 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center">
            <span>
              &copy; {new Date().getFullYear()} {companyName} Inc. All rights reserved.
            </span>
            {showDevCredit && (
              <a
                href={devCreditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors duration-fast hover:text-accent underline-offset-2 hover:underline"
              >
                {devCreditLabel}
              </a>
            )}
          </div>

          <div className="flex items-center gap-6 bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-lg px-6 py-4 shadow-glass order-1 lg:order-2">
            <div>
              <div className="font-body text-base font-semibold text-foreground">Go Pro</div>
              <div className="font-body text-sm text-muted-foreground">Unlock premium features</div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] bg-accent text-accent-foreground rounded-full shadow-sm hover:bg-[var(--color-brand-accent-alt)] hover:shadow-md hover:-translate-y-px px-4 py-1.5 text-xs"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
