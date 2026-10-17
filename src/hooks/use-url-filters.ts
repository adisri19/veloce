"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { PipelineViewMode } from "@/stores/ui-store";

export interface PipelineFilters {
  q: string;
  stages: string[];
  jobIds: string[];
  departments: string[];
  minScore: number | null;
  maxExperience: number | null;
  sources: string[];
  tags: string[];
  slaBreachedOnly: boolean;
  sort: string;
  view: PipelineViewMode;
}

export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<PipelineFilters>(() => {
    const q = searchParams.get("q") || "";
    const stages = searchParams.get("stages") ? searchParams.get("stages")!.split(",").filter(Boolean) : [];
    const jobIds = searchParams.get("jobs") ? searchParams.get("jobs")!.split(",").filter(Boolean) : [];
    const departments = searchParams.get("depts") ? searchParams.get("depts")!.split(",").filter(Boolean) : [];
    const minScore = searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!, 10) : null;
    const maxExperience = searchParams.get("maxExp") ? parseInt(searchParams.get("maxExp")!, 10) : null;
    const sources = searchParams.get("sources") ? searchParams.get("sources")!.split(",").filter(Boolean) : [];
    const tags = searchParams.get("tags") ? searchParams.get("tags")!.split(",").filter(Boolean) : [];
    const slaBreachedOnly = searchParams.get("sla") === "breached" || searchParams.get("slaBreachedOnly") === "true";
    const sort = searchParams.get("sort") || "";
    const view = (searchParams.get("view") as PipelineViewMode) || "kanban";

    return {
      q,
      stages,
      jobIds,
      departments,
      minScore,
      maxExperience,
      sources,
      tags,
      slaBreachedOnly,
      sort,
      view,
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<PipelineFilters>) => {
      const current = new URLSearchParams(searchParams.toString());

      if (newFilters.q !== undefined) {
        if (newFilters.q) current.set("q", newFilters.q);
        else current.delete("q");
      }

      if (newFilters.stages !== undefined) {
        if (newFilters.stages.length > 0) current.set("stages", newFilters.stages.join(","));
        else current.delete("stages");
      }

      if (newFilters.jobIds !== undefined) {
        if (newFilters.jobIds.length > 0) current.set("jobs", newFilters.jobIds.join(","));
        else current.delete("jobs");
      }

      if (newFilters.departments !== undefined) {
        if (newFilters.departments.length > 0) current.set("depts", newFilters.departments.join(","));
        else current.delete("depts");
      }

      if (newFilters.minScore !== undefined) {
        if (newFilters.minScore !== null) current.set("minScore", String(newFilters.minScore));
        else current.delete("minScore");
      }

      if (newFilters.maxExperience !== undefined) {
        if (newFilters.maxExperience !== null) current.set("maxExp", String(newFilters.maxExperience));
        else current.delete("maxExp");
      }

      if (newFilters.sources !== undefined) {
        if (newFilters.sources.length > 0) current.set("sources", newFilters.sources.join(","));
        else current.delete("sources");
      }

      if (newFilters.tags !== undefined) {
        if (newFilters.tags.length > 0) current.set("tags", newFilters.tags.join(","));
        else current.delete("tags");
      }

      if (newFilters.slaBreachedOnly !== undefined) {
        if (newFilters.slaBreachedOnly) current.set("sla", "breached");
        else current.delete("sla");
      }

      if (newFilters.sort !== undefined) {
        if (newFilters.sort) current.set("sort", newFilters.sort);
        else current.delete("sort");
      }

      if (newFilters.view !== undefined) {
        current.set("view", newFilters.view);
      }

      router.push(`${pathname}?${current.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    const current = new URLSearchParams();
    if (filters.view) current.set("view", filters.view);
    router.push(`${pathname}?${current.toString()}`);
  }, [router, pathname, filters.view]);

  return {
    filters,
    updateFilters,
    clearAllFilters,
  };
}
