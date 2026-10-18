import React from "react";
import { clsx } from "clsx";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: "inbox-zero" | "search" | "filter" | "generic";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration = "generic",
  className,
}: EmptyStateProps) {
  const renderIllustration = () => {
    if (icon) {
      return (
        <div className="text-primary mb-3 p-3 bg-primary-muted rounded-full">
          {icon}
        </div>
      );
    }

    if (illustration === "inbox-zero") {
      return (
        <svg
          className="w-16 h-16 mb-3 text-emerald-400/80"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
          <path d="M20 34L28 42L44 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (illustration === "search") {
      return (
        <svg
          className="w-16 h-16 mb-3 text-primary/70"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="2.5" />
          <path d="M40 40L52 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="22" y1="28" x2="34" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
      );
    }

    return (
      <svg
        className="w-16 h-16 mb-3 text-fg-muted/60"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="14" y="18" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M24 32H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    );
  };

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-hairline bg-panel/30",
        className
      )}
    >
      {renderIllustration()}
      <h3 className="text-sm font-bold text-fg tracking-tight">{title}</h3>
      {description && <p className="text-xs text-fg-muted mt-1 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
