"use client";

import React, { useEffect, Suspense } from "react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useApplications } from "@/hooks/use-applications";
import { FilterBar } from "@/components/pipeline/filter-bar";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { DataGrid } from "@/components/pipeline/data-grid";
import { SplitView } from "@/components/pipeline/split-view";
import { BulkActionBar } from "@/components/pipeline/bulk-action-bar";
import { Skeleton } from "@/components/ui/skeleton";

function PipelineContent() {
  const { filters, updateFilters } = useUrlFilters();
  const { data, isLoading, isError, error, refetch } = useApplications(filters);

  // Global hotkeys 1, 2, 3 for view mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "1") {
        updateFilters({ view: "kanban" });
      } else if (e.key === "2") {
        updateFilters({ view: "grid" });
      } else if (e.key === "3") {
        updateFilters({ view: "split" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [updateFilters]);

  const applications = data?.data || [];
  const facets = data?.meta?.facets;
  const totals = data?.meta?.totals;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      {/* Facet Filter Bar */}
      <FilterBar facets={facets} totals={totals} />

      {/* Main View Area */}
      {isLoading && !data ? (
        <div className="flex-1 p-6 flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="w-72 flex flex-col gap-3 shrink-0">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="p-6 bg-panel border border-hairline rounded-lg flex flex-col items-center gap-3 text-center">
            <span className="text-sm font-semibold text-fg">
              Failed to load candidate pipeline
            </span>
            <span className="text-xs text-fg-muted">
              {(error as Error)?.message}
            </span>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {filters.view === "kanban" && <KanbanBoard applications={applications} />}
          {filters.view === "grid" && <DataGrid applications={applications} />}
          {filters.view === "split" && <SplitView applications={applications} />}
        </div>
      )}

      {/* Sticky Bulk Action Bar */}
      <BulkActionBar />
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="w-72 flex flex-col gap-3 shrink-0">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          ))}
        </div>
      }
    >
      <PipelineContent />
    </Suspense>
  );
}
