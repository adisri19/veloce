"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { ScoreRing } from "../ui/score-ring";
import { SlaChip } from "../ui/sla-chip";
import { useUiStore } from "@/stores/ui-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useCompareStore } from "@/stores/compare-store";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import type { ApplicationListItem } from "@/types/domain";
import { STAGE_THEME, getScoreTheme } from "@/lib/stage-theme";
import {
  Star,
  GripVertical,
  ExternalLink,
  Scale,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

export interface CandidateCardProps {
  application: ApplicationListItem;
  isOverlay?: boolean;
}

const STAGE_ORDER = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
];

export function CandidateCard({ application, isOverlay = false }: CandidateCardProps) {
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const { selectedIds } = useSelectionStore();
  const { addCandidate } = useCompareStore();
  const stageMutation = useStageMutation();

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
    boxShadow: isOverlay
      ? `0 20px 40px -15px ${STAGE_THEME[application.currentStage]?.color || "#6366F1"}40`
      : undefined,
  };

  const scoreTheme = getScoreTheme(application.aiMatchScore);
  const isTopScore = application.aiMatchScore >= 88;

  const topSkills = application.candidate.skills.slice(0, 3);
  const extraSkillsCount = application.candidate.skills.length - 3;

  const handleAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = STAGE_ORDER.indexOf(application.currentStage);
    if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIndex + 1] as any;
      stageMutation.mutate({
        applicationId: application.id,
        input: {
          toStage: nextStage,
          expectedVersion: application.version,
        },
      });
    }
  };

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = addCandidate({
      id: application.id,
      candidateId: application.candidate.id,
      name: application.candidate.fullName,
      avatarUrl: application.candidate.avatarUrl,
      code: application.candidate.publicCode,
    });
    if (!added) {
      toast.error("Maximum 4 candidates can be compared at once");
    } else {
      toast.success(`Added ${application.candidate.fullName} to comparison`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setActiveDossierId(application.id)}
      className={clsx(
        "group relative p-3.5 bg-white/[0.03] border rounded-xl shadow-xs transition-all duration-150 cursor-pointer select-none flex flex-col gap-2.5",
        isSelected
          ? "ring-2 ring-indigo-500 border-indigo-500/80 bg-indigo-500/[0.04]"
          : "border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-lg",
        isOverlay && "shadow-2xl rotate-2 scale-102 border-indigo-500/60 z-50 bg-zinc-900/95 backdrop-blur-xl"
      )}
    >
      {/* ROW 1: avatar (score-colored ring) · name (with top-score star) · ScoreRing */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-fg-muted/40 hover:text-fg-muted cursor-grab active:cursor-grabbing p-0.5 -ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag card"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Avatar with score-colored ring */}
          <div
            className="rounded-full p-0.5 shrink-0"
            style={{
              boxShadow: `0 0 0 1.5px ${scoreTheme.color}`,
            }}
          >
            <Avatar
              name={application.candidate.fullName}
              src={application.candidate.avatarUrl}
              size="sm"
            />
          </div>

          {/* Name + Star Marker */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-bold text-fg truncate">
              {application.candidate.fullName}
            </span>
            {isTopScore && (
              <span title="Top 10% Match Score">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
              </span>
            )}
          </div>
        </div>

        {/* Score Ring */}
        <div className="shrink-0">
          <ScoreRing score={application.aiMatchScore} size="sm" />
        </div>
      </div>

      {/* ROW 2: CAND-1001 · REQ-2026-01 in mono on ONE line, never wrapped or truncated */}
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted font-mono whitespace-nowrap overflow-hidden">
        <Mono className="text-fg-muted font-bold whitespace-nowrap">
          {application.candidate.publicCode}
        </Mono>
        <span className="opacity-40">·</span>
        <Mono className="text-fg-muted/80 whitespace-nowrap">
          {application.job.code}
        </Mono>
      </div>

      {/* ROW 3: title · company (single-line truncate with tooltip) */}
      <div
        className="text-[11px] text-fg-muted truncate"
        title={`${application.candidate.currentTitle || "Software Engineer"} at ${application.candidate.currentCompany || "N/A"}`}
      >
        <span className="text-fg/90 font-medium">
          {application.candidate.currentTitle || "Software Engineer"}
        </span>{" "}
        <span className="opacity-50 font-normal">at</span>{" "}
        <span className="text-fg-muted">
          {application.candidate.currentCompany || "N/A"}
        </span>
      </div>

      {/* ROW 4: skill chips (max 3 + +n) */}
      <div className="flex items-center gap-1 flex-wrap">
        {topSkills.map((sk) => (
          <span
            key={sk}
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium truncate max-w-[85px] border bg-white/[0.03] text-fg-muted border-white/[0.06]"
          >
            {sk}
          </span>
        ))}
        {extraSkillsCount > 0 && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-white/[0.02] border border-white/[0.05] text-fg-muted font-mono">
            +{extraSkillsCount}
          </span>
        )}
      </div>

      {/* FOOTER: SlaChip left, scorecard stars/count + source right */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-[11px] text-fg-muted">
        <SlaChip
          daysInStage={application.daysInStage}
          slaDays={application.slaDays}
          slaState={application.slaState}
        />

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {application.avgScorecard !== null && (
            <span
              className="flex items-center gap-1 text-amber-400 font-semibold"
              title="Scorecard average rating"
            >
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{application.avgScorecard}</span>
            </span>
          )}
          {application.scorecardCount > 0 && (
            <span title="Total scorecards submitted" className="text-fg-muted">
              <Mono>{application.scorecardCount} sc</Mono>
            </span>
          )}
          <span className="text-fg-muted/60 text-[9px] uppercase px-1 rounded bg-white/[0.02] border border-white/[0.04]">
            {application.candidate.source}
          </span>
        </div>
      </div>

      {/* Quick Action Overlay Buttons on Hover */}
      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg z-20">
        <button
          onClick={handleAddToCompare}
          className="p-1 text-fg-muted hover:text-indigo-400 hover:bg-white/[0.06] rounded transition-colors"
          title="Add to comparison tray"
        >
          <Scale className="w-3 h-3" />
        </button>

        {STAGE_ORDER.indexOf(application.currentStage) < STAGE_ORDER.length - 1 && (
          <button
            onClick={handleAdvance}
            className="p-1 text-fg-muted hover:text-emerald-400 hover:bg-white/[0.06] rounded transition-colors"
            title="Advance to next stage"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        <button
          onClick={() => setActiveDossierId(application.id)}
          className="p-1 text-fg-muted hover:text-fg hover:bg-white/[0.06] rounded transition-colors"
          title="Open candidate dossier"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
