"use client";

import React from "react";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { StagePill } from "../ui/stage-pill";
import { ScoreBadge } from "../ui/score-badge";
import { Button } from "../ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { useCompareStore } from "@/stores/compare-store";
import { STAGE_ORDER, Stage } from "@/lib/validations/common";
import {
  Check,
  X,
  AlertTriangle,
  Award,
  ArrowRight,
  UserX,
  ExternalLink,
  Star,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface CompareMatrixProps {
  dossiers: any[]; // Full dossier objects
}

export function CompareMatrix({ dossiers }: CompareMatrixProps) {
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const setRejectionModalAppId = useUiStore((s) => s.setRejectionModalAppId);
  const removeCandidate = useCompareStore((s) => s.removeCandidate);
  const stageMutation = useStageMutation();

  if (dossiers.length === 0) return null;

  // Check if candidates are for different jobs
  const distinctJobs = Array.from(new Set(dossiers.map((d) => d.job.id)));
  const hasCrossJobComparison = distinctJobs.length > 1;

  // Calculate highest score
  const highestScore = Math.max(...dossiers.map((d) => d.aiMatchScore));
  const highestExp = Math.max(...dossiers.map((d) => d.candidate.experienceYears));

  // Compute union of all skills across candidates
  const allSkills = Array.from(
    new Set(dossiers.flatMap((d) => d.candidate.skills || []))
  ).sort();

  const handleAdvance = (d: any) => {
    const curIdx = STAGE_ORDER.indexOf(d.currentStage);
    if (curIdx !== -1 && curIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[curIdx + 1];
      if (nextStage) {
        stageMutation.mutate({
          applicationId: d.id,
          input: { toStage: nextStage },
        });
      }
    } else {
      toast.info("Candidate is already at the final stage");
    }
  };

  return (
    <div className="flex flex-col gap-4 select-none">
      {hasCrossJobComparison && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-500">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>Note:</strong> Candidates in this comparison applied to different job requisitions ({distinctJobs.length} different roles). AI match scores and salary evaluations are calibrated relative to each specific job&apos;s requirements and budget bands.
          </span>
        </div>
      )}

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto border border-hairline rounded-lg bg-panel shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          {/* Header Row: Candidate Cards */}
          <thead className="sticky top-0 z-10 bg-panel/95 backdrop-blur-sm border-b border-hairline">
            <tr>
              <th className="w-48 p-4 text-xs font-bold text-fg-muted uppercase tracking-wider bg-canvas/40 border-r border-hairline">
                Evaluation Dimension
              </th>
              {dossiers.map((d) => (
                <th
                  key={d.id}
                  className="p-4 border-r border-hairline last:border-r-0 min-w-[240px] max-w-[300px]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={d.candidate.fullName}
                          src={d.candidate.avatarUrl}
                          size="md"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-fg truncate">
                            {d.candidate.fullName}
                          </span>
                          <Mono className="text-[10px] text-fg-muted font-mono">
                            {d.candidate.publicCode}
                          </Mono>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCandidate(d.id)}
                        className="text-fg-muted hover:text-fg p-1 rounded hover:bg-hairline"
                        title="Remove from comparison"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col text-xs text-fg-muted">
                      <span className="font-medium text-fg truncate">
                        {d.candidate.currentTitle}
                      </span>
                      <span className="text-[11px] truncate">
                        at {d.candidate.currentCompany || "N/A"}
                      </span>
                      <span className="text-[10px] font-mono text-primary mt-0.5">
                        {d.job.code}: {d.job.title}
                      </span>
                    </div>

                    {/* Column Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-hairline">
                      <Button
                        variant="primary"
                        size="xs"
                        icon={<ArrowRight className="w-3 h-3" />}
                        onClick={() => handleAdvance(d)}
                        className="flex-1"
                      >
                        Advance
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        icon={<UserX className="w-3 h-3" />}
                        onClick={() => setRejectionModalAppId(d.id)}
                        title="Reject candidate"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<ExternalLink className="w-3 h-3" />}
                        onClick={() => setActiveDossierId(d.id)}
                        title="Open full dossier"
                      >
                        Dossier
                      </Button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-hairline text-xs">
            {/* Row: AI Match Score */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                AI Match Score
              </td>
              {dossiers.map((d) => {
                const isBest = d.aiMatchScore === highestScore && dossiers.length > 1;
                return (
                  <td
                    key={d.id}
                    className={`p-3.5 border-r border-hairline last:border-r-0 ${
                      isBest ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={d.aiMatchScore} size="md" />
                      {isBest && (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-primary">
                          <Award className="w-3.5 h-3.5" />
                          <span>Top Match</span>
                        </span>
                      )}
                    </div>
                    {/* Component Breakdown Mini Bar */}
                    {d.aiScoreBreakdown?.components && (
                      <div className="flex flex-col gap-1 mt-2 text-[10px] text-fg-muted font-mono">
                        <div className="flex justify-between">
                          <span>Skills (40%):</span>
                          <span className="text-fg font-bold">
                            {d.aiScoreBreakdown.components.skills?.score}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experience (25%):</span>
                          <span className="text-fg font-bold">
                            {d.aiScoreBreakdown.components.experience?.score}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Comp Fit (15%):</span>
                          <span className="text-fg font-bold">
                            {d.aiScoreBreakdown.components.compensation?.score}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Domain (20%):</span>
                          <span className="text-fg font-bold">
                            {d.aiScoreBreakdown.components.domain?.score}%
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Row: Stage & Velocity */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Pipeline Stage & Dwell
              </td>
              {dossiers.map((d) => (
                <td
                  key={d.id}
                  className="p-3.5 border-r border-hairline last:border-r-0"
                >
                  <div className="flex items-center gap-2">
                    <StagePill stage={d.currentStage as Stage} size="sm" />
                    <span className="font-mono text-fg-muted text-[11px]">
                      {d.slaStatus?.daysInStage || 0}d in stage
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Row: Experience & Background */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Experience Years
              </td>
              {dossiers.map((d) => {
                const isBest =
                  d.candidate.experienceYears === highestExp && dossiers.length > 1;
                return (
                  <td
                    key={d.id}
                    className={`p-3.5 border-r border-hairline last:border-r-0 ${
                      isBest ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-base font-bold text-fg">
                        <Mono>{d.candidate.experienceYears}y</Mono>
                      </span>
                      <span className="text-fg-muted text-[11px]">
                        (Target: {d.job.minExperienceYears}–{d.job.maxExperienceYears}y)
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row: Compensation Fit */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Expected Salary vs Budget
              </td>
              {dossiers.map((d) => {
                const exp = d.candidate.expectedSalary;
                const max = d.job.salaryMax;
                const delta = exp ? exp - max : 0;
                return (
                  <td
                    key={d.id}
                    className="p-3.5 border-r border-hairline last:border-r-0"
                  >
                    <div className="flex flex-col gap-1 font-mono">
                      <span className="text-sm font-bold text-fg">
                        {exp ? `$${(exp / 1000).toFixed(0)}k` : "Undisclosed"}
                      </span>
                      <span className="text-[11px] text-fg-muted">
                        Max Budget: ${(max / 1000).toFixed(0)}k
                      </span>
                      {exp && (
                        <span
                          className={`text-[10px] font-bold ${
                            delta <= 0 ? "text-emerald-500" : "text-danger"
                          }`}
                        >
                          {delta <= 0
                            ? `✓ Within band (-$${Math.abs(delta / 1000).toFixed(0)}k)`
                            : `⚠️ Over budget (+$${(delta / 1000).toFixed(0)}k)`}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row: Notice Period */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Notice Period
              </td>
              {dossiers.map((d) => (
                <td
                  key={d.id}
                  className="p-3.5 border-r border-hairline last:border-r-0 font-mono"
                >
                  {d.candidate.noticePeriodDays ? (
                    <span>{d.candidate.noticePeriodDays} days</span>
                  ) : (
                    <span className="text-fg-muted">Immediate</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Row: Scorecard Calibration Average */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Scorecards & Ratings
              </td>
              {dossiers.map((d) => {
                const count = d.scorecards?.length || 0;
                let avg = 0;
                if (count > 0) {
                  const sum = d.scorecards.reduce(
                    (acc: number, sc: any) =>
                      acc +
                      (sc.technicalScore +
                        sc.architectureScore +
                        sc.problemSolvingScore +
                        sc.communicationScore +
                        sc.cultureScore) /
                        5,
                    0
                  );
                  avg = Number((sum / count).toFixed(1));
                }
                return (
                  <td
                    key={d.id}
                    className="p-3.5 border-r border-hairline last:border-r-0"
                  >
                    {count > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-mono font-bold text-amber-500 text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{avg}</span>
                        </span>
                        <span className="text-xs text-fg-muted font-mono">
                          ({count} reviewer{count > 1 ? "s" : ""})
                        </span>
                      </div>
                    ) : (
                      <span className="text-fg-muted text-xs">No scorecards yet</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Row: Risk Flags */}
            <tr className="hover:bg-hairline/20">
              <td className="p-3.5 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Risk Flags
              </td>
              {dossiers.map((d) => {
                const flags = d.aiScoreBreakdown?.riskFlags || [];
                return (
                  <td
                    key={d.id}
                    className="p-3.5 border-r border-hairline last:border-r-0"
                  >
                    {flags.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {flags.map((fl: string) => (
                          <span
                            key={fl}
                            className="flex items-center gap-1 text-[10px] font-mono text-danger font-medium"
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{fl.replace(/_/g, " ")}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-500 text-[11px] font-medium">
                        ✓ No risk flags detected
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Skills Matrix Section Header */}
            <tr className="bg-canvas/80">
              <td
                colSpan={dossiers.length + 1}
                className="p-2.5 font-bold text-xs uppercase tracking-wider text-fg-muted border-y border-hairline"
              >
                Full Skills Coverage Matrix ({allSkills.length} Total Competencies)
              </td>
            </tr>

            {/* Row per skill */}
            {allSkills.map((skill) => (
              <tr key={skill} className="hover:bg-hairline/20">
                <td className="p-3 font-medium text-fg bg-canvas/40 border-r border-hairline flex items-center justify-between">
                  <span>{skill}</span>
                </td>
                {dossiers.map((d) => {
                  const hasSkill = d.candidate.skills?.includes(skill);
                  const isRequired = d.job.requiredSkills?.includes(skill);
                  return (
                    <td
                      key={d.id}
                      className="p-3 border-r border-hairline last:border-r-0 text-center"
                    >
                      {hasSkill ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-500 font-semibold">
                          <Check className="w-4 h-4" />
                          {isRequired && (
                            <span className="text-[10px] text-primary font-mono font-bold">
                              Req
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-fg-muted/40">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
