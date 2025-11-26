'use client';

import * as React from 'react';

type SelectContextType = {
  value?: string;
  onValueChange?: (v: string) => void;
};

const SelectContext = React.createContext<SelectContextType>({});

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
};

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);

  // If controlled, prefer the value prop; otherwise use internal state
  const effectiveValue = value !== undefined ? value : internalValue;

  const handleChange = (v: string) => {
    if (onValueChange) {
      onValueChange(v);
    } else {
      setInternalValue(v);
    }
  };

  return (
    <SelectContext.Provider value={{ value: effectiveValue, onValueChange: handleChange }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext);
  return <span>{ctx.value || placeholder}</span>;
}

export function SelectContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function SelectItem(
  { value, children, className = '', ...props }:
  { value: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>
) {
  const ctx = React.useContext(SelectContext);
  const handleClick = () => ctx.onValueChange?.(value);
  return (
    <div role="option" data-value={value} onClick={handleClick} className={className} {...props}>
      {children}
    </div>
  );
}
