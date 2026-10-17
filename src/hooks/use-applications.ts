"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ApplicationListItem, ApplicationListFacets } from "@/types/domain";

interface ApplicationsApiResponse {
  ok: boolean;
  data: ApplicationListItem[];
  meta: {
    facets: ApplicationListFacets;
    totals: { filtered: number; all: number };
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export function useApplications(filters: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.applications.list(filters),
    queryFn: async (): Promise<ApplicationsApiResponse> => {
      const params = new URLSearchParams();

      if (filters.q) params.set("q", filters.q);
      if (filters.stages && filters.stages.length > 0) params.set("stages", filters.stages.join(","));
      if (filters.jobIds && filters.jobIds.length > 0) params.set("jobIds", filters.jobIds.join(","));
      if (filters.departments && filters.departments.length > 0)
        params.set("departments", filters.departments.join(","));
      if (filters.minScore !== null && filters.minScore !== undefined)
        params.set("minScore", String(filters.minScore));
      if (filters.maxExperience !== null && filters.maxExperience !== undefined)
        params.set("maxExperience", String(filters.maxExperience));
      if (filters.sources && filters.sources.length > 0) params.set("sources", filters.sources.join(","));
      if (filters.tags && filters.tags.length > 0) params.set("tags", filters.tags.join(","));
      if (filters.slaBreachedOnly) params.set("slaBreachedOnly", "true");
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.cursor) params.set("cursor", filters.cursor);

      const res = await fetch(`/api/v1/applications?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch applications: ${res.statusText}`);
      }
      return res.json();
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 10,
  });
}
