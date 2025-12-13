'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

// Minimal dialog implementation with context + portal overlay
// Supports controlled (open/onOpenChange) and uncontrolled usage

type DialogCtx = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogCtx | undefined>(undefined);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error('Dialog components must be used within <Dialog>');
  }
  return ctx;
}

export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? Boolean(controlledOpen) : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const value = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const { setOpen } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        child.props?.onClick?.(e);
        (props as any)?.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button
      {...props}
      onClick={(e) => {
        (props as any)?.onClick?.(e);
        setOpen(true);
      }}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDialogContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  if (!mounted || !open) return null;

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-50 w-[95%] max-w-lg rounded-md bg-background p-6 shadow-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

export function DialogHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function DialogDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 flex items-center justify-end gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
