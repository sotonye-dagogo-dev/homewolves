'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import {
  FORM_FIELD_ERROR_CLASS,
  formFieldClassName,
  type FormFieldConfig,
} from './form-field-config';

interface HwInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Legacy pill/glass search styling. Kept for backward compatibility —
   * prefer `config={{ tone, radius }}` for new code.
   */
  glass?: boolean;
  /** Config-driven styling override (radius/tone). Falls back to FALLBACK_FORM_FIELD. */
  config?: FormFieldConfig;
  /** Error message rendered below the field (also sets aria-invalid). */
  error?: string;
}

const HwInput = forwardRef<HTMLInputElement, HwInputProps>(
  ({ className, glass, config, error, style, ...props }, ref) => {
    return (
      <>
        <input
          ref={ref}
          aria-invalid={error ? true : props['aria-invalid']}
          className={cn(formFieldClassName(config, glass), className)}
          style={style}
          {...props}
        />
        {error ? <p role="alert" className={FORM_FIELD_ERROR_CLASS}>{error}</p> : null}
      </>
    );
  },
);
HwInput.displayName = 'HwInput';

export { HwInput };
export type { HwInputProps };
