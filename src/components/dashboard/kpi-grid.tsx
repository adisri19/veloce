"use client";

import React from "react";
import Link from "next/link";
import { Mono } from "../ui/mono";
import { SpotlightCard } from "../ui/spotlight-card";
import { AnimatedNumber } from "../ui/animated-number";
import { Sparkline } from "../ui/sparkline";
import {
  Users,
  Target,
  Clock,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronRight,
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

  // Sample 30-day pipeline volume trend for the sparkline
  const pipelineTrend = [22, 24, 23, 26, 25, 27, 26, 28, 29, 30, 31, kpis.activePipeline];

  // Headcount ring geometry
  const hcTotal = kpis.openHeadcount.total || 1;
  const hcFilled = kpis.openHeadcount.filled;
  const hcPct = Math.round((hcFilled / hcTotal) * 100);

  // SLA breach status
  const hasCritical = kpis.activeSlaBreaches.critical > 0;
  const totalBreaches = kpis.activeSlaBreaches.total;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
      {/* 1. Active Pipeline (5 Cols - Hero Bento Tile) */}
      <SpotlightCard className="lg:col-span-4 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
            Active Pipeline Volume
          </span>
          <div className="p-1.5 rounded-lg bg-primary-muted text-primary">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-end justify-between my-3">
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-fg font-mono tracking-tight leading-none">
              <AnimatedNumber value={kpis.activePipeline} />
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  isPipelineUp
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-hairline text-fg-muted"
                }`}
              >
                {isPipelineUp ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {isPipelineUp ? "+" : ""}
                {kpis.activePipelineDelta}%
              </span>
              <span className="text-[11px] text-fg-muted">vs previous period</span>
            </div>
          </div>

          {/* 30-Day Gradient Sparkline */}
          <div className="flex flex-col items-end gap-1">
            <Sparkline data={pipelineTrend} width={110} height={36} color="#6366F1" />
            <span className="text-[10px] text-fg-muted font-mono">30d velocity</span>
          </div>
        </div>

        {/* Stage distribution stacked bar */}
        <div className="pt-3 border-t border-hairline/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-fg-muted font-mono">
            <span>Stage Distribution</span>
            <span>7 active stages</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-0.5 bg-hairline/30">
            <div className="h-full bg-slate-500" style={{ width: "10%" }} title="Sourced" />
            <div className="h-full bg-sky-400" style={{ width: "20%" }} title="Applied" />
            <div className="h-full bg-indigo-500" style={{ width: "22%" }} title="Screening" />
            <div className="h-full bg-violet-400" style={{ width: "22%" }} title="Technical" />
            <div className="h-full bg-fuchsia-400" style={{ width: "16%" }} title="System Design" />
            <div className="h-full bg-amber-400" style={{ width: "10%" }} title="Offer" />
          </div>
        </div>
      </SpotlightCard>

      {/* 2. Open Headcount Progress (3 Cols) */}
      <SpotlightCard className="lg:col-span-3 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
            Headcount Progress
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between my-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl font-extrabold text-fg tracking-tight">
                <AnimatedNumber value={hcFilled} />
              </span>
              <span className="text-sm text-fg-muted font-medium">
                / {hcTotal} filled
              </span>
            </div>
            <span className="text-[11px] text-fg-muted mt-1">
              {hcTotal - hcFilled} open requisitions
            </span>
          </div>

          {/* Radial progress ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg width="56" height="56" className="rotate-[-90deg]">
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="currentColor"
                className="text-hairline/60"
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="#34D399"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - hcPct / 100)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute font-mono text-[11px] font-bold text-fg">
              {hcPct}%
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-hairline/60 flex items-center justify-between text-[11px] font-mono text-fg-muted">
          <span>Target: 100% Q1 Plan</span>
          <span className="text-emerald-400 font-bold">On track</span>
        </div>
      </SpotlightCard>

      {/* 3. Mean Time to Hire & Velocity (2.5 Cols) */}
      <SpotlightCard className="lg:col-span-2.5 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-fg-muted">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
            Time-to-Hire
          </span>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-fg font-mono tracking-tight">
              <AnimatedNumber value={kpis.meanTimeToHireDays} />
            </span>
            <span className="text-xs font-normal text-fg-muted">days</span>
            {kpis.meanTimeToHireDelta !== 0 && (
              <span
                className={`ml-auto flex items-center text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isTimeDecreased
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {isTimeDecreased ? "-" : "+"}
                {Math.abs(kpis.meanTimeToHireDelta)}d
              </span>
            )}
          </div>

          {/* Bullet gauge vs 25d target */}
          <div className="mt-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-fg-muted">
              <span>Actual: {kpis.meanTimeToHireDays}d</span>
              <span>Target: ≤25d</span>
            </div>
            <div className="w-full bg-hairline/60 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (kpis.meanTimeToHireDays / 35) * 100)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-fg-muted/80"
                style={{ left: `${(25 / 35) * 100}%` }}
                title="Target SLA 25 days"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-hairline/60 text-[11px] text-fg-muted font-mono flex items-center justify-between">
          <span>Efficiency</span>
          <span className="text-sky-400 font-bold">Ahead 4d</span>
        </div>
      </SpotlightCard>

      {/* 4. SLA Breaches (2.5 Cols - Glow Alert Tile) */}
      <SpotlightCard
        className={`lg:col-span-2.5 p-5 flex flex-col justify-between transition-all ${
          totalBreaches > 0
            ? "border-rose-500/40 shadow-[0_0_24px_rgba(251,113,133,0.12)] bg-rose-500/[0.02]"
            : "border-hairline"
        }`}
      >
        <div className="flex items-center justify-between text-rose-400">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
              SLA Breaches
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-rose-400 font-mono tracking-tight leading-none">
              <AnimatedNumber value={totalBreaches} />
            </span>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono">
              <span className="text-rose-400 font-bold">
                <Mono>{kpis.activeSlaBreaches.critical}</Mono> crit
              </span>
              <span>•</span>
              <span className="text-amber-400 font-medium">
                <Mono>{kpis.activeSlaBreaches.warning}</Mono> warn
              </span>
            </div>
          </div>

          <Link
            href="/pipeline?slaBreachedOnly=true"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors group focus-visible:outline-none"
          >
            <span>Review</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Crit / Warn split progress bar */}
        <div className="pt-3 border-t border-rose-500/20 flex flex-col gap-1">
          <div className="w-full bg-hairline/40 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-rose-500 h-full"
              style={{
                width: `${(kpis.activeSlaBreaches.critical / (totalBreaches || 1)) * 100}%`,
              }}
              title="Critical Breaches (>2x SLA)"
            />
            <div
              className="bg-amber-400 h-full"
              style={{
                width: `${(kpis.activeSlaBreaches.warning / (totalBreaches || 1)) * 100}%`,
              }}
              title="Warning (>75% SLA)"
            />
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
