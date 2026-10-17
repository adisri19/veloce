"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "../ui/modal";
import { Input, Textarea } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { ScoreBadge } from "../ui/score-badge";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useJobs } from "@/hooks/use-jobs";
import { queryKeys } from "@/lib/query-keys";

export function NewCandidateModal() {
  const isOpen = useUiStore((s) => s.isNewCandidateModalOpen);
  const onClose = () => useUiStore.getState().setNewCandidateModalOpen(false);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useJobs({ status: "OPEN" });
  const [selectedJobId, setSelectedJobId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [experienceYears, setExperienceYears] = useState(4);
  const [expectedSalary, setExpectedSalary] = useState(200000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewScore, setPreviewScore] = useState<number | null>(null);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  // Live scoring preview on changes
  useEffect(() => {
    if (!selectedJobId || (!resumeText && !fullName)) {
      setPreviewScore(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/candidates/parse-and-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: selectedJobId,
            resumeText,
            structured: {
              fullName: fullName || undefined,
              email: email || undefined,
              currentTitle: currentTitle || undefined,
              experienceYears: Number(experienceYears),
              expectedSalary: Number(expectedSalary),
            },
            persist: false,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setPreviewScore(json.data.scoreBreakdown?.total ?? null);
          if (json.data.parsed && !fullName && json.data.parsed.fullName) {
            setFullName(json.data.parsed.fullName);
          }
          if (json.data.parsed && !email && json.data.parsed.email) {
            setEmail(json.data.parsed.email);
          }
        }
      } catch {
        // Ignore preview errors
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedJobId, resumeText, fullName, email, currentTitle, experienceYears, expectedSalary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/candidates/parse-and-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJobId,
          resumeText,
          structured: {
            fullName: fullName || "Candidate",
            email: email || `cand-${Date.now()}@veloce.dev`,
            currentTitle: currentTitle || "Engineer",
            experienceYears: Number(experienceYears),
            expectedSalary: Number(expectedSalary),
          },
          persist: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create candidate");
      }

      toast.success("Candidate created and scored!");
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });

      onClose();
      // Open dossier immediately
      if (json.data.persisted?.application?.id) {
        setActiveDossierId(json.data.persisted.application.id);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Candidate & Resume Parse"
      subtitle="Extract skills and run deterministic AI scoring preview"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Target Job Requisition"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map((j: any) => (
              <option key={j.id} value={j.id}>
                {j.code}: {j.title}
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-between p-2.5 bg-panel border border-hairline rounded-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-fg">Live Match Preview</span>
            </div>
            {previewScore !== null ? (
              <ScoreBadge score={previewScore} showLabel />
            ) : (
              <span className="text-xs text-fg-muted font-mono">--</span>
            )}
          </div>
        </div>

        <Textarea
          label="Paste Resume Text"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste full raw resume text (experience, skills, achievements)..."
          rows={5}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Current Title"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="Senior Platform Engineer"
          />
          <Input
            label="Years Experience"
            type="number"
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
          />
          <Input
            label="Expected Salary (USD)"
            type="number"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-hairline">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Create & View Dossier
          </Button>
        </div>
      </form>
    </Modal>
  );
}
