'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className = '', side = 'top', children }: { className?: string; side?: any; children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Content side={side} className={className}>
      {children}
    </TooltipPrimitive.Content>
  );
}
