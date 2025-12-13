'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

type SelectContextType = {
  value?: string;
  onValueChange?: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  itemsRef: React.MutableRefObject<Map<string, string>>;
  registerItem: (value: string, label: string) => void;
  unregisterItem: (value: string) => void;
  valueToLabel?: Record<string, string>;
};

const SelectContext = React.createContext<SelectContextType | null>(null);

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  valueToLabel?: Record<string, string>;
  children: React.ReactNode;
};

export function Select({ value, defaultValue, onValueChange, valueToLabel, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemsRef = React.useRef<Map<string, string>>(new Map());

  // If controlled, prefer the value prop; otherwise use internal state
  const effectiveValue = value !== undefined ? value : internalValue;

  const handleChange = (v: string) => {
    if (onValueChange) {
      onValueChange(v);
    } else {
      setInternalValue(v);
    }
  };

  const registerItem = React.useCallback((v: string, l: string) => {
    itemsRef.current.set(v, l);
  }, []);
  const unregisterItem = React.useCallback((v: string) => {
    itemsRef.current.delete(v);
  }, []);

  const ctx: SelectContextType = React.useMemo(
    () => ({
      value: effectiveValue,
      onValueChange: handleChange,
      open,
      setOpen,
      triggerRef,
      itemsRef,
      registerItem,
      unregisterItem,
      valueToLabel,
    }),
    [effectiveValue, open, handleChange, registerItem, unregisterItem, valueToLabel]
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) {
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  }
  const { open, setOpen, triggerRef } = ctx;

  return (
    <button
      type="button"
      ref={triggerRef}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={(e) => {
        props.onClick?.(e as any);
        setOpen(!open);
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return <span>{placeholder}</span>;
  const label =
    (ctx.value && ctx.itemsRef.current.get(ctx.value)) ||
    (ctx.value && ctx.valueToLabel && ctx.valueToLabel[ctx.value]) ||
    ctx.value ||
    placeholder;
  return <span>{label}</span>;
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
};

export function SelectContent({
  className = '',
  children,
  sideOffset = 6,
  ...props
}: ContentProps) {
  const ctx = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!ctx?.open || !ctx.triggerRef.current) return;

    const updatePosition = () => {
      const trigger = ctx.triggerRef.current!;
      const rect = trigger.getBoundingClientRect();
      const top = rect.bottom + sideOffset;
      const left = rect.left;
      const minWidth = rect.width;
      setStyle({
        position: 'fixed',
        top,
        left,
        minWidth,
        zIndex: 50,
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
  }, [ctx?.open, sideOffset, ctx?.triggerRef]);

  if (!ctx || !mounted || !ctx.open) return null;

  const content = (
    <div
      ref={contentRef}
      role="listbox"
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

export function SelectItem({
  value,
  children,
  label,
  className = '',
  ...props
}: { value: string; label?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(SelectContext);

  React.useEffect(() => {
    if (!ctx) return;
    const text =
      label ?? (typeof children === 'string' ? (children as string) : String(value));
    ctx.registerItem(value, text);
    return () => ctx.unregisterItem(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, value, label, children]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    props.onClick?.(e);
    ctx?.onValueChange?.(value);
    ctx?.setOpen(false);
  };

  return (
    <div
      role="option"
      aria-selected={ctx?.value === value}
      data-value={value}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
