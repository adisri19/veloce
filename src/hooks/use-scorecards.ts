"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { ScorecardCreateInput } from "@/lib/validations/scorecard";

export function useSubmitScorecard(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScorecardCreateInput) => {
      const res = await fetch(`/api/v1/applications/${applicationId}/scorecards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to submit scorecard");
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success("Scorecard submitted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit scorecard");
    },
  });
}
