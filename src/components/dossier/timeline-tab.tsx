"use client";

import React, { useState } from "react";
import { Avatar } from "../ui/avatar";
import { StagePill } from "../ui/stage-pill";
import { Mono } from "../ui/mono";
import { ArrowRight, History, Shield, Filter } from "lucide-react";
import { Stage } from "@/lib/validations/common";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function TimelineTab({ dossier }: { dossier: any }) {
  const [filterType, setFilterType] = useState<"ALL" | "STAGE" | "AUDIT">("ALL");

  const transitions = dossier.transitions || [];
  const auditLogs = dossier.auditLogs || [];

  // Merge and sort chronologically descending
  const timelineEntries: any[] = [];

  if (filterType === "ALL" || filterType === "STAGE") {
    for (const t of transitions) {
      timelineEntries.push({
        id: `trans-${t.id}`,
        type: "TRANSITION",
        timestamp: new Date(t.timestamp),
        actor: t.movedBy,
        data: t,
      });
    }
  }

  if (filterType === "ALL" || filterType === "AUDIT") {
    for (const a of auditLogs) {
      timelineEntries.push({
        id: `audit-${a.id}`,
        type: "AUDIT",
        timestamp: new Date(a.createdAt),
        actor: a.actor,
        data: a,
      });
    }
  }

  timelineEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-fg uppercase tracking-wider">
            Candidate Journey & Immutable Audit Trail
          </h4>
        </div>

        <div className="flex items-center gap-1 bg-canvas border border-hairline p-0.5 rounded-md">
          {(["ALL", "STAGE", "AUDIT"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterType(mode)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded select-none transition-colors ${
                filterType === mode
                  ? "bg-panel text-fg font-semibold shadow-xs"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 border-l-2 border-hairline flex flex-col gap-6 ml-3 my-2">
        {timelineEntries.length > 0 ? (
          timelineEntries.map((entry) => {
            const isTransition = entry.type === "TRANSITION";
            return (
              <div key={entry.id} className="relative flex flex-col gap-2">
                {/* Node icon / dot */}
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-panel border-2 border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                {/* Entry Card */}
                <div className="p-3.5 bg-canvas border border-hairline rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.actor ? (
                        <>
                          <Avatar name={entry.actor.name} src={entry.actor.avatarUrl} size="xs" />
                          <span className="text-xs font-semibold text-fg">{entry.actor.name}</span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-fg">System Automation</span>
                      )}
                      <span className="text-[10px] text-fg-muted font-mono">
                        {entry.timestamp.toLocaleDateString()} at{" "}
                        {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-hairline/40 text-fg-muted">
                      {isTransition ? "Stage Move" : entry.data.action}
                    </span>
                  </div>

                  {/* Transition content */}
                  {isTransition && (
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                      {entry.data.fromStage ? (
                        <StagePill stage={entry.data.fromStage as Stage} size="sm" />
                      ) : (
                        <span className="text-xs text-fg-muted font-mono">APPLIED</span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-fg-muted" />
                      <StagePill stage={entry.data.toStage as Stage} size="sm" />

                      {entry.data.durationInPreviousStageSeconds > 0 && (
                        <span className="text-[11px] text-fg-muted ml-2 font-mono">
                          Dwell duration:{" "}
                          <strong className="text-fg">
                            {formatDuration(entry.data.durationInPreviousStageSeconds)}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Audit details */}
                  {!isTransition && entry.data.metadata && (
                    <div className="text-[11px] font-mono text-fg-muted bg-panel p-2 rounded border border-hairline/60 overflow-x-auto">
                      {JSON.stringify(entry.data.metadata, null, 2)}
                    </div>
                  )}

                  {entry.data.reason && (
                    <p className="text-xs text-fg-muted italic">
                      Reason: &ldquo;{entry.data.reason}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-fg-muted">No timeline entries found.</div>
        )}
      </div>

      {/* Immutability footer badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-fg-muted pt-4 border-t border-hairline/60 select-none">
        <Shield className="w-4 h-4 text-emerald-500" />
        <span>Audit entries and transition dwell times are append-only and cryptographically immutable.</span>
      </div>
    </div>
  );
}
