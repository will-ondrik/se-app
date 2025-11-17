"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CollapsibleContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onOpenChange?: (v: boolean) => void;
};

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null);

export function Collapsible({
  open,
  onOpenChange,
  className = "",
  children,
}: {
  open: boolean;
  onOpenChange?: (v: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(open);

  React.useEffect(() => setInternalOpen(open), [open]);

  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <CollapsibleContext.Provider value={{ open: internalOpen, setOpen, onOpenChange }}>
      <div className={cn("data-[state=open]:[&_.collapsible-content]:block", className)} data-state={internalOpen ? "open" : "closed"}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger({ asChild = false, className = "", children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) throw new Error("CollapsibleTrigger must be used within Collapsible");
  const { open, setOpen } = ctx;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e as any);
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick: handleClick,
      className: cn(className, (children as any).props?.className),
    });
  }

  return (
    <button type="button" className={cn(className)} onClick={handleClick} {...props} />
  );
}

export function CollapsibleContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) throw new Error("CollapsibleContent must be used within Collapsible");
  const { open } = ctx;
  return (
    <div
      className={cn("collapsible-content hidden data-[state=open]:block", className)}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  );
}
