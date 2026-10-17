"use client";

import React, { useState } from "react";
import { Stage } from "@/lib/validations/common";
import { StagePill } from "../ui/stage-pill";
import { Mono } from "../ui/mono";
import { Button } from "../ui/button";
import { useUiStore } from "@/stores/ui-store";
import {
  AlertTriangle,
  Clock,
  Bell,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export interface NeedsAttentionQueueProps {
  items: {
    id: string;
    applicationId: string;
    candidateName: string;
    candidateCode: string;
    jobTitle: string;
    jobCode: string;
    stage: Stage;
    type: "SLA_BREACH" | "MISSING_SCORECARD";
    severity: "CRITICAL" | "WARNING";
    reason: string;
    daysOverdue: number;
    owedBy?: string[];
  }[];
}

export function NeedsAttentionQueue({ items }: NeedsAttentionQueueProps) {
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const setActiveDossierTab = useUiStore((s) => s.setActiveDossierTab);
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  const handleOpenDossier = (
    applicationId: string,
    type: "SLA_BREACH" | "MISSING_SCORECARD"
  ) => {
    setActiveDossierId(applicationId);
    if (type === "MISSING_SCORECARD") {
      setActiveDossierTab("scorecards");
    } else {
      setActiveDossierTab("timeline");
    }
  };

  const handleNudge = async (item: (typeof items)[0]) => {
    setNudgingId(item.id);
    try {
      // 1. Post a CandidateNote with mention
      const noteContent = `⚠️ **Automated SLA Nudge**: Application in ${item.stage.replace(/_/g, " ")} is overdue by ${item.daysOverdue} days. ${
        item.owedBy && item.owedBy.length > 0
          ? `Scorecard pending from: ${item.owedBy.join(", ")}`
          : "Please take action."
      }`;

      await fetch(`/api/v1/applications/${item.applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent,
          isPrivate: false,
        }),
      });

      // 2. Dispatch automation webhooks
      await fetch("/api/v1/automations/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      toast.success(
        `Nudge sent for ${item.candidateName} (${item.owedBy ? item.owedBy.join(", ") : "Hiring Team"})`
      );
    } catch {
      toast.error("Failed to send nudge");
    } finally {
      setNudgingId(null);
    }
  };

  return (
    <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-fg">Needs Attention Triage Queue</h3>
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          </div>
          <p className="text-xs text-fg-muted">
            Live queue of SLA-breached applications and pending scorecard submissions (auto-refreshing)
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-danger bg-danger-surface px-2 py-0.5 rounded border border-danger/30">
          <Mono>{items.length}</Mono> items pending
        </span>
      </div>

      <div className="overflow-x-auto border border-hairline rounded-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas/60 border-b border-hairline text-fg-muted uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Candidate</th>
              <th className="py-2.5 px-3">Requisition</th>
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3">Issue</th>
              <th className="py-2.5 px-3">Overdue</th>
              <th className="py-2.5 px-3">Owed By</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-hairline/30 transition-colors">
                <td className="py-2.5 px-3">
                  <button
                    onClick={() => handleOpenDossier(item.applicationId, item.type)}
                    className="flex flex-col text-left group"
                  >
                    <span className="font-bold text-fg group-hover:text-primary transition-colors">
                      {item.candidateName}
                    </span>
                    <Mono className="text-[10px] text-fg-muted">
                      {item.candidateCode}
                    </Mono>
                  </button>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-col truncate max-w-[180px]">
                    <span className="font-medium text-fg truncate">
                      {item.jobTitle}
                    </span>
                    <span className="text-[10px] text-fg-muted font-mono">
                      {item.jobCode}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <StagePill stage={item.stage} size="xs" />
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`flex items-center gap-1.5 font-medium ${
                      item.type === "SLA_BREACH"
                        ? "text-danger"
                        : "text-amber-500"
                    }`}
                  >
                    {item.type === "SLA_BREACH" ? (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{item.reason}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-danger">
                  <Mono>+{item.daysOverdue}d</Mono>
                </td>
                <td className="py-2.5 px-3 text-fg-muted font-medium">
                  {item.owedBy && item.owedBy.length > 0 ? (
                    <span className="text-fg">{item.owedBy.join(", ")}</span>
                  ) : (
                    <span>Hiring Manager</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={<Bell className="w-3 h-3 text-amber-500" />}
                      onClick={() => handleNudge(item)}
                      isLoading={nudgingId === item.id}
                      title="Send automated nudge note with @mention"
                    >
                      Nudge
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<ArrowRight className="w-3 h-3" />}
                      onClick={() => handleOpenDossier(item.applicationId, item.type)}
                      title="Open 360° Candidate Dossier"
                    >
                      Open
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-xs text-fg-muted"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>All applications and scorecards are on schedule!</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
