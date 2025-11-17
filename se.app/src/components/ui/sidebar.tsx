'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';

type SidebarContextType = { open: boolean; setOpen: (v: boolean) => void };
const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export function Sidebar({ className = '', collapsible, ...props }: React.HTMLAttributes<HTMLDivElement> & { collapsible?: 'icon' | 'off' }) {
  const { open } = useSidebar();
  return (
    <aside
      data-open={open}
      className={cn(
        'border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground w-64 data-[open=false]:w-16 transition-[width,background-color] duration-300 ease-in-out backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 shadow-lg/10',
        className
      )}
      {...props}
    />
  );
}

export function SidebarContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-2', className)} {...props} />;
}

export function SidebarGroup({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-2', className)} {...props} />;
}
export function SidebarGroupLabel({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1 text-[10px] tracking-wider uppercase text-muted-foreground', className)} {...props} />;
}
export function SidebarGroupContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1', className)} {...props} />;
}

export function SidebarMenu({ className = '', ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('space-y-1', className)} {...props} />;
}
export function SidebarMenuItem({ className = '', ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('', className)} {...props} />;
}
export function SidebarMenuButton({ className = '', asChild = false, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  if (asChild) return <button className={cn('w-full text-left', className)} {...(props as any)} />;
  return <button className={cn('w-full text-left', className)} {...props} />;
}
export function SidebarMenuSub({ className = '', ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('ml-6 mt-1 space-y-1', className)} {...props} />;
}
export function SidebarMenuSubItem({ className = '', ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('', className)} {...props} />;
}
export function SidebarMenuSubButton({ className = '', asChild = false, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  if (asChild) return <button className={cn('w-full text-left text-sm', className)} {...(props as any)} />;
  return <button className={cn('w-full text-left text-sm', className)} {...props} />;
}

export function SidebarTrigger({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors', className)}
      {...props}
      aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}
