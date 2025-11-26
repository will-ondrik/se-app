'use client';

import * as React from 'react';

// Minimal type surface used by src/hooks/use-toast.ts
export type ToastActionElement = React.ReactNode;

export type ToastProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  // Optional styling hint used by various components
  variant?: 'default' | 'destructive';
};

// Optional: placeholder components if you later want to render a custom toast UI.
export function ToastContainer(): null {
  return null;
}
