"use client";

import React from "react";
import Link from "next/link";
import { Mono } from "../ui/mono";
import {
  Users,
  Target,
  Clock,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export interface KpiGridProps {
  kpis: {
    activePipeline: number;
    activePipelineDelta: number;
    openHeadcount: {
      filled: number;
      total: number;
      pct: number;
    };
    meanTimeToHireDays: number;
    meanTimeToHireDelta: number;
    offerAcceptanceRate: number;
    activeSlaBreaches: {
      total: number;
      critical: number;
      warning: number;
    };
  };
}

export function KpiGrid({ kpis }: KpiGridProps) {
  const isPipelineUp = kpis.activePipelineDelta >= 0;
  const isTimeDecreased = kpis.meanTimeToHireDelta <= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Active Pipeline Volume */}
      <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Active Pipeline
          </span>
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-fg font-mono">
            <Mono>{kpis.activePipeline}</Mono>
          </span>
          <span
            className={`flex items-center text-xs font-mono font-medium ${
              isPipelineUp ? "text-emerald-500" : "text-fg-muted"
            }`}
          >
            {isPipelineUp ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <Mono>
              {isPipelineUp ? "+" : ""}
              {kpis.activePipelineDelta}%
            </Mono>
          </span>
        </div>
        <span className="text-[11px] text-fg-muted mt-2">
          Candidates in active evaluation stages
        </span>
      </div>

      {/* 2. Open Headcount Progress */}
      <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Headcount Progress
          </span>
          <Target className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-fg font-mono">
            <Mono>{kpis.openHeadcount.filled}</Mono>
          </span>
          <span className="text-sm font-mono text-fg-muted">
            / <Mono>{kpis.openHeadcount.total}</Mono> filled
          </span>
          <span className="ml-auto text-xs font-mono font-bold text-fg-muted">
            <Mono>{kpis.openHeadcount.pct}%</Mono>
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-hairline h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, kpis.openHeadcount.pct)}%` }}
          />
        </div>
      </div>

      {/* 3. Mean Time to Hire */}
      <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Mean Time-to-Hire
          </span>
          <Clock className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-fg font-mono">
            <Mono>{kpis.meanTimeToHireDays}</Mono>
            <span className="text-sm font-normal text-fg-muted ml-1">days</span>
          </span>
          {kpis.meanTimeToHireDelta !== 0 && (
            <span
              className={`flex items-center text-xs font-mono font-medium ${
                isTimeDecreased ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              {isTimeDecreased ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              <Mono>
                {kpis.meanTimeToHireDelta > 0 ? "+" : ""}
                {kpis.meanTimeToHireDelta}d
              </Mono>
            </span>
          )}
        </div>
        <span className="text-[11px] text-fg-muted mt-2">
          From application submit to offer accepted
        </span>
      </div>

      {/* 4. Offer Acceptance Rate */}
      <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Offer Acceptance
          </span>
          <Award className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-fg font-mono">
            <Mono>{kpis.offerAcceptanceRate}%</Mono>
          </span>
        </div>
        <span className="text-[11px] text-fg-muted mt-2">
          Accepted vs total extended offers
        </span>
      </div>

      {/* 5. Active SLA Breaches */}
      <Link
        href="/pipeline?sla=breached"
        className="p-4 bg-panel border border-danger/30 hover:border-danger/60 rounded-lg shadow-xs flex flex-col justify-between transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between text-danger mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SLA Breaches</span>
          </span>
          <span className="text-[10px] text-fg-muted group-hover:text-primary transition-colors">
            View in pipeline →
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-danger font-mono">
            <Mono>{kpis.activeSlaBreaches.total}</Mono>
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-danger font-semibold">
              <Mono>{kpis.activeSlaBreaches.critical}</Mono> crit
            </span>
            <span className="text-amber-500 font-medium">
              <Mono>{kpis.activeSlaBreaches.warning}</Mono> warn
            </span>
          </div>
        </div>
        <span className="text-[11px] text-fg-muted mt-2">
          Exceeded allowed dwell days in stage
        </span>
      </Link>
    </div>
  );
}
