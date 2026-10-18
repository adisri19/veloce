"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Stage } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";
import { CandidateCard } from "./candidate-card";
import type { ApplicationListItem } from "@/types/domain";
import { Mono } from "../ui/mono";
import { ChevronDown, ChevronRight, Plus, AlertTriangle, Users } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { clsx } from "clsx";

export interface KanbanColumnProps {
  stage: Stage;
  applications: ApplicationListItem[];
  defaultCollapsed?: boolean;
}

export function KanbanColumn({
  stage,
  applications,
  defaultCollapsed = false,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const setNewCandidateModalOpen = useUiStore((s) => s.setNewCandidateModalOpen);

  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  const stageTheme = STAGE_THEME[stage] || {
    label: stage,
    color: "#6366F1",
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.3)",
  };

  // Calculate column stats
  let totalScore = 0;
  let slaBreachedCount = 0;
  for (const app of applications) {
    totalScore += app.aiMatchScore;
    if (app.slaState === "BREACHED") slaBreachedCount++;
  }
  const avgScore = applications.length > 0 ? Math.round(totalScore / applications.length) : null;
  const itemIds = applications.map((a) => a.id);

  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={() => setIsCollapsed(false)}
        className={clsx(
          "w-12 h-full bg-panel border rounded-xl p-3 flex flex-col items-center gap-4 cursor-pointer transition-all shrink-0 select-none",
          isOver
            ? "border-primary ring-2 ring-primary/20 bg-primary/10"
            : "border-hairline hover:border-fg-muted/40 hover:bg-white/[0.02]"
        )}
        title={`Expand ${stageTheme.label} (${applications.length} candidates)`}
      >
        <ChevronRight className="w-4 h-4 text-fg-muted" />
        <div className="rotate-90 origin-center whitespace-nowrap text-xs font-semibold text-fg-muted tracking-wider uppercase mt-6">
          {stageTheme.label}
        </div>
        <span className="font-mono text-xs font-bold text-fg bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full mt-auto">
          {applications.length}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      id={`kanban-col-${stage}`}
      className={clsx(
        "w-[300px] h-full bg-panel border rounded-xl flex flex-col shrink-0 select-none transition-all duration-150 overflow-hidden relative",
        isOver
          ? "border-primary ring-2 ring-primary/30 bg-primary/[0.04]"
          : "border-hairline"
      )}
    >
      {/* Top tinted stage gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: stageTheme.color }}
      />

      {/* Column Sticky Header */}
      <div
        className="p-3 border-b border-hairline flex items-center justify-between shrink-0 relative"
        style={{
          background: `linear-gradient(180deg, ${stageTheme.color}0D 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-center gap-2">
          {defaultCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-fg-muted hover:text-fg p-0.5"
              title="Collapse column"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Stage Dot & Label */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: stageTheme.color }}
            />
            <span className="text-xs font-bold text-fg tracking-tight">
              {stageTheme.label}
            </span>
          </div>

          <span className="font-mono text-xs font-semibold text-fg-muted">
            (<Mono>{applications.length}</Mono>)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {slaBreachedCount > 0 && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-mono font-bold border border-rose-500/30 animate-pulse"
              title={`${slaBreachedCount} SLA breached`}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{slaBreachedCount}</span>
            </span>
          )}

          {avgScore !== null && (
            <span
              className="text-[10px] font-mono text-fg-muted px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]"
              title="Average AI match score in stage"
            >
              <Mono>{avgScore}%</Mono>
            </span>
          )}

          <button
            onClick={() => setNewCandidateModalOpen(true)}
            className="text-fg-muted hover:text-fg p-1 rounded hover:bg-white/[0.06] transition-colors"
            title="Add candidate"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards List with Drag Context */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <CandidateCard key={app.id} application={app} />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-hairline/80 rounded-xl bg-white/[0.01] gap-2">
            <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-fg-muted">
              <Users className="w-4 h-4 opacity-40" />
            </div>
            <span className="text-xs text-fg-muted font-medium">No candidates in {stageTheme.label}</span>
            <span className="text-[10px] text-fg-muted/60">Drag candidates here to advance</span>
          </div>
        )}
      </div>
    </div>
  );
}
