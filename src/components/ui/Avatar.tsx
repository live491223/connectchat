'use client';

import React, { useState } from 'react';
import { cn, getInitials, getAvatarGradient } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-12 h-12 text-base font-semibold',
  xl: 'w-16 h-16 text-lg font-bold',
  '2xl': 'w-20 h-20 text-xl font-bold',
};

const statusSizes = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-1.5',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
  '2xl': 'w-5 h-5 ring-3',
};

export function Avatar({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showStatus = false,
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const gradient = getAvatarGradient(name);

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none items-center justify-center', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full overflow-hidden text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform',
          sizeClasses[size]
        )}
      >
        {src && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-tr font-medium', gradient)}>
            {initials}
          </div>
        )}
      </div>

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-background z-10',
            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500',
            statusSizes[size]
          )}
        >
          {isOnline && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          )}
        </span>
      )}
    </div>
  );
}
