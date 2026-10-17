"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Mono } from "../ui/mono";
import { Award } from "lucide-react";

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
  const chartData = sources.map((s) => ({
    name: s.source,
    highScore: s.highScoreCount,
    other: Math.max(0, s.volume - s.highScoreCount),
    volume: s.volume,
    ratio: s.highScoreRatio,
    hires: s.hires,
    conversion: s.interviewToOfferPct,
  }));

  return (
    <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-fg">
            Candidate Quality by Acquisition Channel
          </h3>
          <p className="text-xs text-fg-muted">
            High-match candidates (≥80) vs total inbound volume and final hires
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-500 font-mono font-medium">
          <Award className="w-3.5 h-3.5" />
          <span>Top Channel: {sources[0]?.source || "Referral"}</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--fg-muted)", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--fg-muted)", fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length || !payload[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-panel border border-hairline rounded-lg p-3 shadow-xl text-xs flex flex-col gap-1.5">
                    <span className="font-bold text-fg">{data.name}</span>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>Total Volume:</span>
                      <span className="font-bold text-fg">{data.volume}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>High Match (≥80):</span>
                      <span className="font-bold text-primary">{data.highScore}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>High Score Ratio:</span>
                      <span className="font-bold text-emerald-500">{data.ratio}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono pt-1 border-t border-hairline">
                      <span>Total Hires:</span>
                      <span className="font-bold text-amber-500">{data.hires}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => (
                <span className="text-fg-muted text-xs capitalize">{value}</span>
              )}
            />
            <Bar dataKey="highScore" name="High Score (≥80)" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="other" name="Standard Score" stackId="a" fill="#64748B" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
