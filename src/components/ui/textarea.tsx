import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[100px] w-full rounded-2xl border border-[#26262B] bg-[#17171A] p-4 text-sm text-[#F5F5F7] placeholder-[#71717A] transition-colors focus:border-[#D8B4B0] focus:outline-none disabled:opacity-50 resize-none',
            error && 'border-[#C97B7B]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#C97B7B] font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
