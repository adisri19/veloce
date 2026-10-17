"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

async function fetchApplicationDossier(id: string) {
  const res = await fetch(`/api/v1/applications/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch application dossier: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id || ""),
    queryFn: () => fetchApplicationDossier(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function usePrefetchApplication() {
  const queryClient = useQueryClient();

  return (id: string) => {
    if (!id) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.applications.detail(id),
      queryFn: () => fetchApplicationDossier(id),
      staleTime: 1000 * 60,
    });
  };
}
