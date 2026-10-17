"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApplicationListItem } from "@/lib/services/applications";
import { useApplication } from "@/hooks/use-application";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { useCompareStore } from "@/stores/compare-store";
import { useUiStore } from "@/stores/ui-store";
import { queryKeys } from "@/lib/query-keys";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { StagePill } from "../ui/stage-pill";
import { ScoreBadge } from "../ui/score-badge";
import { SlaBadge } from "../ui/sla-badge";
import { Button } from "../ui/button";
import { Tabs } from "../ui/tabs";
import { OverviewTab } from "../dossier/overview-tab";
import { ScorecardsTab } from "../dossier/scorecards-tab";
import { NotesTab } from "../dossier/notes-tab";
import { InterviewsTab } from "../dossier/interviews-tab";
import { TimelineTab } from "../dossier/timeline-tab";
import {
  Stage,
  ALL_STAGES,
  STAGE_ORDER,
} from "@/lib/validations/common";
import {
  Scale,
  ArrowRight,
  UserX,
  Keyboard,
  Star,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface SplitViewProps {
  applications: ApplicationListItem[];
}

export function SplitView({ applications }: SplitViewProps) {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const stageMutation = useStageMutation();
  const addCandidateToCompare = useCompareStore((s) => s.addCandidate);
  const setRejectionModalAppId = useUiStore((s) => s.setRejectionModalAppId);
  const setShortcutHelpModalOpen = useUiStore((s) => s.setShortcutHelpModalOpen);

  const selectedApp = applications[selectedIndex] || null;
  const { data: dossier, isLoading: isDossierLoading } = useApplication(
    selectedApp?.id || null
  );

  const listRef = useRef<HTMLDivElement>(null);

  // Prefetch adjacent applications for instant switching
  useEffect(() => {
    if (applications.length === 0) return;

    const nextApp = applications[selectedIndex + 1];
    if (nextApp) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.applications.detail(nextApp.id),
        queryFn: async () => {
          const res = await fetch(`/api/v1/applications/${nextApp.id}`);
          const json = await res.json();
          return json.data;
        },
      });
    }

    const prevApp = applications[selectedIndex - 1];
    if (prevApp) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.applications.detail(prevApp.id),
        queryFn: async () => {
          const res = await fetch(`/api/v1/applications/${prevApp.id}`);
          const json = await res.json();
          return json.data;
        },
      });
    }
  }, [selectedIndex, applications, queryClient]);

  const handleAdvanceStage = useCallback(() => {
    if (!selectedApp) return;
    const currentIdx = STAGE_ORDER.indexOf(selectedApp.currentStage);
    if (currentIdx !== -1 && currentIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIdx + 1];
      if (nextStage) {
        stageMutation.mutate({
          applicationId: selectedApp.id,
          input: { toStage: nextStage },
        });
      }
    } else {
      toast.info("Candidate is already at the final active stage or terminal");
    }
  }, [selectedApp, stageMutation]);

  const handleAddToCompare = useCallback(() => {
    if (!selectedApp) return;
    const ok = addCandidateToCompare({
      id: selectedApp.id,
      candidateId: selectedApp.candidate.id,
      name: selectedApp.candidate.fullName,
      avatarUrl: selectedApp.candidate.avatarUrl,
      code: selectedApp.candidate.publicCode,
    });
    if (ok) {
      toast.success(`Added ${selectedApp.candidate.fullName} to comparison tray`);
    } else {
      toast.error("Comparison tray is full (max 4 candidates)");
    }
  }, [selectedApp, addCandidateToCompare]);

  // Global keydown handler for Superhuman-style triage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, applications.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleAdvanceStage();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (selectedApp) setRejectionModalAppId(selectedApp.id);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setActiveTab("scorecards");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setActiveTab("notes");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleAddToCompare();
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutHelpModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    applications.length,
    selectedApp,
    handleAdvanceStage,
    handleAddToCompare,
    setRejectionModalAppId,
    setShortcutHelpModalOpen,
  ]);

  const tabItems = [
    { id: "overview", label: "Overview & Match" },
    { id: "scorecards", label: "Scorecards", count: dossier?.scorecards?.length },
    { id: "notes", label: "Notes", count: dossier?.notes?.length },
    { id: "interviews", label: "Interviews", count: dossier?.interviews?.length },
    { id: "timeline", label: "Audit Timeline" },
  ];

  return (
    <div className="flex-1 flex overflow-hidden border-t border-hairline select-none h-[calc(100vh-140px)]">
      {/* Left Pane: Candidate Triage List */}
      <div
        ref={listRef}
        className="w-96 border-r border-hairline bg-panel flex flex-col shrink-0 overflow-y-auto divide-y divide-hairline"
      >
        <div className="p-3 bg-canvas/60 border-b border-hairline flex items-center justify-between text-xs text-fg-muted font-medium sticky top-0 z-10 backdrop-blur-xs">
          <span>
            {applications.length} Candidate{applications.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-hairline text-fg-muted">J/K</span>
            <span>navigate</span>
          </div>
        </div>

        {applications.map((app, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={app.id}
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => {
                queryClient.prefetchQuery({
                  queryKey: queryKeys.applications.detail(app.id),
                  queryFn: async () => {
                    const res = await fetch(`/api/v1/applications/${app.id}`);
                    const json = await res.json();
                    return json.data;
                  },
                });
              }}
              className={`p-3 cursor-pointer transition-colors flex flex-col gap-1.5 ${
                isSelected
                  ? "bg-primary/10 border-l-4 border-l-primary"
                  : "hover:bg-hairline/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    name={app.candidate.fullName}
                    src={app.candidate.avatarUrl}
                    size="sm"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-fg truncate">
                      {app.candidate.fullName}
                    </span>
                    <Mono className="text-[10px] text-fg-muted">
                      {app.candidate.publicCode} • {app.job.code}
                    </Mono>
                  </div>
                </div>
                <ScoreBadge score={app.aiMatchScore} size="sm" />
              </div>

              <div className="text-[11px] text-fg-muted truncate">
                {app.candidate.currentTitle} at {app.candidate.currentCompany || "N/A"}
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <StagePill stage={app.currentStage} size="xs" />
                <SlaBadge
                  slaState={app.slaState}
                  daysInStage={app.daysInStage}
                  slaDays={app.slaDays}
                />
              </div>
            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="p-8 text-center text-xs text-fg-muted">
            No candidates in this view
          </div>
        )}
      </div>

      {/* Right Pane: 360° Candidate Dossier */}
      <div className="flex-1 bg-canvas flex flex-col overflow-y-auto">
        {selectedApp ? (
          <>
            {/* Dossier Header & Triage Action Strip */}
            <div className="p-4 bg-panel border-b border-hairline flex flex-col gap-3 sticky top-0 z-20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={selectedApp.candidate.fullName}
                    src={selectedApp.candidate.avatarUrl}
                    size="md"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-fg">
                        {selectedApp.candidate.fullName}
                      </h2>
                      <Mono className="text-xs text-fg-muted font-bold px-1.5 py-0.5 rounded bg-hairline">
                        {selectedApp.candidate.publicCode}
                      </Mono>
                    </div>
                    <span className="text-xs text-fg-muted">
                      {selectedApp.candidate.currentTitle} at{" "}
                      {selectedApp.candidate.currentCompany || "N/A"} •{" "}
                      {selectedApp.job.title}
                    </span>
                  </div>
                </div>

                {/* Superhuman Triage Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={handleAdvanceStage}
                    title="Advance to next stage (Shortcut: A)"
                  >
                    Advance <kbd className="ml-1 text-[10px] opacity-70">A</kbd>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={<UserX className="w-3.5 h-3.5" />}
                    onClick={() => setRejectionModalAppId(selectedApp.id)}
                    title="Reject candidate (Shortcut: R)"
                  >
                    Reject <kbd className="ml-1 text-[10px] opacity-70">R</kbd>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Scale className="w-3.5 h-3.5" />}
                    onClick={handleAddToCompare}
                    title="Add to compare tray (Shortcut: C)"
                  >
                    Compare <kbd className="ml-1 text-[10px] opacity-70">C</kbd>
                  </Button>
                </div>
              </div>

              {/* Status Badges & Quick Switch */}
              <div className="flex items-center gap-2 pt-1 border-t border-hairline/40 text-xs">
                <StagePill stage={selectedApp.currentStage} size="sm" />
                <ScoreBadge score={selectedApp.aiMatchScore} size="sm" />
                <SlaBadge
                  slaState={selectedApp.slaState}
                  daysInStage={selectedApp.daysInStage}
                  slaDays={selectedApp.slaDays}
                />

                <span className="text-xs text-fg-muted ml-auto font-mono">
                  {selectedIndex + 1} of {applications.length}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs
              items={tabItems}
              activeId={activeTab}
              onChange={setActiveTab}
              className="sticky top-[108px] bg-panel z-10 border-b border-hairline"
            />

            {/* Dossier Content */}
            <div className="flex-1 p-4">
              {isDossierLoading || !dossier ? (
                <div className="p-12 text-center text-xs text-fg-muted animate-pulse">
                  Loading candidate dossier...
                </div>
              ) : (
                <div>
                  {activeTab === "overview" && <OverviewTab dossier={dossier} />}
                  {activeTab === "scorecards" && <ScorecardsTab dossier={dossier} />}
                  {activeTab === "notes" && <NotesTab dossier={dossier} />}
                  {activeTab === "interviews" && <InterviewsTab dossier={dossier} />}
                  {activeTab === "timeline" && <TimelineTab dossier={dossier} />}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-fg-muted">
            Select a candidate from the list to view their 360° dossier.
          </div>
        )}
      </div>
    </div>
  );
}
