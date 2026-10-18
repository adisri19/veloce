"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/input";
import { Button } from "../ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { RejectionReason } from "@/lib/validations/common";
import { clsx } from "clsx";
import { AlertCircle, Check } from "lucide-react";

const REJECTION_REASONS: { value: RejectionReason; label: string; desc: string }[] = [
  { value: "SKILLS_MISMATCH", label: "Skills Mismatch", desc: "Technical criteria or core skills gap" },
  { value: "COMPENSATION", label: "Compensation", desc: "Salary expectations exceed budgeted band" },
  { value: "CULTURE_FIT", label: "Culture Alignment", desc: "Team values, communication or work mode" },
  { value: "EXPERIENCE", label: "Experience Level", desc: "Overqualified or under-experienced" },
  { value: "WITHDREW", label: "Candidate Withdrew", desc: "Accepted another offer or withdrew application" },
  { value: "POSITION_FILLED", label: "Position Filled", desc: "Headcount filled by another candidate" },
  { value: "NO_RESPONSE", label: "No Response", desc: "Ghosted or unresponsive to scheduling" },
  { value: "OTHER", label: "Other", desc: "Specific business or reorganization reason" },
];

export function RejectionModal() {
  const applicationId = useUiStore((s) => s.rejectionModalAppId);
  const setApplicationId = useUiStore((s) => s.setRejectionModalAppId);
  const stageMutation = useStageMutation();

  const [reason, setReason] = useState<RejectionReason>("SKILLS_MISMATCH");
  const [notes, setNotes] = useState("");

  const isOpen = Boolean(applicationId);
  const onClose = () => {
    setApplicationId(null);
    setNotes("");
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    await stageMutation.mutateAsync({
      applicationId,
      input: {
        toStage: "REJECTED",
        rejectionReason: reason,
        rejectionNotes: notes || undefined,
      },
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Disposition Reason"
      subtitle="Select a required disposition reason for EEO compliance and funnel reporting"
    >
      <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
        {/* Interactive Chip Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-fg">
            Disposition Reason <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {REJECTION_REASONS.map((r) => {
              const isSelected = reason === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={clsx(
                    "flex flex-col text-left p-2.5 rounded-lg border transition-all text-xs",
                    isSelected
                      ? "bg-rose-500/10 border-rose-500/40 text-fg ring-1 ring-rose-500/30"
                      : "bg-white/[0.02] border-white/[0.06] text-fg-muted hover:border-white/15 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={clsx("font-semibold", isSelected && "text-rose-400")}>
                      {r.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] text-fg-muted/70 mt-0.5 line-clamp-1">
                    {r.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-fg">
            Debrief Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Specific feedback from team interview debrief..."
            rows={3}
            className="text-xs"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            isLoading={stageMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
