import React from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      icon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primary-hover shadow-sm border border-transparent",
      secondary:
        "bg-panel text-fg hover:bg-hairline/50 border border-hairline shadow-sm",
      outline:
        "bg-transparent text-fg border border-hairline hover:bg-panel hover:border-fg-muted/40",
      ghost:
        "bg-transparent text-fg-muted hover:text-fg hover:bg-panel border border-transparent",
      danger:
        "bg-danger text-white hover:opacity-90 shadow-sm border border-transparent",
    };

    const sizeStyles = {
      xs: "text-xs px-2 py-1 gap-1 h-6",
      sm: "text-xs px-2.5 py-1.5 gap-1.5 h-7.5",
      md: "text-xs px-3 py-1.5 gap-2 h-8.5",
      lg: "text-sm px-4 py-2 gap-2 h-10",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          icon && <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon: React.ReactNode;
}

export function IconButton({
  icon,
  className,
  variant = "ghost",
  size = "md",
  ...props
}: IconButtonProps) {
  const sizeStyles = {
    sm: "w-7 h-7 p-1 text-xs",
    md: "w-8 h-8 p-1.5 text-xs",
    lg: "w-9 h-9 p-2 text-sm",
  };

  const variantStyles = {
    secondary: "bg-panel text-fg hover:bg-hairline border border-hairline",
    outline: "bg-transparent text-fg border border-hairline hover:bg-panel",
    ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-hairline/40 border border-transparent",
    danger: "text-danger hover:bg-danger/10 border border-transparent",
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
