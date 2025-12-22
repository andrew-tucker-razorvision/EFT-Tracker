"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-[var(--tactical-border)] bg-[var(--bg-card)]",
          "text-[var(--accent-gold)] focus:ring-[var(--accent-gold)] focus:ring-offset-0",
          "cursor-pointer transition-colors",
          "checked:bg-[var(--accent-gold)] checked:border-[var(--accent-gold)]",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
