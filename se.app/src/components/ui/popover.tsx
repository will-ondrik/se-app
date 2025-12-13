'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

type PopoverContextType = {
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  isControlled: boolean;
};

const PopoverContext = React.createContext<PopoverContextType | null>(null);

type PopoverProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Popover({ children, open: openProp, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : uncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement>(null);

  const setOpen = React.useCallback(
    (o: boolean) => {
      onOpenChange?.(o);
      if (!isControlled) setUncontrolledOpen(o);
    },
    [isControlled, onOpenChange]
  );

  const ctx = React.useMemo<PopoverContextType>(
    () => ({ open, setOpen, triggerRef, isControlled }),
    [open, setOpen]
  );

  return <PopoverContext.Provider value={ctx}>{children}</PopoverContext.Provider>;
}

type TriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function PopoverTrigger({ asChild, children, ...props }: TriggerProps) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) {
    // Fallback: render a button
    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  }

  const toggle = (e: React.MouseEvent<HTMLElement>) => {
    props.onClick?.(e);
    ctx.setOpen(!ctx.open);
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const setChildRef = (node: HTMLElement | null) => {
      ctx.triggerRef.current = node;
      const { ref } = child as any;
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') (ref as any).current = node;
    };
    return React.cloneElement(child, {
      ref: setChildRef,
      'aria-haspopup': 'dialog',
      'aria-expanded': ctx.open,
      onClick: (e: any) => {
        child.props?.onClick?.(e);
        toggle(e);
      },
    });
  }

  return (
    <button
      type="button"
      ref={ctx.triggerRef as React.RefObject<HTMLButtonElement>}
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      onClick={toggle}
      {...props}
    >
      {children}
    </button>
  );
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

export function PopoverContent({
  children,
  className = '',
  align = 'start',
  sideOffset = 8,
  ...props
}: ContentProps) {
  const ctx = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!ctx?.open || !ctx.triggerRef.current) return;

    const updatePosition = () => {
      const trigger = ctx.triggerRef.current!;
      const rect = trigger.getBoundingClientRect();

      let left = rect.left;
      if (align === 'center' && contentRef.current) {
        const width = contentRef.current.getBoundingClientRect().width;
        left = rect.left + rect.width / 2 - width / 2;
      } else if (align === 'end' && contentRef.current) {
        const width = contentRef.current.getBoundingClientRect().width;
        left = rect.right - width;
      }

      const top = rect.bottom + sideOffset;

      setStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 50,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'auto',
      });
    };

    updatePosition();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx.setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(t) &&
        ctx.triggerRef.current &&
        !ctx.triggerRef.current.contains(t)
      ) {
        ctx.setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [ctx?.open, align, sideOffset, ctx?.triggerRef]);

  if (!ctx || !mounted || !ctx.open) return null;

  const content = (
    <div
      ref={contentRef}
      role="dialog"
      data-state={ctx.open ? 'open' : 'closed'}
      className={`rounded-md border border-border bg-popover text-popover-foreground shadow-md ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
