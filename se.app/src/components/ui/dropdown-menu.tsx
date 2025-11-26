'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error('DropdownMenu components must be used within <DropdownMenu>');
  }
  return ctx;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!contentRef.current || !triggerRef.current) return;
      if (contentRef.current.contains(t) || triggerRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const value = React.useMemo(
    () => ({ open, setOpen, triggerRef, contentRef }),
    [open]
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      <div style={{ display: 'inline-block' }}>{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger(
  { asChild, children, ...props }: { asChild?: boolean; children: React.ReactElement<any> } & React.HTMLAttributes<HTMLElement>
) {
  const { open, setOpen, triggerRef } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    // If we toggled on mousedown, avoid double-toggling on click.
    props.onClick?.(e as any);
    e.preventDefault();
    e.stopPropagation();
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    // Toggle early on mousedown so outside-click doesn't immediately close.
    props.onMouseDown?.(e as any);
    if (e.defaultPrevented) return;
    e.stopPropagation();
    setOpen((o) => !o);
  };
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Fallback to ensure outer mousedown/outside-click doesn't immediately close.
    props.onPointerDown?.(e as any);
    if (e.defaultPrevented) return;
    e.stopPropagation();
    // Do not toggle here; rely on click handler to toggle. This avoids double-toggling.
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as any,
      {
        ref: (node: HTMLElement) => {
          // Merge user ref if present
          const childRef = (children as any).ref;
          if (typeof childRef === 'function') childRef(node);
          else if (childRef && typeof childRef === 'object') childRef.current = node;
          (triggerRef as any).current = node;
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        onPointerDown: handlePointerDown,
        ...props,
      } as any
    );
  }

  return (
    <button
      {...props}
      ref={triggerRef as any}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
      type="button"
    >
      {children}
    </button>
  );
}

// Allow common props like `align`, `side`, `sideOffset` for compatibility with usage patterns
type DropdownMenuContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
};

export function DropdownMenuContent({
  children,
  className = '',
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
  style,
  ...props
}: DropdownMenuContentProps) {
  const { open, triggerRef, contentRef } = useDropdownMenu();
  const [position, setPosition] = React.useState<{ top: number; left: number; transform?: string }>({
    top: 0,
    left: 0,
    transform: undefined,
  });

  const updatePosition = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    const contentEl = contentRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();

    // Measure content size if available (use sensible defaults on first paint)
    const width = contentEl?.offsetWidth ?? 320;
    const height = contentEl?.offsetHeight ?? 200;

    // Vertical position (bottom by default)
    let top = rect.bottom + sideOffset;
    if (side === 'top') {
      top = rect.top - sideOffset - height;
    }

    // Horizontal position with alignment (avoid relying on transform to reduce overflow issues)
    let left = rect.left;
    if (align === 'end') {
      left = rect.right - width;
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - width / 2;
    } // start -> rect.left

    // Clamp within viewport with small padding
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (width) {
      left = Math.max(pad, Math.min(left, vw - width - pad));
    }
    if (height) {
      top = Math.max(pad, Math.min(top, vh - height - pad));
    }

    setPosition({ top, left, transform: undefined });
  }, [triggerRef, contentRef, side, sideOffset, align]);

  React.useEffect(() => {
    if (!open) return;
    // Position after content mounts
    const raf = requestAnimationFrame(() => updatePosition());
    // Reposition on scroll/resize
    const handler = () => updatePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler, true);

    // Observe content size changes to avoid overflow
    const ro = new ResizeObserver(() => updatePosition());
    if (contentRef.current) ro.observe(contentRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler, true);
      ro.disconnect();
    };
  }, [open, updatePosition, contentRef]);

  if (!open) return null;

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div
      role="menu"
      ref={contentRef}
      className={`z-[1000] rounded-md border bg-popover text-popover-foreground shadow-md ${className}`}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: position.transform,
        // Ensure the popover can never overflow the viewport width
        maxWidth: 'calc(100vw - 16px)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>,
    portalTarget
  );
}

export function DropdownMenuItem({
  children,
  className = '',
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDropdownMenu();
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    setOpen(false);
  };
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-2 py-1.5 text-sm font-semibold ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
