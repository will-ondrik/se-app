'use client';

import * as React from 'react';
import { Controller, FormProvider } from 'react-hook-form';
import { cn } from '@/lib/utils';

// Minimal shadcn-style form primitives to support legacy pages

export function Form({ children, ...formProps }: any) {
  return <FormProvider {...formProps}>{children}</FormProvider>;
}

// Thin wrapper around RHF Controller with relaxed types to avoid generic constraints issues
export function FormField({
  control,
  name,
  render,
}: {
  control: any;
  name: string;
  render: (args: any) => React.ReactElement;
}) {
  return <Controller control={control} name={name as any} render={render as any} />;
}

export function FormItem({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}

export function FormLabel({
  className = '',
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('text-sm font-medium leading-none', className)} {...props}>
      {children}
    </label>
  );
}

export function FormControl({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

// Basic message component; shows nothing by default (RHF errors can be wired later)
export function FormMessage({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn('text-sm text-destructive', className)} {...props}>
      {children}
    </p>
  );
}
