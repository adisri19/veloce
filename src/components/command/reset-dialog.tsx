"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

export function ResetDialog() {
  const isOpen = useUiStore((s) => s.isResetDbModalOpen);
  const onClose = () => useUiStore.getState().setResetDbModalOpen(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const handleReset = async () => {
    if (confirmText !== "RESET") return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/v1/seed/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET" }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to reset database");
      }
      toast.success(
        `Database reloaded: 32 applications, ${json.data.counts.scorecards} scorecards in ${json.data.elapsedMs}ms`
      );
      queryClient.invalidateQueries();
      onClose();
      setConfirmText("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Reset failed");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Demo Database"
      subtitle="Reload pristine deterministic seed data"
    >
      <div className="flex flex-col gap-4">
        <div className="p-3 bg-danger-surface border border-danger/30 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="text-xs text-danger flex flex-col gap-1">
            <span className="font-semibold">Irreversible demo reset</span>
            <span>
              This will wipe all live changes and reload 6 jobs, 32 candidates with exact stage
              distributions, and realistic transition histories.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-fg-muted">
            Type <span className="font-mono font-bold text-fg">RESET</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            className="font-mono tracking-widest uppercase"
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isResetting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={confirmText !== "RESET" || isResetting}
            isLoading={isResetting}
            onClick={handleReset}
          >
            Reset Database
          </Button>
        </div>
      </div>
    </Modal>
  );
}
