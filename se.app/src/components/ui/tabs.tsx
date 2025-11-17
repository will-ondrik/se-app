'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, children, className = '' }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex items-center gap-2 border rounded p-1', className)} {...props} />;
}

export function TabsTrigger({ value, children, className = '', ...props }: { value: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const active = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn('px-3 py-1 rounded', active ? 'bg-primary text-primary-foreground' : 'bg-transparent', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '', ...props }: { value: string } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  if (ctx.value !== value) return null;
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
