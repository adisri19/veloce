import React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label className="text-xs font-medium text-fg-muted">{label}</label>}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-2.5 text-fg-muted pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={clsx(
              "w-full bg-panel text-fg placeholder:text-fg-muted/60 border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/60 transition-colors border-hairline",
              icon && "pl-8",
              error && "border-danger focus:ring-danger/60",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[11px] text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <label className="text-xs font-medium text-fg-muted">{label}</label>}
        <textarea
          ref={ref}
          className={clsx(
            "w-full bg-panel text-fg placeholder:text-fg-muted/60 border rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/60 transition-colors border-hairline resize-y min-h-[70px]",
            error && "border-danger focus:ring-danger/60",
            className
          )}
          {...props}
        />
        {error && <span className="text-[11px] text-danger">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
