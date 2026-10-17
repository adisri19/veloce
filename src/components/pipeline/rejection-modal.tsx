"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { Textarea } from "../ui/input";
import { Button } from "../ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { RejectionReason } from "@/lib/validations/common";

const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: "SKILLS_MISMATCH", label: "Skills Mismatch / Technical Gap" },
  { value: "COMPENSATION", label: "Compensation / Salary Expectations" },
  { value: "CULTURE_FIT", label: "Culture & Values Alignment" },
  { value: "EXPERIENCE", label: "Experience Level (Under/Over)" },
  { value: "WITHDREW", label: "Candidate Withdrew" },
  { value: "POSITION_FILLED", label: "Position Already Filled" },
  { value: "NO_RESPONSE", label: "No Response / Ghosted" },
  { value: "OTHER", label: "Other Business Reason" },
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
      title="Reject Candidate"
      subtitle="Select a required disposition reason for compliance & reporting"
    >
      <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
        <Select
          label="Disposition Reason *"
          value={reason}
          onChange={(e) => setReason(e.target.value as RejectionReason)}
        >
          {REJECTION_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>

        <Textarea
          label="Rejection Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Specific feedback or notes from interview debrief..."
          rows={3}
        />

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            isLoading={stageMutation.isPending}
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
