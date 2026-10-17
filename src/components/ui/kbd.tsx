import React from "react";
import { clsx } from "clsx";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={clsx(
        "inline-flex items-center justify-center font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-hairline/50 text-fg-muted border border-hairline select-none shadow-xs",
        className
      )}
    >
      {children}
    </kbd>
  );
}
