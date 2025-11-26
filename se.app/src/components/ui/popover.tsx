'use client';

import * as React from 'react';

export function Popover({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; }) {
  return <div>{children}</div>;
}
export function PopoverTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return <button {...props}>{children}</button>;
}
export function PopoverContent({ children, className = '', align, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end' }) {
  return <div className={className} {...props}>{children}</div>;
}
