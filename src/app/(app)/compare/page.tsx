"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { useCompareStore } from "@/stores/compare-store";
import { queryKeys } from "@/lib/query-keys";
import { CompareMatrix } from "@/components/compare/compare-matrix";
import { Button } from "@/components/ui/button";
import { Scale, Trash2, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlIds = searchParams.get("ids")
    ? searchParams.get("ids")!.split(",").filter(Boolean)
    : [];

  const storeCandidates = useCompareStore((s) => s.candidates);
  const clearStore = useCompareStore((s) => s.clear);

  // Determine candidate application ids to compare
  const candidateIds = urlIds.length > 0 ? urlIds : storeCandidates.map((c) => c.id);

  // Fetch full dossiers for each candidate
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

  const handleClear = () => {
    clearStore();
    router.push("/compare");
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] w-full mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-fg">
              Candidate Calibration & Comparison Matrix
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-muted text-primary font-bold">
              {dossiers.length} Candidates
            </span>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            Side-by-side rubric calibration across AI match scores, core competencies, expected compensation, and interviewer scores
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        <div className="p-16 text-center text-xs text-fg-muted animate-pulse">
          Loading candidate comparison matrix...
        </div>
      ) : dossiers.length < 2 ? (
        <div className="p-16 border border-hairline rounded-lg bg-panel flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-muted flex items-center justify-center text-primary">
            <Scale className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-fg">
              Select 2 to 4 candidates to compare
            </h3>
            <p className="text-xs text-fg-muted">
              Add candidates from the Pipeline Kanban, Data Grid, or Superhuman Split View by clicking &quot;Compare&quot; or pressing &apos;C&apos;.
            </p>
          </div>
          <Link href="/pipeline">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Go to Pipeline Workspace
            </Button>
          </Link>
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
        <div className="p-16 text-center text-xs text-fg-muted animate-pulse">
          Loading comparison workspace...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
