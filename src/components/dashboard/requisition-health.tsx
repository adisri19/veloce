"use client";

import React from "react";
import Link from "next/link";
import { Stage } from "@/lib/validations/common";
import { Mono } from "../ui/mono";
import { MiniFunnel } from "../ui/mini-funnel";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ArrowRight,
  PauseCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export interface RequisitionHealthProps {
  requisitions: {
    id: string;
    code: string;
    title: string;
    status: string;
    headcountTotal: number;
    headcountFilled: number;
    daysOpen: number;
    activeByStage: Record<Stage, number>;
    slaBreaches: number;
    avgMatchScore: number;
    healthScore: number;
    healthLabel: "HEALTHY" | "AT_RISK" | "CRITICAL" | "FILLED" | "ON_HOLD";
  }[];
}

export function RequisitionHealth({ requisitions }: RequisitionHealthProps) {
  const getHealthBadge = (
    label: "HEALTHY" | "AT_RISK" | "CRITICAL" | "FILLED" | "ON_HOLD",
    score: number
  ) => {
    switch (label) {
      case "FILLED":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/[0.05] text-fg-muted border border-white/10">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Filled</span>
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <PauseCircle className="w-3 h-3 text-amber-400" />
            <span>On hold</span>
          </span>
        );
      case "HEALTHY":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{score} • Healthy</span>
          </span>
        );
      case "AT_RISK":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{score} • At Risk</span>
          </span>
        );
      case "CRITICAL":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>{score} • Critical</span>
          </span>
        );
    }
  };

  return (
    <div className="p-5 bg-panel border border-hairline rounded-xl shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fg">Requisition Pipeline Health</h3>
          <p className="text-xs text-fg-muted mt-0.5">
            Health scores computed from pipeline coverage ratio, dwell SLA breaches, and requisition age
          </p>
        </div>
        <Link
          href="/jobs"
          className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
        >
          <span>All requisitions</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Requisition Rows */}
      <div className="flex flex-col gap-2">
        {requisitions.map((req, index) => {
          const filled = req.headcountFilled;
          const total = req.headcountTotal || 1;
          const fillPct = Math.round((filled / total) * 100);

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="group p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-white/10 hover:bg-white/[0.03] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              {/* Left: Code, Title, Days open */}
              <div className="flex items-center gap-3.5 min-w-[260px]">
                {/* Mini Health Ring */}
                <div className="relative w-9 h-9 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                  <span
                    className={clsx(
                      "text-[11px] font-mono font-bold",
                      req.healthLabel === "CRITICAL"
                        ? "text-rose-400"
                        : req.healthLabel === "AT_RISK"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    )}
                  >
                    {req.healthScore}
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${req.id}`}
                      className="font-semibold text-sm text-fg group-hover:text-primary transition-colors"
                    >
                      {req.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-fg-muted">
                    <Mono className="text-[11px] text-fg-muted font-mono">{req.code}</Mono>
                    <span>•</span>
                    <span className="font-mono">{req.daysOpen}d open</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400/90">{req.avgMatchScore} avg match</span>
                  </div>
                </div>
              </div>

              {/* Headcount One-line Segmented Bar */}
              <div className="flex flex-col gap-1 w-36 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-fg-muted">Headcount:</span>
                  <span className="font-bold text-fg">
                    <Mono>{req.headcountFilled}/{req.headcountTotal}</Mono>
                  </span>
                </div>
                {/* Visual headcount segmented bar */}
                <div className="flex items-center gap-1 w-full h-1.5 rounded-full bg-white/[0.04] p-0.5">
                  {Array.from({ length: req.headcountTotal }).map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "flex-1 h-full rounded-full transition-colors",
                        i < req.headcountFilled
                          ? "bg-emerald-400"
                          : "bg-white/10"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Mini Funnel Pipeline Distribution */}
              <div className="flex-1 max-w-xs px-2 hidden sm:block">
                <span className="text-[10px] text-fg-muted font-mono block mb-1">
                  Active Pipeline Spread:
                </span>
                <MiniFunnel stages={req.activeByStage} />
              </div>

              {/* SLA Breaches warning */}
              {req.slaBreaches > 0 ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-semibold shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{req.slaBreaches} SLA breach{req.slaBreaches > 1 ? "es" : ""}</span>
                </div>
              ) : (
                <div className="text-xs font-mono text-fg-muted/60 shrink-0 hidden md:block">
                  No breaches
                </div>
              )}

              {/* Health Badge & Quick Link */}
              <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
                {getHealthBadge(req.healthLabel, req.healthScore)}
                <Link
                  href={`/pipeline?jobIds=${req.id}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  <span>Open pipeline</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
