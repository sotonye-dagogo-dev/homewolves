'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import {
  FORM_FIELD_ERROR_CLASS,
  formFieldClassName,
  type FormFieldConfig,
} from './form-field-config';

interface HwTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Config-driven styling override (radius/tone). Falls back to FALLBACK_FORM_FIELD. */
  config?: FormFieldConfig;
  /** Error message rendered below the field (also sets aria-invalid). */
  error?: string;
}

const HwTextarea = forwardRef<HTMLTextAreaElement, HwTextareaProps>(
  ({ className, config, error, style, ...props }, ref) => {
    return (
      <>
        <textarea
          ref={ref}
          aria-invalid={error ? true : props['aria-invalid']}
          className={cn(formFieldClassName(config), 'resize-y', className)}
          style={style}
          {...props}
        />
        {error ? <p role="alert" className={FORM_FIELD_ERROR_CLASS}>{error}</p> : null}
      </>
    );
  },
);
HwTextarea.displayName = 'HwTextarea';

export { HwTextarea };
export type { HwTextareaProps };
