"use client";

import React from "react";
import { getScoreTheme } from "@/lib/stage-theme";
import { Mono } from "./mono";
import { clsx } from "clsx";

export interface ScoreRingProps {
  score: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

export function ScoreRing({
  score,
  size = "md",
  showLabel = true,
  animate = true,
  className,
}: ScoreRingProps) {
  const theme = getScoreTheme(score);

  const sizeMap = {
    xs: { dim: 24, stroke: 2.5, font: "text-[9px]" },
    sm: { dim: 32, stroke: 3, font: "text-[11px]" },
    md: { dim: 42, stroke: 3.5, font: "text-xs font-bold" },
    lg: { dim: 56, stroke: 4.5, font: "text-sm font-extrabold" },
    xl: { dim: 72, stroke: 5.5, font: "text-lg font-black" },
  };

  const { dim, stroke, font } = sizeMap[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center shrink-0 rounded-full",
        theme.glowClass,
        className
      )}
      style={{ width: dim, height: dim }}
      title={`AI Match Score: ${score}% (${theme.tier})`}
    >
      <svg width={dim} height={dim} className="rotate-[-90deg]">
        {/* Track circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          className="text-hairline/60"
          strokeWidth={stroke}
        />
        {/* Filled score circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="transparent"
          stroke={theme.color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={clsx(
            animate ? "transition-all duration-700 ease-out" : ""
          )}
        />
      </svg>

      {showLabel && (
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center leading-none tracking-tight",
            theme.textClass,
            font
          )}
        >
          <Mono>{score}</Mono>
        </span>
      )}
    </div>
  );
}
