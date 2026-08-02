import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0..100
}

export function Progress({ className, value, ...props }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-[#26262B]', className)}
      {...props}
    >
      <div
        className="h-full bg-[#D8B4B0] transition-all duration-300 ease-out rounded-full"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
