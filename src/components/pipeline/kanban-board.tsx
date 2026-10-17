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
import { ApplicationListItem } from "@/lib/services/applications";
import { KanbanColumn } from "./kanban-column";
import { CandidateCard } from "./candidate-card";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { useUiStore } from "@/stores/ui-store";

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
        // Place relative to over card
        const overCard = targetColumn[overIndex];
        if (movingApp.currentStage === targetStage && movingApp.kanbanOrder < (overCard?.kanbanOrder ?? 0)) {
          // moving down
          afterId = overCard?.id;
          beforeId = targetColumn[overIndex + 1]?.id;
        } else {
          // moving up or from another column
          beforeId = overCard?.id;
          afterId = targetColumn[overIndex - 1]?.id;
        }
      }
    } else {
      // Dropped directly on column droppable: append to bottom
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-3 overflow-x-auto p-4 select-none min-h-[calc(100vh-140px)]">
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
  );
}
