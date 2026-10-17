"use client";

import React from "react";
import { Drawer } from "../ui/drawer";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { ScoreBadge } from "../ui/score-badge";
import { SlaBadge } from "../ui/sla-badge";
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
  Scale,
  Sparkles,
  ChevronRight,
  Archive,
} from "lucide-react";
import { Stage, ALL_STAGES } from "@/lib/validations/common";
import { toast } from "sonner";

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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-4xl"
      title={
        isLoading || !dossier ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-hairline animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="w-32 h-4 bg-hairline rounded animate-pulse" />
              <div className="w-20 h-3 bg-hairline rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5">
            <Avatar name={dossier.candidate.fullName} src={dossier.candidate.avatarUrl} size="lg" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-fg">{dossier.candidate.fullName}</span>
                <Mono className="px-1.5 py-0.5 rounded bg-hairline text-fg-muted font-bold text-[11px]">
                  {dossier.candidate.publicCode}
                </Mono>
              </div>
              <span className="text-xs text-fg-muted">
                {dossier.candidate.currentTitle} at {dossier.candidate.currentCompany || "N/A"}
              </span>
            </div>
          </div>
        )
      }
      subtitle={
        dossier && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold text-primary bg-primary-muted px-2 py-0.5 rounded border border-primary/20">
              {dossier.job.code}: {dossier.job.title}
            </span>

            <StagePill stage={dossier.currentStage as Stage} size="sm" />
            <ScoreBadge score={dossier.aiMatchScore} size="sm" />
            <SlaBadge
              slaState={dossier.slaStatus.slaState}
              daysInStage={dossier.slaStatus.daysInStage}
              slaDays={dossier.slaStatus.slaDays}
            />

            {/* Stage Quick Switch */}
            <select
              value={dossier.currentStage}
              onChange={(e) => handleStageChange(e.target.value as Stage)}
              className="text-[11px] bg-panel border border-hairline rounded px-2 py-0.5 text-fg font-medium cursor-pointer"
            >
              {ALL_STAGES.map((st) => (
                <option key={st} value={st}>
                  Move to: {st.replace("_", " ")}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 ml-auto">
              {dossier.candidate.linkedinUrl && (
                <a
                  href={dossier.candidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:text-primary text-fg-muted"
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
                  className="p-1 hover:text-primary text-fg-muted"
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
              >
                Compare
              </Button>
            </div>
          </div>
        )
      }
    >
      {isLoading || !dossier ? (
        <div className="p-8 flex items-center justify-center text-xs text-fg-muted">
          Loading 360° candidate dossier...
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Navigation Tabs */}
          <Tabs
            items={tabItems}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            className="sticky top-0 bg-panel z-10"
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
