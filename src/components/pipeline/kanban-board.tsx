"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Stage } from "@/lib/validations/common";
import type { ApplicationListItem } from "@/types/domain";
import { STAGE_THEME } from "@/lib/stage-theme";
import { KanbanColumn } from "./kanban-column";
import { CandidateCard } from "./candidate-card";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { useUiStore } from "@/stores/ui-store";
import confetti from "canvas-confetti";
import { Mono } from "../ui/mono";
import { toast } from "sonner";
import { clsx } from "clsx";

const ACTIVE_STAGES: Stage[] = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
];

const TERMINAL_STAGES: Stage[] = ["REJECTED", "WITHDRAWN"];

export interface KanbanBoardProps {
  applications: ApplicationListItem[];
}

export function KanbanBoard({ applications }: KanbanBoardProps) {
  const [activeApp, setActiveApp] = useState<ApplicationListItem | null>(null);
  const stageMutation = useStageMutation();
  const setRejectionModalAppId = useUiStore((s) => s.setRejectionModalAppId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group applications by stage
  const appsByStage: Record<Stage, ApplicationListItem[]> = {
    SOURCED: [],
    APPLIED: [],
    SCREENING: [],
    TECHNICAL_INTERVIEW: [],
    SYSTEM_DESIGN: [],
    OFFER: [],
    HIRED: [],
    REJECTED: [],
    WITHDRAWN: [],
  };

  for (const app of applications) {
    if (appsByStage[app.currentStage]) {
      appsByStage[app.currentStage].push(app);
    }
  }

  // Sort each stage by kanbanOrder ASC
  for (const stage of Object.keys(appsByStage) as Stage[]) {
    appsByStage[stage].sort((a, b) => a.kanbanOrder - b.kanbanOrder);
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = applications.find((a) => a.id === active.id);
    if (found) {
      setActiveApp(found);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);

    if (!over) return;

    const movingApp = applications.find((a) => a.id === active.id);
    if (!movingApp) return;

    // Determine target stage
    let targetStage: Stage | null = null;

    if (over.id in appsByStage) {
      targetStage = over.id as Stage;
    } else if (over.data?.current?.application) {
      targetStage = over.data.current.application.currentStage;
    } else if (over.data?.current?.stage) {
      targetStage = over.data.current.stage;
    }

    if (!targetStage) return;

    // Special case: Dropping into REJECTED requires disposition reason
    if (targetStage === "REJECTED") {
      setRejectionModalAppId(movingApp.id);
      return;
    }

    // Determine beforeId & afterId
    const targetColumn = appsByStage[targetStage].filter((a) => a.id !== movingApp.id);
    let beforeId: string | undefined = undefined;
    let afterId: string | undefined = undefined;

    if (over.data?.current?.application) {
      const overAppId = over.id as string;
      const overIndex = targetColumn.findIndex((a) => a.id === overAppId);
      if (overIndex !== -1) {
        const overCard = targetColumn[overIndex];
        if (movingApp.currentStage === targetStage && movingApp.kanbanOrder < (overCard?.kanbanOrder ?? 0)) {
          afterId = overCard?.id;
          beforeId = targetColumn[overIndex + 1]?.id;
        } else {
          beforeId = overCard?.id;
          afterId = targetColumn[overIndex - 1]?.id;
        }
      }
    } else {
      if (targetColumn.length > 0) {
        afterId = targetColumn[targetColumn.length - 1]?.id;
      }
    }

    // Check if nothing changed
    if (
      movingApp.currentStage === targetStage &&
      !beforeId &&
      !afterId
    ) {
      return;
    }

    // Dropping into HIRED triggers celebratory confetti!
    if (targetStage === "HIRED") {
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.6 },
        colors: ["#6366F1", "#10B981", "#8B5CF6", "#38BDF8", "#FBBF24"],
      });
    }

    stageMutation.mutate({
      applicationId: movingApp.id,
      input: {
        toStage: targetStage,
        beforeId,
        afterId,
        expectedVersion: movingApp.version,
      },
    });
  };

  const scrollToColumn = (stage: Stage) => {
    const el = document.getElementById(`kanban-col-${stage}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Minimap Stage-Progress Navigation Bar */}
      <div className="px-4 py-2 bg-panel/60 border-b border-hairline flex items-center gap-2 overflow-x-auto text-xs shrink-0 select-none">
        <span className="text-[10px] uppercase font-mono tracking-wider text-fg-muted font-semibold mr-1">
          Pipeline Map:
        </span>
        <div className="flex items-center gap-1.5">
          {ACTIVE_STAGES.map((st) => {
            const count = appsByStage[st].length;
            const theme = STAGE_THEME[st];
            return (
              <button
                key={st}
                onClick={() => scrollToColumn(st)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 transition-all font-mono"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-fg-muted hover:text-fg font-medium truncate">
                  {theme.label}
                </span>
                <span className="font-bold text-fg">
                  <Mono>{count}</Mono>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Kanban Columns Scroll Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-3.5 overflow-x-auto p-4 select-none min-h-[calc(100vh-180px)] custom-scrollbar">
          {ACTIVE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              applications={appsByStage[stage]}
            />
          ))}

          {TERMINAL_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              applications={appsByStage[stage]}
              defaultCollapsed
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeApp ? <CandidateCard application={activeApp} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
