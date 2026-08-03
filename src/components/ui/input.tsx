import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-[#A1A1AA] uppercase tracking-wider truncate">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-2xl border border-[#26262B] bg-[#17171A] px-4 py-2 text-sm text-[#F5F5F7] placeholder-[#71717A] transition-colors focus:border-[#D8B4B0] focus:outline-none disabled:opacity-50',
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

Input.displayName = 'Input';
