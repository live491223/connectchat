import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  count?: number;
  variant?: 'primary' | 'destructive' | 'secondary';
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ count, variant = 'primary', className, children }: BadgeProps) {
  if (count !== undefined && count <= 0) return null;

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground font-semibold',
    destructive: 'bg-destructive text-destructive-foreground font-semibold',
    secondary: 'bg-secondary text-secondary-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full shadow-sm select-none',
        variantStyles[variant],
        className
      )}
    >
      {count !== undefined ? (count > 99 ? '99+' : count) : children}
    </span>
  );
}
