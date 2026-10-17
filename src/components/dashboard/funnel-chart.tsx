"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Stage } from "@/lib/validations/common";
import { Mono } from "../ui/mono";
import { ArrowRight, Filter } from "lucide-react";

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

const STAGE_COLORS: Record<string, string> = {
  SOURCED: "#64748B",
  APPLIED: "#3B82F6",
  SCREENING: "#6366F1",
  TECHNICAL_INTERVIEW: "#8B5CF6",
  SYSTEM_DESIGN: "#EC4899",
  OFFER: "#F59E0B",
  HIRED: "#10B981",
};

export function FunnelChart({ stages }: FunnelChartProps) {
  const router = useRouter();

  const chartData = stages.map((s) => ({
    name: s.stage.replace(/_/g, " "),
    stage: s.stage,
    volume: s.reached,
    stepConversion: s.stepConversionPct,
    cumulative: s.cumulativePct,
    dropOff: s.dropOff,
    inFlight: s.inFlight,
    rejected: s.rejected,
    withdrawn: s.withdrawn,
    color: STAGE_COLORS[s.stage] || "#6366F1",
  }));

  const handleBarClick = (entry: any) => {
    if (entry && entry.stage) {
      router.push(`/pipeline?stages=${entry.stage}`);
    }
  };

  return (
    <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-fg">
            Pipeline Conversion Waterfall
          </h3>
          <p className="text-xs text-fg-muted">
            Candidate pass-through rate across hiring stages (click bar to filter)
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-fg-muted font-mono">
          <Filter className="w-3.5 h-3.5" />
          <span>Interactive</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
              width={110}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length || !payload[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-panel border border-hairline rounded-lg p-3 shadow-xl text-xs flex flex-col gap-1.5">
                    <span className="font-bold text-fg">{data.name}</span>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>Ever Reached:</span>
                      <span className="font-bold text-fg">{data.volume}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>Step Conversion:</span>
                      <span className="font-bold text-primary">{data.stepConversion}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-fg-muted font-mono">
                      <span>Cumulative Pass:</span>
                      <span className="font-bold text-emerald-500">{data.cumulative}%</span>
                    </div>
                    {data.dropOff > 0 && (
                      <div className="pt-1.5 border-t border-hairline flex flex-col gap-0.5 text-[11px] text-fg-muted">
                        <span>Drop-off: {data.dropOff} candidates</span>
                        <span>({data.rejected} rejected, {data.withdrawn} withdrawn)</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="volume"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={handleBarClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage conversion stepper chips */}
      <div className="grid grid-cols-7 gap-1 pt-2 border-t border-hairline">
        {stages.map((st, i) => (
          <div
            key={st.stage}
            onClick={() => router.push(`/pipeline?stages=${st.stage}`)}
            className="flex flex-col items-center p-1.5 rounded hover:bg-hairline/40 transition-colors cursor-pointer text-center"
          >
            <span className="text-[10px] text-fg-muted truncate w-full">
              {st.stage.replace(/_/g, " ").toLowerCase()}
            </span>
            <span className="font-mono text-xs font-bold text-fg">
              <Mono>{st.reached}</Mono>
            </span>
            {i > 0 && (
              <span className="text-[10px] font-mono text-primary font-medium">
                {st.stepConversionPct}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
