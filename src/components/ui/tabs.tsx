import React from "react";
import { clsx } from "clsx";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div className={clsx("flex items-center gap-1 border-b border-hairline px-2", className)}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors select-none",
              isActive
                ? "border-primary text-fg font-semibold"
                : "border-transparent text-fg-muted hover:text-fg hover:border-hairline"
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "font-mono text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-primary-muted text-primary"
                    : "bg-hairline/60 text-fg-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
