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
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

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
  const [filterType, setFilterType] = useState<"ALL" | "SLA_BREACH" | "MISSING_SCORECARD">("ALL");

  const filteredItems = items.filter((item) => {
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  const slaCount = items.filter((i) => i.type === "SLA_BREACH").length;
  const scorecardCount = items.filter((i) => i.type === "MISSING_SCORECARD").length;

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
      const noteContent = `⚠️ **Automated SLA Nudge**: Application in ${item.stage.replace(/_/g, " ")} is overdue by ${item.daysOverdue} days. ${
        item.owedBy && item.owedBy.length > 0
          ? `Scorecard pending from: ${item.owedBy.join(", ")}`
          : "Please take prompt action."
      }`;

      await fetch(`/api/v1/applications/${item.applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent,
          isPrivate: false,
        }),
      });

      await fetch("/api/v1/automations/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      toast.success(
        `Nudge sent for ${item.candidateName} (${item.owedBy?.length ? item.owedBy.join(", ") : "Hiring Team"})`
      );
    } catch {
      toast.error("Failed to send nudge");
    } finally {
      setNudgingId(null);
    }
  };

  // Helper for candidate avatar initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-5 bg-panel border border-hairline rounded-xl shadow-xs flex flex-col gap-4">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-fg">Needs Attention Triage Queue</h3>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <Mono>{items.length}</Mono> pending
            </span>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            SLA-breached applications and pending scorecard submissions (30s live sync)
          </p>
        </div>

        {/* Segmented Filter */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 self-start sm:self-auto text-xs font-mono">
          <button
            onClick={() => setFilterType("ALL")}
            className={clsx(
              "px-3 py-1 rounded-md transition-all",
              filterType === "ALL"
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg"
            )}
          >
            All (<Mono>{items.length}</Mono>)
          </button>
          <button
            onClick={() => setFilterType("SLA_BREACH")}
            className={clsx(
              "px-3 py-1 rounded-md transition-all",
              filterType === "SLA_BREACH"
                ? "bg-rose-500 text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg"
            )}
          >
            SLA Breaches (<Mono>{slaCount}</Mono>)
          </button>
          <button
            onClick={() => setFilterType("MISSING_SCORECARD")}
            className={clsx(
              "px-3 py-1 rounded-md transition-all",
              filterType === "MISSING_SCORECARD"
                ? "bg-amber-500 text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg"
            )}
          >
            Scorecards (<Mono>{scorecardCount}</Mono>)
          </button>
        </div>
      </div>

      {/* Card List (Not a table) */}
      {filteredItems.length === 0 ? (
        /* Celebratory "Inbox Zero" SVG empty state */
        <div className="p-12 border border-dashed border-hairline/80 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-fg">Inbox Zero</h4>
            <p className="text-xs text-fg-muted max-w-sm mt-0.5">
              All clear! No applications currently breach stage SLAs or have pending interview scorecards.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {filteredItems.map((item, index) => {
              const isOverdue = item.daysOverdue > 0;
              const isCritical = item.severity === "CRITICAL";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={clsx(
                    "group relative rounded-xl p-3.5 border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3",
                    isCritical
                      ? "bg-rose-500/[0.03] border-rose-500/25 hover:border-rose-500/40"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/12"
                  )}
                >
                  {/* Left: Avatar + Candidate details */}
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                      {getInitials(item.candidateName)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDossier(item.applicationId, item.type)}
                          className="font-semibold text-sm text-fg hover:text-primary transition-colors text-left"
                        >
                          {item.candidateName}
                        </button>
                        <Mono className="text-[11px] text-fg-muted">
                          {item.candidateCode}
                        </Mono>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-fg-muted truncate max-w-[280px]">
                        <span className="truncate">{item.jobTitle}</span>
                        <span>•</span>
                        <Mono className="text-[10px] shrink-0">{item.jobCode}</Mono>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Stage pill, Days Overdue mono, Issue details & Owed By */}
                  <div className="flex items-center gap-4 flex-wrap flex-1">
                    <StagePill stage={item.stage} />

                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span
                        className={clsx(
                          "font-bold",
                          isCritical ? "text-rose-400" : "text-amber-400"
                        )}
                      >
                        <Mono>{item.daysOverdue}d over SLA</Mono>
                      </span>
                    </div>

                    <span className="text-xs text-fg-muted truncate max-w-[240px] hidden lg:inline">
                      {item.reason}
                    </span>

                    {item.owedBy && item.owedBy.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                        <Users className="w-3.5 h-3.5 text-fg-muted" />
                        <span className="text-[11px] font-mono text-fg-muted">
                          Owed by:{" "}
                          <span className="text-fg font-medium">
                            {item.owedBy.join(", ")}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNudge(item)}
                      disabled={nudgingId === item.id}
                      className="text-xs h-8 px-2.5 gap-1.5 border-hairline hover:border-fg-muted/40"
                    >
                      <Bell className="w-3 h-3 text-amber-400" />
                      <span>{nudgingId === item.id ? "Nudging…" : "Nudge"}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDossier(item.applicationId, item.type)}
                      className="text-xs h-8 px-2.5 gap-1 hover:bg-white/[0.04]"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
