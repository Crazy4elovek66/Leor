import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]',
          {
            // Primary: Dusty Rose #D8B4B0, text dark #0F0F10
            'bg-[#D8B4B0] text-[#0F0F10] hover:bg-[#E5C5C1] shadow-sm font-semibold': variant === 'primary',
            // Secondary: Card elevated background with light text
            'bg-[#1D1D21] text-[#F5F5F7] hover:bg-[#26262B] border border-[#26262B]': variant === 'secondary',
            // Outline
            'border border-[#26262B] text-[#F5F5F7] hover:bg-[#17171A]': variant === 'outline',
            // Ghost
            'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#17171A]': variant === 'ghost',
            // Danger
            'bg-[#C97B7B]/15 text-[#C97B7B] border border-[#C97B7B]/30 hover:bg-[#C97B7B]/25': variant === 'danger',
          },
          {
            'h-9 px-3 text-xs rounded-xl': size === 'sm',
            'h-12 px-5 text-sm rounded-2xl': size === 'md',
            'h-14 px-6 text-base rounded-2xl font-medium': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
