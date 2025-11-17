'use client';

import * as React from 'react';

type SelectContextType = {
  value?: string;
  onValueChange?: (v: string) => void;
};

const SelectContext = React.createContext<SelectContextType>({});

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
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

export function SelectItem({ value, children, className = '', ...props }: { value: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(SelectContext);
  const handleClick = () => ctx.onValueChange?.(value);
  return (
    <div role="option" data-value={value} onClick={handleClick} className={className} {...props}>
      {children}
    </div>
  );
}
