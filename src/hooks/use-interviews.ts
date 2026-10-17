"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { InterviewCreateInput, InterviewUpdateInput } from "@/lib/validations/interview";

export function useInterviews(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.interviews.list(applicationId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/applications/${applicationId}/interviews`);
      if (!res.ok) throw new Error("Failed to fetch interviews");
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(applicationId),
  });
}

export function useScheduleInterview(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InterviewCreateInput) => {
      const res = await fetch(`/api/v1/applications/${applicationId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to schedule interview");
      return json;
    },
    onSuccess: (result) => {
      toast.success("Interview scheduled successfully");
      const warnings = result.meta?.warnings;
      if (warnings && warnings.length > 0) {
        warnings.forEach((w: string) => toast.warning(w));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(applicationId) });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to schedule interview");
    },
  });
}

export function useUpdateInterview(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: InterviewUpdateInput }) => {
      const res = await fetch(`/api/v1/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update interview");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Interview updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(applicationId) });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update interview");
    },
  });
}
