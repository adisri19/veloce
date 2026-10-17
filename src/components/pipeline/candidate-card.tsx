"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { ScoreBadge } from "../ui/score-badge";
import { SlaBadge } from "../ui/sla-badge";
import { useUiStore } from "@/stores/ui-store";
import { useSelectionStore } from "@/stores/selection-store";
import type { ApplicationListItem } from "@/types/domain";
import { MessageSquare, Star, GripVertical } from "lucide-react";


export interface CandidateCardProps {
  application: ApplicationListItem;
  isOverlay?: boolean;
}

export function CandidateCard({ application, isOverlay = false }: CandidateCardProps) {
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const { selectedIds, toggle } = useSelectionStore();
  const isSelected = selectedIds.includes(application.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
    data: { application },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const topSkills = application.candidate.skills.slice(0, 3);
  const extraSkillsCount = application.candidate.skills.length - 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setActiveDossierId(application.id)}
      className={`group relative p-3 bg-card border rounded-md shadow-xs hover:border-fg-muted/40 transition-all cursor-pointer select-none flex flex-col gap-2 ${
        isSelected ? "ring-2 ring-primary border-primary" : "border-hairline"
      } ${isOverlay ? "shadow-2xl rotate-1 scale-105 border-primary" : ""}`}
    >
      {/* Top Header: Avatar, Name, Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-fg-muted/40 hover:text-fg-muted cursor-grab active:cursor-grabbing p-0.5 -ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag card"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <Avatar
            name={application.candidate.fullName}
            src={application.candidate.avatarUrl}
            size="sm"
          />

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-fg truncate">
              {application.candidate.fullName}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-fg-muted font-mono">
              <Mono>{application.candidate.publicCode}</Mono>
              <span>•</span>
              <span className="truncate max-w-[90px]">{application.job.code}</span>
            </div>
          </div>
        </div>

        <ScoreBadge score={application.aiMatchScore} size="sm" />
      </div>

      {/* Role & Company */}
      <div className="text-[11px] text-fg-muted truncate">
        {application.candidate.currentTitle || "Software Engineer"}{" "}
        <span className="opacity-60">at</span> {application.candidate.currentCompany || "N/A"}
      </div>

      {/* Skills Chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {topSkills.map((sk) => (
          <span
            key={sk}
            className="text-[10px] px-1.5 py-0.2 rounded bg-hairline/50 text-fg-muted font-medium truncate max-w-[80px]"
          >
            {sk}
          </span>
        ))}
        {extraSkillsCount > 0 && (
          <span className="text-[10px] px-1 py-0.2 rounded bg-hairline/30 text-fg-muted font-mono">
            +{extraSkillsCount}
          </span>
        )}
      </div>

      {/* Footer Clock & Scorecard Average */}
      <div className="flex items-center justify-between pt-1 border-t border-hairline/50 text-[11px] text-fg-muted">
        <SlaBadge
          slaState={application.slaState}
          daysInStage={application.daysInStage}
          slaDays={application.slaDays}
        />

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {application.avgScorecard !== null && (
            <span className="flex items-center gap-1 text-amber-500 font-semibold" title="Scorecard average">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{application.avgScorecard}</span>
            </span>
          )}
          {application.scorecardCount > 0 && (
            <span title="Scorecard count">
              <Mono>{application.scorecardCount} sc</Mono>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
