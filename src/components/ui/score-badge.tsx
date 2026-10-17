import React from "react";
import { clsx } from "clsx";
import { Mono } from "./mono";

export interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
  className,
}: ScoreBadgeProps) {
  let colorStyles = {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/25",
    ring: "#FB7185",
  };

  if (score >= 85) {
    colorStyles = {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/25",
      ring: "#34D399",
    };
  } else if (score >= 70) {
    colorStyles = {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-500/25",
      ring: "#6366F1",
    };
  } else if (score >= 50) {
    colorStyles = {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/25",
      ring: "#FBBF24",
    };
  }

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[11px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm font-semibold",
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded font-mono border tracking-tight select-none",
        colorStyles.bg,
        colorStyles.text,
        colorStyles.border,
        sizeStyles[size],
        className
      )}
    >
      <Mono className="font-semibold">{score}%</Mono>
      {showLabel && <span className="text-[10px] uppercase font-sans tracking-wider opacity-75">Match</span>}
    </div>
  );
}
