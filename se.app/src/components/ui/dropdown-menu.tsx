'use client';

import * as React from 'react';

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
export function DropdownMenuTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return <button {...props}>{children}</button>;
}
export function DropdownMenuContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
export function DropdownMenuItem({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
export function DropdownMenuLabel({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
export function DropdownMenuSeparator() {
  return <div style={{ height: 1, background: 'var(--border)' }} />;
}
