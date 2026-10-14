'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import {
  FORM_FIELD_ERROR_CLASS,
  formFieldClassName,
  type FormFieldConfig,
} from './form-field-config';

export interface HwSelectOption {
  value: string;
  label: string;
}

interface HwSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Config-driven styling override (radius/tone). Falls back to FALLBACK_FORM_FIELD. */
  config?: FormFieldConfig;
  /** Error message rendered below the field (also sets aria-invalid). */
  error?: string;
}

/**
 * HwSelect — design-token select with opaque, high-contrast native options.
 * Option legibility is enforced globally (globals.css `select option` rules);
 * this wrapper only guarantees the closed field itself uses the same tokens.
 */
const HwSelect = forwardRef<HTMLSelectElement, HwSelectProps>(
  ({ className, config, error, children, style, ...props }, ref) => {
    return (
      <>
        <select
          ref={ref}
          aria-invalid={error ? true : props['aria-invalid']}
          className={cn(formFieldClassName(config), 'pr-10 cursor-pointer', className)}
          style={{ colorScheme: 'light', ...style }}
          {...props}
        >
          {children}
        </select>
        {error ? <p role="alert" className={FORM_FIELD_ERROR_CLASS}>{error}</p> : null}
      </>
    );
  },
);
HwSelect.displayName = 'HwSelect';

export { HwSelect };
export type { HwSelectProps };
