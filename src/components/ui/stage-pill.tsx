import React from "react";
import { clsx } from "clsx";
import { Stage } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";

export interface StagePillProps {
  stage: Stage;
  size?: "xs" | "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export function StagePill({
  stage,
  size = "md",
  showDot = true,
  className,
}: StagePillProps) {
  const theme = STAGE_THEME[stage] || STAGE_THEME.APPLIED;

  const sizeStyles = {
    xs: "text-[9px] px-1.5 py-0.5 gap-1 rounded",
    sm: "text-[10px] px-2 py-0.5 gap-1.5 rounded-[6px]",
    md: "text-xs px-2.5 py-1 gap-2 rounded-[6px]",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold tracking-tight border select-none transition-colors",
        theme.bgSurface,
        theme.text,
        theme.border,
        sizeStyles[size],
        className
      )}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: theme.color }}
        />
      )}
      <span>{theme.label}</span>
    </span>
  );
}
