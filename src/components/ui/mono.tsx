import React from "react";
import { clsx } from "clsx";

interface MonoProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Mono({ children, className, ...props }: MonoProps) {
  return (
    <span
      className={clsx(
        "font-mono tabular-nums whitespace-nowrap tracking-tight font-medium text-xs",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
