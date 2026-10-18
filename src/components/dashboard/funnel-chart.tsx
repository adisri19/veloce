"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Stage } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";
import { Mono } from "../ui/mono";
import { ArrowDown, AlertTriangle, Filter, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

export interface FunnelChartProps {
  stages: {
    stage: Stage;
    reached: number;
    stepConversionPct: number;
    cumulativePct: number;
    dropOff: number;
    inFlight: number;
    rejected: number;
    withdrawn: number;
  }[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const router = useRouter();
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const maxVolume = Math.max(...stages.map((s) => s.reached), 1);

  // Compute biggest leak
  let biggestLeak = { from: "", to: "", dropPct: 0 };
  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i];
    const next = stages[i + 1];
    if (current && next) {
      const dropPct = 100 - next.stepConversionPct;
      if (dropPct > biggestLeak.dropPct) {
        biggestLeak = {
          from: STAGE_THEME[current.stage]?.label || current.stage,
          to: STAGE_THEME[next.stage]?.label || next.stage,
          dropPct: Math.round(dropPct),
        };
      }
    }
  }

  const handleStageClick = (stage: Stage) => {
    router.push(`/pipeline?stages=${stage}`);
  };

  return (
    <div className="p-5 bg-panel border border-hairline rounded-xl shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-fg">
              Pipeline Conversion Waterfall
            </h3>
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono font-medium">
              <Filter className="w-2.5 h-2.5" />
              <span>Interactive</span>
            </span>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Candidate pass-through rate across hiring stages (click to inspect stage in pipeline)
          </p>
        </div>

        {biggestLeak.dropPct > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium self-start sm:self-auto">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>
              Biggest leak: {biggestLeak.from} → {biggestLeak.to} (
              <span className="font-mono">-{biggestLeak.dropPct}%</span>)
            </span>
          </div>
        )}
      </div>

      {/* Waterfall Bars with Floating Conversion Chips */}
      <div className="flex flex-col gap-2 pt-2">
        {stages.map((st, i) => {
          const theme = STAGE_THEME[st.stage] || {
            label: st.stage,
            color: "#6366F1",
            bg: "rgba(99, 102, 241, 0.15)",
            border: "rgba(99, 102, 241, 0.3)",
          };
          const widthPct = Math.max(12, Math.round((st.reached / maxVolume) * 100));
          const isDimmed = hoveredStage !== null && hoveredStage !== st.stage;
          const isHovered = hoveredStage === st.stage;
          const nextStage = stages[i + 1];

          return (
            <React.Fragment key={st.stage}>
              {/* Stage Bar */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onMouseEnter={() => setHoveredStage(st.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => handleStageClick(st.stage)}
                className={clsx(
                  "relative group cursor-pointer transition-all duration-200 rounded-lg p-1.5",
                  isDimmed && "opacity-40",
                  isHovered && "ring-1 ring-primary/40 bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Stage Label */}
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-xs font-medium text-fg truncate">
                      {theme.label}
                    </span>
                  </div>

                  {/* Bar Graphic */}
                  <div className="flex-1 h-8 rounded-md bg-white/[0.02] border border-white/[0.04] relative overflow-hidden flex items-center">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      className="h-full rounded-md flex items-center justify-between px-3 text-xs font-semibold shadow-inner relative overflow-hidden"
                      style={{
                        background: `linear-gradient(90deg, ${theme.color} 0%, ${theme.color}CC 100%)`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25)`,
                      }}
                    >
                      <span className="text-white drop-shadow-xs font-mono">
                        <Mono>{st.reached}</Mono>
                      </span>
                      {widthPct > 28 && (
                        <span className="text-white/80 font-mono text-[11px] hidden sm:inline">
                          {st.cumulativePct}% cum.
                        </span>
                      )}
                    </motion.div>

                    {/* Stats details visible beside bar if small */}
                    {widthPct <= 28 && (
                      <span className="ml-2 text-xs font-mono text-fg-muted">
                        {st.cumulativePct}% cum.
                      </span>
                    )}

                    {st.dropOff > 0 && (
                      <span className="ml-auto mr-3 text-[11px] font-mono text-fg-muted hidden md:inline">
                        -{st.dropOff} drop ({st.rejected} rej, {st.withdrawn} w/d)
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Glass Tooltip */}
                {isHovered && (
                  <div className="absolute left-36 top-10 z-30 p-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl text-xs flex flex-col gap-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between gap-4 font-semibold text-fg">
                      <span>{theme.label}</span>
                      <span className="font-mono text-primary">{st.reached} reached</span>
                    </div>
                    <div className="flex items-center justify-between text-fg-muted font-mono text-[11px]">
                      <span>Step Conversion:</span>
                      <span className="font-bold text-fg">{st.stepConversionPct}%</span>
                    </div>
                    <div className="flex items-center justify-between text-fg-muted font-mono text-[11px]">
                      <span>Cumulative Pass:</span>
                      <span className="font-bold text-emerald-400">{st.cumulativePct}%</span>
                    </div>
                    {st.dropOff > 0 && (
                      <div className="pt-1 mt-1 border-t border-hairline/60 flex flex-col gap-0.5 text-[10px] text-fg-muted font-mono">
                        <span>Drop-off: {st.dropOff} candidates</span>
                        <span>{st.rejected} rejected · {st.withdrawn} withdrawn</span>
                      </div>
                    )}
                    <span className="text-[10px] text-primary/80 pt-0.5">Click to view in pipeline →</span>
                  </div>
                )}
              </motion.div>

              {/* Floating Conversion Chip between bars */}
              {nextStage && (
                <div className="flex items-center pl-36 -my-1 py-0.5">
                  <div
                    className={clsx(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs border transition-colors",
                      nextStage.stepConversionPct >= 80
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        : nextStage.stepConversionPct < 60
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                    )}
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                    <span>{nextStage.stepConversionPct}% step conversion</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
