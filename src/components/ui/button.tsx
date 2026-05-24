'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const variantStyles = {
  default:
    'bg-accent-brand text-inverse hover:bg-accent-brand-hover focus-visible:ring-accent-brand',
  primary:
    'bg-accent-brand text-inverse hover:bg-accent-brand-hover focus-visible:ring-accent-brand',
  destructive:
    'bg-accent-red text-white hover:bg-red-400 focus-visible:ring-accent-red',
  danger:
    'bg-accent-red text-white hover:bg-red-400 focus-visible:ring-accent-red',
  outline:
    'border border-borderStrong bg-transparent text-primary hover:bg-elevated focus-visible:ring-borderFocus',
  secondary:
    'bg-elevated text-primary hover:bg-elevated-hover focus-visible:ring-borderFocus',
  ghost:
    'bg-transparent text-secondary hover:bg-elevated hover:text-primary focus-visible:ring-borderFocus',
  link:
    'bg-transparent text-accent-brand underline-offset-4 hover:underline focus-visible:ring-borderFocus',
};

const sizeStyles = {
  default: 'px-4 py-2 text-sm rounded-2xl gap-2',
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-2xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
  icon: 'h-10 w-10 rounded-full',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };
