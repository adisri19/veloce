"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { StageTransitionInput } from "@/lib/validations/stage";

interface TransitionContext {
  previousQueries: [any, any][];
}

export function useStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      input,
    }: {
      applicationId: string;
      input: StageTransitionInput;
    }) => {
      const res = await fetch(`/api/v1/applications/${applicationId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to move stage");
      }
      return json;
    },

    onMutate: async ({ applicationId, input }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.applications.all });

      // Snapshot previous application lists for rollback
      const matchingQueries = queryClient.getQueriesData({ queryKey: queryKeys.applications.all });

      // Optimistically update caches
      queryClient.setQueriesData({ queryKey: queryKeys.applications.all }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;

        const updatedItems = oldData.data.map((item: any) => {
          if (item.id === applicationId) {
            return {
              ...item,
              currentStage: input.toStage,
              stageEnteredAt: new Date().toISOString(),
              daysInStage: 0,
            };
          }
          return item;
        });

        return {
          ...oldData,
          data: updatedItems,
        };
      });

      return { previousQueries: matchingQueries } as TransitionContext;
    },

    onError: (err, { applicationId }, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message || "Stage transition failed");
    },

    onSuccess: (result, { applicationId }) => {
      const undoToken = result.meta?.undoToken;
      const warnings = result.meta?.warnings;

      if (warnings && warnings.length > 0) {
        warnings.forEach((w: string) => toast.warning(w));
      }

      toast.success(`Candidate moved to ${result.data?.currentStage || "next stage"}`, {
        duration: 6000,
        action: undoToken
          ? {
              label: "Undo",
              onClick: async () => {
                try {
                  await fetch(`/api/v1/applications/${applicationId}/stage`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      toStage: undoToken.fromStage,
                      reason: "UNDO",
                    }),
                  });
                  queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
                  queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
                  toast.info("Move undone");
                } catch {
                  toast.error("Failed to undo stage move");
                }
              },
            }
          : undefined,
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}
