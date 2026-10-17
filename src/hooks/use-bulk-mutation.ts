"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { BulkOperationInput } from "@/lib/validations/bulk";
import { useSelectionStore } from "@/stores/selection-store";

export function useBulkMutation() {
  const queryClient = useQueryClient();
  const clearSelection = useSelectionStore((s) => s.clear);

  return useMutation({
    mutationFn: async (input: BulkOperationInput) => {
      const res = await fetch("/api/v1/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Bulk operation failed");
      }
      return json;
    },

    onSuccess: (result, input) => {
      clearSelection();
      toast.success(`Successfully updated ${result.data?.succeeded || input.ids.length} applications`);
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },

    onError: (err) => {
      toast.error(err.message || "Bulk operation failed");
    },
  });
}
