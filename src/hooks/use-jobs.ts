"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { JobCreateInput, JobUpdateInput } from "@/lib/validations/job";

export function useJobs(filters?: { department?: string; status?: string }) {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.department) params.set("department", filters.department);
      if (filters?.status) params.set("status", filters.status);

      const res = await fetch(`/api/v1/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useJob(id: string | null) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id || ""),
    queryFn: async () => {
      const res = await fetch(`/api/v1/jobs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch job details");
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JobCreateInput) => {
      const res = await fetch("/api/v1/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create job");
      return json.data;
    },
    onSuccess: (job) => {
      toast.success(`Created job requisition ${job.code}: ${job.title}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create job");
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: JobUpdateInput }) => {
      const res = await fetch(`/api/v1/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update job");
      return json;
    },
    onSuccess: (response) => {
      toast.success("Job requisition updated successfully");
      const rescore = response.meta?.rescoreSummary;
      if (rescore) {
        toast.info(
          `Re-scored ${rescore.rescoreCount} candidates (${rescore.movedTenPointsCount} changed ≥10 points)`
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update job");
    },
  });
}
