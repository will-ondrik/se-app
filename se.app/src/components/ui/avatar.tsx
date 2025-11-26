'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}
