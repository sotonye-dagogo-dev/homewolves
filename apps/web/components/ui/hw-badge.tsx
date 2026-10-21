import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hwBadgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        sale: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
        rent: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        verified: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        pending: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        default: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface HwBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof hwBadgeVariants> {}

function HwBadge({ className, variant, ...props }: HwBadgeProps) {
  return (
    <span className={cn(hwBadgeVariants({ variant, className }))} {...props} />
  );
}

export { HwBadge, hwBadgeVariants };
export type { HwBadgeProps };
