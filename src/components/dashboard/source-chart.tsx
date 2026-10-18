"use client";

import React, { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Mono } from "../ui/mono";
import { Crown, Sparkles } from "lucide-react";
import { clsx } from "clsx";

export interface SourceChartProps {
  sources: {
    source: string;
    volume: number;
    highScoreCount: number;
    highScoreRatio: number;
    interviewReached: number;
    offerReached: number;
    interviewToOfferPct: number;
    hires: number;
  }[];
}

export function SourceChart({ sources }: SourceChartProps) {
  // Working legend toggle state
  const [visibleSeries, setVisibleSeries] = useState({
    highScore: true,
    standard: true,
    ratio: true,
  });

  // Sort by ratio descending
  const sortedSources = [...sources].sort((a, b) => b.highScoreRatio - a.highScoreRatio);
  const topChannel = sortedSources[0];

  const chartData = sortedSources.map((s) => ({
    name: s.source,
    highScore: s.highScoreCount,
    standard: Math.max(0, s.volume - s.highScoreCount),
    volume: s.volume,
    ratio: s.highScoreRatio,
    hires: s.hires,
    conversion: s.interviewToOfferPct,
  }));

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-5 bg-panel border border-hairline rounded-xl shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-fg">
              Acquisition Quality & Conversion Ratio
            </h3>
            {topChannel && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono font-semibold">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Top Channel: {topChannel.source} ({topChannel.highScoreRatio}%)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            High-match candidates (≥80 score) vs standard inbound volume, ranked by high-score yield
          </p>
        </div>

        {/* Working Legend Toggles */}
        <div className="flex items-center gap-3 text-xs font-mono select-none self-start sm:self-auto">
          <button
            onClick={() => toggleSeries("highScore")}
            className={clsx(
              "flex items-center gap-1.5 px-2 py-0.5 rounded transition-all",
              visibleSeries.highScore
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                : "text-fg-muted opacity-40 hover:opacity-70"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>High Match (≥80)</span>
          </button>

          <button
            onClick={() => toggleSeries("standard")}
            className={clsx(
              "flex items-center gap-1.5 px-2 py-0.5 rounded transition-all",
              visibleSeries.standard
                ? "text-slate-300 bg-slate-500/10 border border-slate-500/20"
                : "text-fg-muted opacity-40 hover:opacity-70"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-500" />
            <span>Standard</span>
          </button>

          <button
            onClick={() => toggleSeries("ratio")}
            className={clsx(
              "flex items-center gap-1.5 px-2 py-0.5 rounded transition-all",
              visibleSeries.ratio
                ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                : "text-fg-muted opacity-40 hover:opacity-70"
            )}
          >
            <span className="w-2.5 h-0.5 bg-indigo-400 rounded-full" />
            <span>Yield %</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
              unit="%"
            />
            <Tooltip
              cursor={{ fill: "rgba(99, 102, 241, 0.08)", radius: 6 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length || !payload[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3.5 shadow-2xl text-xs flex flex-col gap-2 min-w-[210px]">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-1.5">
                      <span className="font-semibold text-fg text-sm">{data.name}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {data.ratio}% yield
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-fg-muted font-mono">
                      <span>Total Volume:</span>
                      <span className="font-bold text-fg">{data.volume} candidates</span>
                    </div>
                    <div className="flex items-center justify-between text-fg-muted font-mono">
                      <span>High Match (≥80):</span>
                      <span className="font-bold text-emerald-400">{data.highScore}</span>
                    </div>
                    <div className="flex items-center justify-between text-fg-muted font-mono">
                      <span>Standard Candidates:</span>
                      <span className="font-bold text-slate-400">{data.standard}</span>
                    </div>
                    <div className="flex items-center justify-between text-fg-muted font-mono pt-1.5 border-t border-hairline/60">
                      <span>Hires Generated:</span>
                      <span className="font-bold text-amber-400">{data.hires}</span>
                    </div>
                  </div>
                );
              }}
            />
            {visibleSeries.highScore && (
              <Bar
                yAxisId="left"
                dataKey="highScore"
                name="High Score"
                stackId="a"
                fill="#10B981"
                radius={[0, 0, 0, 0]}
              />
            )}
            {visibleSeries.standard && (
              <Bar
                yAxisId="left"
                dataKey="standard"
                name="Standard"
                stackId="a"
                fill="#475569"
                radius={[4, 4, 0, 0]}
              />
            )}
            {visibleSeries.ratio && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ratio"
                name="High Score Yield"
                stroke="#818CF8"
                strokeWidth={2.5}
                dot={{ fill: "#818CF8", r: 4, strokeWidth: 1.5, stroke: "#1E1B4B" }}
                activeDot={{ r: 6, fill: "#A5B4FC" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
