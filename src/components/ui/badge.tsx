'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Flat tinted chips — no visible border on colored variants. Background tint
// is bumped slightly to keep contrast now that the outline is gone, giving the
// ChatGPT-style "soft pill" look instead of a hard outlined box.
const variantStyles = {
  green: 'bg-accent-green/20 text-accent-green',
  red: 'bg-accent-red/20 text-accent-red',
  amber: 'bg-accent-amber/20 text-accent-amber',
  blue: 'bg-accent-blue/20 text-accent-blue',
  gray: 'bg-elevated text-secondary',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
}

function Badge({ className, variant = 'gray', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, type BadgeProps };
