'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ className = '', value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full h-2 bg-muted rounded', className)} {...props}>
      <div className="h-full bg-primary rounded" style={{ width: `${clamped}%` }} />
    </div>
  );
}
