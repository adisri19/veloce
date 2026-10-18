"use client";

import React from "react";
import { SlaState } from "@/lib/sla";
import { Mono } from "./mono";
import { Clock } from "lucide-react";
import { clsx } from "clsx";

export interface SlaChipProps {
  slaState: SlaState;
  daysInStage: number;
  slaDays: number;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SlaChip({
  slaState,
  daysInStage,
  slaDays,
  showIcon = true,
  size = "sm",
  className,
}: SlaChipProps) {
  // If no SLA (e.g. terminal stages)
  if (slaDays === 0) {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-fg-muted bg-hairline/40 border border-hairline/60",
          className
        )}
      >
        <Mono>{daysInStage.toFixed(1)}d</Mono>
      </span>
    );
  }

  const isBreached = slaState === "BREACHED";
  const isWarning = slaState === "WARNING";

  const diffDays = Math.abs(daysInStage - slaDays);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded font-mono font-medium whitespace-nowrap transition-colors",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        isBreached
          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(251,113,133,0.15)]"
          : isWarning
          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
          : "bg-hairline/50 text-fg-muted border border-hairline/70",
        className
      )}
      title={`Stage SLA: ${slaDays}d allowed • Currently ${daysInStage.toFixed(1)}d in stage`}
    >
      {/* Live pulsing dot when breached */}
      {isBreached ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
      ) : isWarning ? (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
      ) : showIcon ? (
        <Clock className="w-3 h-3 opacity-60 shrink-0" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shrink-0" />
      )}

      <span>
        {isBreached ? (
          <>
            <Mono>+{diffDays.toFixed(1)}d</Mono> overdue
          </>
        ) : isWarning ? (
          <>
            <Mono>{daysInStage.toFixed(1)}</Mono>/{slaDays}d
          </>
        ) : (
          <>
            <Mono>{daysInStage.toFixed(1)}</Mono>/{slaDays}d
          </>
        )}
      </span>
    </span>
  );
}
