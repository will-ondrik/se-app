'use client';

import * as React from 'react';

export interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from?: Date; to?: Date };
  onSelect?: (value: any) => void;
  initialFocus?: boolean;
  className?: string;
  numberOfMonths?: number;
}

// Minimal stub calendar for typing/usage compatibility
export function Calendar({ className = '', children, ...props }: CalendarProps & { children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
