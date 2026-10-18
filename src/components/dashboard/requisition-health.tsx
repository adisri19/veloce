"use client";

import React from "react";
import Link from "next/link";
import { Stage } from "@/lib/validations/common";
import { Mono } from "../ui/mono";
import { Badge } from "../ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react";

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
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-hairline text-fg-muted border border-hairline/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Filled</span>
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>On hold</span>
          </span>
        );
      case "HEALTHY":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-success-surface text-success border border-success/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>{score} • Healthy</span>
          </span>
        );
      case "AT_RISK":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-warn-surface text-warn border border-warn/30">
            <AlertTriangle className="w-3 h-3" />
            <span>{score} • At Risk</span>
          </span>
        );
      case "CRITICAL":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-danger-surface text-danger border border-danger/30">
            <XCircle className="w-3 h-3" />
            <span>{score} • Critical</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-fg">Requisition Pipeline Health</h3>
          <p className="text-xs text-fg-muted">
            Health scores computed from pipeline coverage ratio, dwell SLA breaches, and requisition age
          </p>
        </div>
        <Link
          href="/jobs"
          className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
        >
          <span>Manage requisitions</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto border border-hairline rounded-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas/60 border-b border-hairline text-fg-muted uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Requisition</th>
              <th className="py-2.5 px-3">Headcount</th>
              <th className="py-2.5 px-3">Days Open</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Avg Match</th>
              <th className="py-2.5 px-3">SLA Overdue</th>
              <th className="py-2.5 px-3">Health Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {requisitions.map((req) => (
              <tr
                key={req.id}
                className="hover:bg-hairline/30 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <Link
                    href={`/jobs/${req.id}`}
                    className="flex flex-col group min-w-[200px]"
                  >
                    <span className="font-bold text-fg group-hover:text-primary transition-colors">
                      {req.title}
                    </span>
                    <Mono className="text-[10px] text-fg-muted font-mono">
                      {req.code}
                    </Mono>
                  </Link>
                </td>
                <td className="py-2.5 px-3 font-mono font-medium">
                  <Mono>
                    {req.headcountFilled} / {req.headcountTotal}
                  </Mono>
                </td>
                <td className="py-2.5 px-3 font-mono text-fg-muted">
                  <Mono>{req.daysOpen}d</Mono>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      req.status === "OPEN"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : req.status === "PAUSED"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-hairline text-fg-muted"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-fg">
                  <Mono>{req.avgMatchScore}%</Mono>
                </td>
                <td className="py-2.5 px-3">
                  {req.slaBreaches > 0 ? (
                    <span className="text-danger font-mono font-bold">
                      {req.slaBreaches} breached
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-mono text-[11px]">
                      0 breaches
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {getHealthBadge(req.healthLabel, req.healthScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
