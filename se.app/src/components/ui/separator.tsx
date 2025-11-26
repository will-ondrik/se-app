'use client';

import * as React from 'react';

export function Separator({ className = '', orientation = 'horizontal', decorative = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical'; decorative?: boolean }) {
  const style: React.CSSProperties =
    orientation === 'vertical'
      ? { width: 1, height: '100%' }
      : { height: 1, width: '100%' };

  return <div role={decorative ? 'none' : 'separator'} aria-orientation={orientation} className={className} style={{ backgroundColor: 'currentColor', opacity: 0.1, ...style }} {...props} />;
}
