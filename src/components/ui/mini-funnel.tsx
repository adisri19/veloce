"use client";

import React from "react";
import { Stage } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";
import { clsx } from "clsx";

export interface MiniFunnelProps {
  stages: Partial<Record<Stage, number>>;
  className?: string;
}

const ORDERED_STAGES: Stage[] = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
];

export function MiniFunnel({ stages, className }: MiniFunnelProps) {
  const total = Object.values(stages).reduce((acc: number, val) => acc + (val || 0), 0) || 1;

  return (
    <div className={clsx("flex items-center gap-1 w-full", className)}>
      {ORDERED_STAGES.map((st) => {
        const count = stages[st] || 0;
        const theme = STAGE_THEME[st];
        const widthPct = Math.max(count > 0 ? 8 : 4, Math.round((count / total) * 100));

        return (
          <div
            key={st}
            className="group relative flex-1 h-2 rounded-[2px] bg-hairline/40 overflow-hidden transition-all hover:h-2.5"
            title={`${theme.label}: ${count}`}
          >
            <div
              className="h-full rounded-[2px] transition-all duration-300"
              style={{
                width: `${count > 0 ? 100 : 0}%`,
                backgroundColor: theme.color,
                opacity: count > 0 ? 0.9 : 0.2,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
