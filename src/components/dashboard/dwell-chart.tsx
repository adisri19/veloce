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
  ReferenceLine,
} from "recharts";
import { Stage } from "@/lib/validations/common";
import { Mono } from "../ui/mono";
import { AlertCircle, Flame } from "lucide-react";

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

export function DwellChart({ velocity }: DwellChartProps) {
  const chartData = velocity.map((v) => ({
    name: v.stage.replace(/_/g, " "),
    stage: v.stage,
    avg: v.avgDays,
    p90: v.p90Days,
    slaTarget: v.slaTargetDays,
    breachRate: v.breachRatePct,
    isBottleneck: v.isBottleneck,
  }));

  const bottleneckStage = velocity.find((v) => v.isBottleneck);

  return (
    <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-fg">
              Stage Velocity & SLA Targets
            </h3>
            {bottleneckStage && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-danger-surface text-danger border border-danger/30 font-semibold font-mono">
                <Flame className="w-3 h-3" />
                <span>Bottleneck: {bottleneckStage.stage.replace(/_/g, " ")}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted">
            Average and 90th-percentile dwell days versus target SLA per stage
          </p>
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
              unit="d"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length || !payload[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-panel border border-hairline rounded-lg p-3 shadow-xl text-xs flex flex-col gap-1.5">
                    <span className="font-bold text-fg">{data.name}</span>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>Average Dwell:</span>
                      <span className="font-bold text-fg">{data.avg} days</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>P90 Dwell:</span>
                      <span className="font-bold text-amber-500">{data.p90} days</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>SLA Target:</span>
                      <span className="font-bold text-sky-400">{data.slaTarget} days</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono pt-1 border-t border-hairline">
                      <span>SLA Breach Rate:</span>
                      <span className={`font-bold ${data.breachRate > 0 ? "text-danger" : "text-emerald-500"}`}>
                        {data.breachRate}%
                      </span>
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
            <Bar dataKey="avg" name="Avg Days" fill="#6366F1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="p90" name="P90 Days" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            <Bar dataKey="slaTarget" name="SLA Target" fill="#38BDF8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
