"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: "sm" | "md";
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "sm",
  className,
  name = "segmented-thumb",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={clsx(
        "inline-flex items-center p-1 bg-panel border border-hairline rounded-lg select-none relative",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors text-center cursor-pointer",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              isSelected ? "text-fg font-semibold" : "text-fg-muted hover:text-fg"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={name}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className="absolute inset-0 bg-hairline/80 dark:bg-white/10 rounded-md shadow-xs -z-10"
              />
            )}
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-primary-muted text-primary">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
