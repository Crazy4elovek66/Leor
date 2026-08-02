import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ className, src, name, size = 'md', ...props }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'L';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden bg-[#26262B] border border-[#26262B] shrink-0 text-[#F5F5F7] font-semibold select-none',
        {
          'w-8 h-8 text-xs': size === 'sm',
          'w-12 h-12 text-sm': size === 'md',
          'w-16 h-16 text-base': size === 'lg',
          'w-24 h-24 text-xl': size === 'xl',
        },
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
