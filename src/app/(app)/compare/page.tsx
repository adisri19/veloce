"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { useCompareStore } from "@/stores/compare-store";
import { useApplications } from "@/hooks/use-applications";
import { useJobs } from "@/hooks/use-jobs";
import { queryKeys } from "@/lib/query-keys";
import { CompareMatrix } from "@/components/compare/compare-matrix";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Mono } from "@/components/ui/mono";
import { ScoreRing } from "@/components/ui/score-ring";
import { StagePill } from "@/components/ui/stage-pill";
import {
  Scale,
  Trash2,
  ArrowLeft,
  Search,
  Sparkles,
  Check,
  Briefcase,
  Users,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlIds = searchParams.get("ids")
    ? searchParams.get("ids")!.split(",").filter(Boolean)
    : [];

  const storeCandidates = useCompareStore((s) => s.candidates);
  const clearStore = useCompareStore((s) => s.clear);
  const addCandidateToStore = useCompareStore((s) => s.addCandidate);

  // Determine candidate application ids to compare
  const candidateIds = urlIds.length > 0 ? urlIds : storeCandidates.map((c) => c.id);

  // Fetch full dossiers for each candidate in compare
  const dossierQueries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: queryKeys.applications.detail(id),
      queryFn: async () => {
        const res = await fetch(`/api/v1/applications/${id}`);
        if (!res.ok) throw new Error("Failed to load candidate dossier");
        const json = await res.json();
        return json.data;
      },
      staleTime: 30000,
    })),
  });

  const isLoading = dossierQueries.some((q) => q.isLoading);
  const dossiers = dossierQueries
    .map((q) => q.data)
    .filter((d) => Boolean(d));

  // For the Empty State candidate picker
  const { data: allAppsData } = useApplications();
  const { data: jobs = [] } = useJobs();
  const allApplications = allAppsData?.data || [];

  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedPickerJobId, setSelectedPickerJobId] = useState("");
  const [selectedPickerIds, setSelectedPickerIds] = useState<string[]>([]);

  // Filter candidates in picker
  const filteredPickerApps = useMemo(() => {
    return allApplications.filter((app) => {
      if (selectedPickerJobId && app.job.id !== selectedPickerJobId) return false;
      if (!pickerSearch.trim()) return true;
      const q = pickerSearch.toLowerCase();
      return (
        app.candidate.fullName.toLowerCase().includes(q) ||
        app.candidate.publicCode.toLowerCase().includes(q) ||
        (app.candidate.currentTitle || "").toLowerCase().includes(q)
      );
    });
  }, [allApplications, selectedPickerJobId, pickerSearch]);

  const handleTogglePickerCandidate = (id: string) => {
    if (selectedPickerIds.includes(id)) {
      setSelectedPickerIds(selectedPickerIds.filter((item) => item !== id));
    } else {
      if (selectedPickerIds.length >= 4) return;
      setSelectedPickerIds([...selectedPickerIds, id]);
    }
  };

  const handleApplyPickerSelection = () => {
    if (selectedPickerIds.length >= 2) {
      router.push(`/compare?ids=${selectedPickerIds.join(",")}`);
    }
  };

  // Quick action: Suggest top 3 by score for first or selected job
  const handleSuggestTop3 = () => {
    const targetJobId = selectedPickerJobId || jobs[0]?.id;
    if (!targetJobId) return;

    const jobApps = allApplications
      .filter((a) => a.job.id === targetJobId)
      .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
      .slice(0, 3);

    const ids = jobApps.map((a) => a.id);
    if (ids.length >= 2) {
      setSelectedPickerIds(ids);
      router.push(`/compare?ids=${ids.join(",")}`);
    }
  };

  const handleClear = () => {
    clearStore();
    setSelectedPickerIds([]);
    router.push("/compare");
  };

  const currentJobName = jobs.find((j: any) => j.id === (selectedPickerJobId || jobs[0]?.id))?.title || "selected requisition";

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] w-full mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              Candidate Calibration & Comparison Matrix
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
              {dossiers.length} Candidates
            </span>
          </div>
          <p className="text-xs text-fg-muted mt-1 font-mono">
            Side-by-side rubric calibration across AI match scores, core competencies, expected compensation, and interviewer scores
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/pipeline">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Pipeline
            </Button>
          </Link>

          {dossiers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
              onClick={handleClear}
            >
              Clear Basket
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-fg-muted font-mono animate-pulse">
          Loading candidate comparison matrix...
        </div>
      ) : dossiers.length < 2 ? (
        /* Empty state with ghost 3-column skeleton matrix behind centered glass picker card (Bug 11 fix) */
        <div className="relative min-h-[580px] w-full rounded-2xl overflow-hidden flex items-center justify-center p-6 border border-white/[0.05]">
          {/* Ghost 3-Column Skeleton Matrix in background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none filter blur-[0.5px] p-6 overflow-hidden flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-hairline">
              <div className="h-10 bg-white/10 rounded-lg" />
              <div className="h-10 bg-white/10 rounded-lg" />
              <div className="h-10 bg-white/10 rounded-lg" />
              <div className="h-10 bg-white/10 rounded-lg" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-2 border-b border-white/[0.03]">
                <div className="h-6 bg-white/5 rounded" />
                <div className="h-6 bg-white/5 rounded" />
                <div className="h-6 bg-white/5 rounded" />
                <div className="h-6 bg-white/5 rounded" />
              </div>
            ))}
          </div>

          {/* Foreground Centered Glass Card with Searchable Candidate Picker */}
          <div className="relative z-10 max-w-xl w-full bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-fg">
                    Pick 2 to 4 Candidates to Compare
                  </h3>
                  <p className="text-xs text-fg-muted">
                    Compare technical match, compensation fit, and interviewer calibration
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-fg-muted">
                <Mono>{selectedPickerIds.length}/4</Mono> selected
              </span>
            </div>

            {/* Quick action: Suggest top 3 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs">
              <div className="flex items-center gap-2 text-fg-muted">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] truncate max-w-xs">
                  Quick benchmark: Top 3 for {currentJobName}
                </span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={handleSuggestTop3}
                className="text-xs font-mono shrink-0"
              >
                Suggest Top 3
              </Button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-fg-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter candidates by name or title..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-fg placeholder:text-fg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Requisition Dropdown */}
              <select
                value={selectedPickerJobId}
                onChange={(e) => setSelectedPickerJobId(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary font-mono max-w-[150px] truncate"
              >
                <option value="">All Jobs</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>
                    {j.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Candidates List */}
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {filteredPickerApps.map((app) => {
                const isSelected = selectedPickerIds.includes(app.id);
                return (
                  <button
                    key={app.id}
                    onClick={() => handleTogglePickerCandidate(app.id)}
                    className={clsx(
                      "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary text-fg"
                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] text-fg-muted hover:text-fg"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={clsx(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-white/20 bg-white/[0.02]"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      <Avatar
                        name={app.candidate.fullName}
                        src={app.candidate.avatarUrl}
                        size="xs"
                      />

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-fg truncate">
                            {app.candidate.fullName}
                          </span>
                          <Mono className="text-[10px] text-fg-muted font-normal whitespace-nowrap">
                            {app.candidate.publicCode}
                          </Mono>
                        </div>
                        <span className="text-[11px] text-fg-muted truncate max-w-[220px]">
                          {app.candidate.currentTitle} • {app.job.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StagePill stage={app.currentStage} size="xs" />
                      <ScoreRing score={app.aiMatchScore} size="xs" />
                    </div>
                  </button>
                );
              })}

              {filteredPickerApps.length === 0 && (
                <div className="p-8 text-center text-xs text-fg-muted">
                  No candidates match your search filter.
                </div>
              )}
            </div>

            {/* Launch Compare Button */}
            <div className="flex items-center justify-between pt-2 border-t border-hairline">
              <span className="text-xs font-mono text-fg-muted">
                {selectedPickerIds.length < 2
                  ? "Select at least 2 candidates"
                  : `Ready to compare ${selectedPickerIds.length} candidates`}
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedPickerIds.length < 2}
                onClick={handleApplyPickerSelection}
              >
                Compare Now ({selectedPickerIds.length})
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <CompareMatrix dossiers={dossiers} />
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-fg-muted font-mono animate-pulse">
          Loading comparison workspace...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
