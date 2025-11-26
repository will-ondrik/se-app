'use client';

import * as React from 'react';

// Minimal stubs for a Command UI component set used in the KPI dashboard
// These provide typing and very basic structure so the app can build.

export function Command({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CommandInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className} {...props} />;
}

export function CommandList({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CommandEmpty({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CommandGroup({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CommandItem({ children, className = '', onSelect, value, ...props }: Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> & { onSelect?: (value: string) => void; value?: string; }) {
  return (
    <div
      className={className}
      onClick={() => onSelect?.(value ?? '')}
      role="option"
      {...props}
    >
      {children}
    </div>
  );
}
