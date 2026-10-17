import React from "react";
import { clsx } from "clsx";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label className="text-xs font-medium text-fg-muted">{label}</label>}
        <select
          ref={ref}
          className={clsx(
            "w-full bg-panel text-fg border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/60 transition-colors border-hairline cursor-pointer",
            error && "border-danger focus:ring-danger/60",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-panel text-fg">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-[11px] text-danger">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
