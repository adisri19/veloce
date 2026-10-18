"use client";

import React, { useState } from "react";
import { Stage } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";
import { Mono } from "../ui/mono";
import { Flame, AlertCircle, Clock } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export interface DwellChartProps {
  velocity: {
    stage: Stage;
    avgDays: number;
    medianDays: number;
    p90Days: number;
    slaTargetDays: number;
    breachRatePct: number;
    isBottleneck: boolean;
  }[];
}

const SHORT_LABELS: Record<Stage, string> = {
  SOURCED: "Sourced",
  APPLIED: "Applied",
  SCREENING: "Screen",
  TECHNICAL_INTERVIEW: "Tech",
  SYSTEM_DESIGN: "Sys Design",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export function DwellChart({ velocity }: DwellChartProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const bottleneck = velocity.find((v) => v.isBottleneck);

  // Maximum days for scaling bullet tracks
  const maxDays = Math.max(
    ...velocity.map((v) => Math.max(v.avgDays, v.p90Days, v.slaTargetDays)),
    12
  );

  return (
    <div className="p-5 bg-panel border border-hairline rounded-xl shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-fg">
              Stage Velocity vs SLA Targets
            </h3>
            {bottleneck && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25 font-mono font-semibold animate-pulse">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Bottleneck: {SHORT_LABELS[bottleneck.stage] || bottleneck.stage}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Average dwell and 90th percentile vs configured SLA threshold
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-fg-muted font-mono self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-indigo-500" />
            <span>Avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-3 rounded-xs bg-amber-400" />
            <span>P90</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0 border-t-2 border-dashed border-sky-400" />
            <span>SLA</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bullet Rows */}
      <div className="flex flex-col gap-2.5 pt-1">
        {velocity.map((v, i) => {
          const shortLabel = SHORT_LABELS[v.stage] || v.stage;
          const theme = STAGE_THEME[v.stage];
          const isBottleneck = v.isBottleneck;
          const isHovered = hoveredStage === v.stage;

          const avgPct = Math.min(100, (v.avgDays / maxDays) * 100);
          const p90Pct = Math.min(100, (v.p90Days / maxDays) * 100);
          const slaPct = Math.min(100, (v.slaTargetDays / maxDays) * 100);

          return (
            <motion.div
              key={v.stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              onMouseEnter={() => setHoveredStage(v.stage)}
              onMouseLeave={() => setHoveredStage(null)}
              className={clsx(
                "relative group rounded-lg p-2 transition-all duration-150 border",
                isBottleneck
                  ? "bg-rose-500/[0.04] border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                  : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Short readable label (NEVER clipped or overlapping) */}
                <div className="w-24 shrink-0 flex items-center justify-between">
                  <span
                    className={clsx(
                      "text-xs font-semibold truncate",
                      isBottleneck ? "text-rose-400" : "text-fg"
                    )}
                  >
                    {shortLabel}
                  </span>
                  {isBottleneck && (
                    <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />
                  )}
                </div>

                {/* Bullet Chart Track */}
                <div className="flex-1 relative h-6 flex items-center">
                  {/* Background track */}
                  <div className="w-full h-2.5 rounded-full bg-white/[0.04] relative overflow-hidden" />

                  {/* Avg Bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avgPct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className={clsx(
                      "absolute left-0 top-1.5 h-3 rounded-l-full shadow-xs",
                      v.avgDays > v.slaTargetDays
                        ? "bg-rose-500"
                        : "bg-indigo-500"
                    )}
                    style={{
                      boxShadow: isBottleneck
                        ? "0 0 10px rgba(244, 63, 94, 0.4)"
                        : undefined,
                    }}
                  />

                  {/* P90 Tick Marker */}
                  <div
                    className="absolute top-0.5 bottom-0.5 w-1 rounded-full bg-amber-400 z-10 shadow-xs"
                    style={{ left: `calc(${p90Pct}% - 2px)` }}
                    title={`P90: ${v.p90Days}d`}
                  />

                  {/* Dashed SLA Target Marker */}
                  <div
                    className="absolute top-0 bottom-0 border-r-2 border-dashed border-sky-400 z-10"
                    style={{ left: `${slaPct}%` }}
                    title={`SLA Target: ${v.slaTargetDays}d`}
                  />
                </div>

                {/* Numeric readout */}
                <div className="w-32 shrink-0 flex items-center justify-end gap-2 text-xs font-mono">
                  <span
                    className={clsx(
                      "font-semibold",
                      v.avgDays > v.slaTargetDays ? "text-rose-400" : "text-fg"
                    )}
                  >
                    <Mono>{v.avgDays}d</Mono>
                  </span>
                  <span className="text-fg-muted">/</span>
                  <span className="text-sky-400 font-medium">
                    <Mono>{v.slaTargetDays}d</Mono>
                  </span>
                  {v.breachRatePct > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                      {v.breachRatePct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Glass Tooltip on Hover */}
              {isHovered && (
                <div className="absolute left-28 top-9 z-30 p-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl text-xs flex flex-col gap-1.5 min-w-[220px]">
                  <div className="flex items-center justify-between font-semibold text-fg border-b border-hairline/60 pb-1">
                    <span>{theme?.label || v.stage}</span>
                    <span className="text-[11px] font-mono text-sky-400">
                      SLA: {v.slaTargetDays} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-fg-muted font-mono text-[11px]">
                    <span>Average Dwell:</span>
                    <span
                      className={clsx(
                        "font-bold",
                        v.avgDays > v.slaTargetDays ? "text-rose-400" : "text-fg"
                      )}
                    >
                      {v.avgDays} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-fg-muted font-mono text-[11px]">
                    <span>Median Dwell:</span>
                    <span className="font-bold text-fg">{v.medianDays} days</span>
                  </div>
                  <div className="flex items-center justify-between text-fg-muted font-mono text-[11px]">
                    <span>P90 Dwell:</span>
                    <span className="font-bold text-amber-400">{v.p90Days} days</span>
                  </div>
                  <div className="flex items-center justify-between text-fg-muted font-mono text-[11px] pt-1 border-t border-hairline/60">
                    <span>SLA Breach Rate:</span>
                    <span
                      className={clsx(
                        "font-bold",
                        v.breachRatePct > 0 ? "text-rose-400" : "text-emerald-400"
                      )}
                    >
                      {v.breachRatePct}%
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
