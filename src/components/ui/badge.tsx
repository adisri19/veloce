import React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "primary" | "success" | "warn" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  children,
  className,
  variant = "neutral",
  size = "md",
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral: "bg-panel text-fg-muted border border-hairline",
    primary: "bg-primary-muted text-primary border border-primary/20",
    success: "bg-success-surface text-success border border-success/20",
    warn: "bg-warn-surface text-warn border border-warn/20",
    danger: "bg-danger-surface text-danger border border-danger/20",
    outline: "bg-transparent text-fg-muted border border-hairline",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded tracking-wide uppercase select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
