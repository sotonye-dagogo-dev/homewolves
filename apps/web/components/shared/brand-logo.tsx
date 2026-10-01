'use client';

import { useState } from 'react';
import { useBrand } from '@/hooks/use-platform-config';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  dark?: boolean;
  className?: string;
}

const SIZES = {
  sm: { img: 'h-7 w-7', text: 'text-lg' },
  md: { img: 'h-8 w-8', text: 'text-xl' },
  lg: { img: 'h-12 w-12', text: 'text-xl' },
} as const;

/**
 * Platform-wide brand logo. Renders the configured /logo.png image as a
 * rounded mark; the text name is ONLY a fallback when no logo URL is
 * configured or the image fails to load (never rendered behind the image).
 */
export function BrandLogo({ size = 'md', showName = true, className = '' }: BrandLogoProps) {
  const { data: brand } = useBrand();
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = brand?.logoUrl || '/logo.png';
  const companyName = brand?.companyName || 'Homewolves';
  const showImg = Boolean(logoUrl) && !imgFailed;
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      {showImg ? (
        <img
          src={logoUrl}
          alt={companyName}
          width={48}
          height={48}
          className={`${s.img} rounded-full object-cover shrink-0 bg-white ring-1 ring-black/10`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${s.img} rounded-full grid place-items-center shrink-0 bg-accent text-accent-foreground text-xs font-bold`}
        >
          HW
        </span>
      )}
      {showName && (
        <span className={`font-display font-bold tracking-tight truncate text-[var(--color-brand-primary)] ${s.text}`}>
          {companyName}
        </span>
      )}
    </span>
  );
}
