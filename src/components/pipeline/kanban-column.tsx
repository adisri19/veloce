"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { StagePill } from "../ui/stage-pill";
import { Stage } from "@/lib/validations/common";
import { CandidateCard } from "./candidate-card";
import { ApplicationListItem } from "@/lib/services/applications";
import { Mono } from "../ui/mono";
import { ChevronDown, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

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
        className="w-12 h-full bg-panel border border-hairline rounded-lg p-3 flex flex-col items-center gap-4 cursor-pointer hover:border-fg-muted/40 transition-colors shrink-0 select-none"
      >
        <ChevronRight className="w-4 h-4 text-fg-muted" />
        <div className="rotate-90 origin-center whitespace-nowrap text-xs font-semibold text-fg-muted tracking-wider uppercase mt-4">
          {stage.replace("_", " ")}
        </div>
        <span className="font-mono text-xs font-bold text-fg bg-hairline px-1.5 py-0.5 rounded-full mt-auto">
          {applications.length}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-72 h-full bg-panel border rounded-lg flex flex-col shrink-0 select-none transition-colors ${
        isOver ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-hairline"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-hairline flex items-center justify-between shrink-0 bg-canvas/40">
        <div className="flex items-center gap-2">
          {defaultCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-fg-muted hover:text-fg"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          <StagePill stage={stage} size="sm" />
          <span className="font-mono text-xs font-semibold text-fg-muted">
            ({applications.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {slaBreachedCount > 0 && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-danger-surface text-danger text-[10px] font-mono font-bold border border-danger/30"
              title={`${slaBreachedCount} SLA breached`}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{slaBreachedCount}</span>
            </span>
          )}

          {avgScore !== null && (
            <span className="text-[10px] font-mono text-fg-muted font-medium" title="Average Match Score">
              avg <Mono>{avgScore}%</Mono>
            </span>
          )}

          <button
            onClick={() => setNewCandidateModalOpen(true)}
            className="text-fg-muted hover:text-fg p-0.5 rounded hover:bg-hairline"
            title="Add candidate to this job"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <CandidateCard key={app.id} application={app} />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className="h-32 flex items-center justify-center text-xs text-fg-muted/60 border border-dashed border-hairline rounded-md">
            No candidates
          </div>
        )}
      </div>
    </div>
  );
}
