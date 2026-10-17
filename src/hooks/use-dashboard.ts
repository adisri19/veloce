"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsDashboardData } from "@/types/domain";

interface DashboardFilters {
  from?: string;
  to?: string;
  jobIds?: string[];
}

export function useDashboard(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(filters as Record<string, unknown>),
    queryFn: async (): Promise<AnalyticsDashboardData> => {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.jobIds && filters.jobIds.length > 0) {
        params.set("jobIds", filters.jobIds.join(","));
      }

      const res = await fetch(`/api/v1/analytics/dashboard?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard data: ${res.statusText}`);
      }
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 30000, // 30s live triage poll
    placeholderData: (prev) => prev,
    staleTime: 15000,
  });
}
