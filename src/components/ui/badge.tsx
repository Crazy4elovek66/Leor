import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
}

export function Badge({ className, variant = 'primary', children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors select-none',
        {
          'bg-[#D8B4B0]/15 text-[#D8B4B0] border border-[#D8B4B0]/30': variant === 'accent',
          'bg-[#1D1D21] text-[#F5F5F7] border border-[#26262B]': variant === 'secondary',
          'bg-[#26262B] text-[#A1A1AA]': variant === 'primary',
          'border border-[#26262B] text-[#A1A1AA]': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
