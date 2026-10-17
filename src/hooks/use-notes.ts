"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { NoteCreateInput } from "@/lib/validations/note";

export function useNotes(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.notes.list(applicationId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/applications/${applicationId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(applicationId),
    refetchInterval: 15000, // 15s live poll
  });
}

export function useCreateNote(applicationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NoteCreateInput) => {
      const res = await fetch(`/api/v1/applications/${applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create note");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Note posted");
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(applicationId) });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to post note");
    },
  });
}
