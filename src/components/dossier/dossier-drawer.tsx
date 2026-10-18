"use client";

import React, { useEffect } from "react";
import { Drawer } from "../ui/drawer";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { ScoreRing } from "../ui/score-ring";
import { SlaChip } from "../ui/sla-chip";
import { StagePill } from "../ui/stage-pill";
import { Button, IconButton } from "../ui/button";
import { Tabs } from "../ui/tabs";
import { useUiStore } from "@/stores/ui-store";
import { useApplication } from "@/hooks/use-application";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { useCompareStore } from "@/stores/compare-store";
import { OverviewTab } from "./overview-tab";
import { ScorecardsTab } from "./scorecards-tab";
import { NotesTab } from "./notes-tab";
import { InterviewsTab } from "./interviews-tab";
import { TimelineTab } from "./timeline-tab";
import {
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Scale,
  Sparkles,
  ChevronRight,
  Archive,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Stage, ALL_STAGES } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";
import { toast } from "sonner";
import { clsx } from "clsx";

const ACTIVE_STEPPER_STAGES: Stage[] = [
  "SOURCED",
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "SYSTEM_DESIGN",
  "OFFER",
  "HIRED",
];

export function DossierDrawer() {
  const activeDossierId = useUiStore((s) => s.activeDossierId);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const activeTab = useUiStore((s) => s.activeDossierTab);
  const setActiveTab = useUiStore((s) => s.setActiveDossierTab);

  const addCandidateToCompare = useCompareStore((s) => s.addCandidate);
  const { data: dossier, isLoading } = useApplication(activeDossierId);
  const stageMutation = useStageMutation();

  const isOpen = Boolean(activeDossierId);
  const onClose = () => setActiveDossierId(null);

  // Keyboard shortcuts ⌥1-5 to switch tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          setActiveTab("overview");
        } else if (e.key === "2") {
          e.preventDefault();
          setActiveTab("scorecards");
        } else if (e.key === "3") {
          e.preventDefault();
          setActiveTab("notes");
        } else if (e.key === "4") {
          e.preventDefault();
          setActiveTab("interviews");
        } else if (e.key === "5") {
          e.preventDefault();
          setActiveTab("timeline");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setActiveTab]);

  if (!isOpen) return null;

  const tabItems = [
    { id: "overview", label: "Overview & Match" },
    { id: "scorecards", label: "Scorecards", count: dossier?.scorecards?.length },
    { id: "notes", label: "Notes", count: dossier?.notes?.length },
    { id: "interviews", label: "Interviews", count: dossier?.interviews?.length },
    { id: "timeline", label: "Audit Timeline" },
  ];

  const handleStageChange = async (toStage: Stage) => {
    if (!dossier || toStage === dossier.currentStage) return;
    await stageMutation.mutateAsync({
      applicationId: dossier.id,
      input: { toStage },
    });
  };

  const handleAddToCompare = () => {
    if (!dossier) return;
    const ok = addCandidateToCompare({
      id: dossier.id,
      candidateId: dossier.candidate.id,
      name: dossier.candidate.fullName,
      avatarUrl: dossier.candidate.avatarUrl,
      code: dossier.candidate.publicCode,
    });
    if (ok) {
      toast.success(`Added ${dossier.candidate.fullName} to comparison basket`);
    } else {
      toast.error("Comparison basket is full (max 4 candidates)");
    }
  };

  // Derive dwell times per stage from transitions
  const dwellByStage: Partial<Record<Stage, string>> = {};
  if (dossier?.transitions) {
    for (const t of dossier.transitions) {
      if (t.fromStage && t.durationInPreviousStageSeconds > 0) {
        const days = (t.durationInPreviousStageSeconds / 86400).toFixed(1);
        dwellByStage[t.fromStage as Stage] = `${days}d`;
      }
    }
  }

  const currentStageIndex = ACTIVE_STEPPER_STAGES.indexOf(
    (dossier?.currentStage || "APPLIED") as Stage
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[720px]"
      title={
        isLoading || !dossier ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="w-36 h-5 bg-white/[0.04] rounded animate-pulse" />
              <div className="w-24 h-3 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={dossier.candidate.fullName}
                src={dossier.candidate.avatarUrl}
                size="lg"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[22px] font-bold tracking-tight text-fg truncate">
                  {dossier.candidate.fullName}
                </h2>
                <Mono className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-fg-muted font-bold text-xs whitespace-nowrap">
                  {dossier.candidate.publicCode}
                </Mono>
              </div>
              <span className="text-xs text-fg-muted truncate mt-0.5">
                {dossier.candidate.currentTitle || "Software Engineer"}{" "}
                <span className="opacity-50">at</span>{" "}
                {dossier.candidate.currentCompany || "N/A"}
              </span>
            </div>
          </div>
        )
      }
      subtitle={
        dossier && (
          <div className="flex flex-col gap-3 mt-3 w-full">
            {/* Meta Row: Job chip, Stage, ScoreRing, SlaChip, Action links */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 font-mono">
                {dossier.job.code}: {dossier.job.title}
              </span>

              {/* Stage dropdown */}
              <div className="relative">
                <select
                  value={dossier.currentStage}
                  onChange={(e) => handleStageChange(e.target.value as Stage)}
                  className="text-xs bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1 text-fg font-medium cursor-pointer hover:border-white/20 transition-colors focus:ring-1 focus:ring-primary"
                >
                  {ALL_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <ScoreRing score={dossier.aiMatchScore} size="sm" />

              <SlaChip
                slaState={dossier.slaStatus.slaState}
                daysInStage={dossier.slaStatus.daysInStage}
                slaDays={dossier.slaStatus.slaDays}
              />

              {/* Quick links & actions */}
              <div className="flex items-center gap-1.5 ml-auto">
                {dossier.candidate.email && (
                  <a
                    href={`mailto:${dossier.candidate.email}`}
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-fg-muted hover:text-fg transition-colors"
                    title={`Email ${dossier.candidate.email}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
                {dossier.candidate.linkedinUrl && (
                  <a
                    href={dossier.candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-fg-muted hover:text-primary transition-colors"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {dossier.candidate.githubUrl && (
                  <a
                    href={dossier.candidate.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-fg-muted hover:text-fg transition-colors"
                    title="GitHub Profile"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  variant="outline"
                  size="xs"
                  icon={<Scale className="w-3 h-3" />}
                  onClick={handleAddToCompare}
                  className="text-xs ml-1"
                >
                  Compare
                </Button>
              </div>
            </div>

            {/* Stage Progress Stepper of 7 dots with dwell times */}
            <div className="pt-2 border-t border-hairline/60">
              <div className="flex items-center justify-between relative px-2">
                {/* Stepper background line */}
                <div className="absolute left-6 right-6 top-2 h-0.5 bg-white/[0.06] -z-10" />

                {ACTIVE_STEPPER_STAGES.map((st, i) => {
                  const isCompleted = i < currentStageIndex;
                  const isCurrent = i === currentStageIndex;
                  const theme = STAGE_THEME[st];
                  const dwell = isCompleted
                    ? dwellByStage[st] || "—"
                    : isCurrent
                    ? `${dossier.slaStatus.daysInStage.toFixed(1)}d`
                    : null;

                  return (
                    <div
                      key={st}
                      className="flex flex-col items-center gap-1 min-w-[50px] text-center"
                    >
                      {/* Stepper Dot */}
                      <div
                        className={clsx(
                          "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
                          isCompleted || isCurrent
                            ? "shadow-xs ring-2"
                            : "bg-white/[0.06] border border-white/10"
                        )}
                        style={{
                          backgroundColor:
                            isCompleted || isCurrent ? theme.color : undefined,
                          borderColor: isCurrent ? "#FFFFFF" : undefined,
                          boxShadow: isCurrent
                            ? `0 0 12px ${theme.color}80`
                            : undefined,
                        }}
                      >
                        {(isCompleted || isCurrent) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>

                      {/* Stage Name */}
                      <span
                        className={clsx(
                          "text-[9px] font-mono tracking-tight uppercase truncate max-w-[55px]",
                          isCurrent
                            ? "font-bold text-fg"
                            : isCompleted
                            ? "text-fg-muted"
                            : "text-fg-muted/40"
                        )}
                        title={theme.label}
                      >
                        {theme.shortLabel}
                      </span>

                      {/* Dwell Time Under Dot */}
                      {dwell && (
                        <span className="text-[9px] font-mono text-fg-muted/80">
                          {dwell}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      }
    >
      {isLoading || !dossier ? (
        <div className="p-12 flex items-center justify-center text-xs text-fg-muted font-mono animate-pulse">
          Loading 360° candidate dossier...
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Navigation Tabs with sliding underline and ⌥1-5 shortcut labels */}
          <Tabs
            items={tabItems}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            className="sticky top-0 bg-panel/95 backdrop-blur-md z-10 border-b border-hairline px-6 pt-1"
          />

          {/* Active Tab Surface */}
          <div>
            {activeTab === "overview" && <OverviewTab dossier={dossier} />}
            {activeTab === "scorecards" && <ScorecardsTab dossier={dossier} />}
            {activeTab === "notes" && <NotesTab dossier={dossier} />}
            {activeTab === "interviews" && <InterviewsTab dossier={dossier} />}
            {activeTab === "timeline" && <TimelineTab dossier={dossier} />}
          </div>
        </div>
      )}
    </Drawer>
  );
}
