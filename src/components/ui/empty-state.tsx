import React from "react";
import { clsx } from "clsx";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-hairline bg-panel/40",
        className
      )}
    >
      {icon && <div className="text-fg-muted mb-3 p-3 bg-hairline/30 rounded-full">{icon}</div>}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && <p className="text-xs text-fg-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
