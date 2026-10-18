"use client";

import React, { useState, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { Mono } from "../ui/mono";
import { StagePill } from "../ui/stage-pill";
import { ScoreRing } from "../ui/score-ring";
import { Button } from "../ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useStageMutation } from "@/hooks/use-stage-mutation";
import { useCompareStore } from "@/stores/compare-store";
import { STAGE_ORDER, Stage } from "@/lib/validations/common";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Check,
  X,
  AlertTriangle,
  Crown,
  ArrowRight,
  UserX,
  ExternalLink,
  Star,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

export interface CompareMatrixProps {
  dossiers: any[]; // Full dossier objects
}

const CANDIDATE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899"];

export function CompareMatrix({ dossiers }: CompareMatrixProps) {
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const setRejectionModalAppId = useUiStore((s) => s.setRejectionModalAppId);
  const removeCandidate = useCompareStore((s) => s.removeCandidate);
  const stageMutation = useStageMutation();

  // Radar overlay candidate visibility toggles
  const [visibleRadarCandidates, setVisibleRadarCandidates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    dossiers.forEach((d) => (initial[d.id] = true));
    return initial;
  });

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    radar: false,
    fit: false,
    skills: false,
    compensation: false,
    experience: false,
    interviews: false,
    risk: false,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRadarCandidate = (id: string) => {
    setVisibleRadarCandidates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (dossiers.length === 0) return null;

  // Check if candidates are for different jobs
  const distinctJobs = Array.from(new Set(dossiers.map((d) => d.job.id)));
  const hasCrossJobComparison = distinctJobs.length > 1;

  // Calculate highest benchmarks
  const highestScore = Math.max(...dossiers.map((d) => d.aiMatchScore));
  const highestExp = Math.max(...dossiers.map((d) => d.candidate.experienceYears));
  const highestScorecard = Math.max(
    ...dossiers.map((d) => d.scorecards?.reduce((acc: number, s: any) => acc + (s.overallRecommendation === "STRONG_YES" ? 5 : s.overallRecommendation === "YES" ? 4 : 3), 0) / (d.scorecards?.length || 1) || 0)
  );

  // Compute union of all skills across candidates
  const allSkills = Array.from(
    new Set(dossiers.flatMap((d) => d.candidate.skills || []))
  ).sort();

  // Prepare Radar Overlay Data (4 axes)
  const radarAxes = [
    { subject: "Core Skills (40%)", key: "skills" },
    { subject: "Experience (25%)", key: "experience" },
    { subject: "Comp Fit (15%)", key: "compensation" },
    { subject: "Domain (20%)", key: "domain" },
  ];

  const radarData = radarAxes.map((axis) => {
    const row: any = { subject: axis.subject, fullMark: 100 };
    dossiers.forEach((d) => {
      const comp = d.aiScoreBreakdown?.components?.[axis.key]?.score ?? 75;
      row[d.id] = comp;
    });
    return row;
  });

  // Derived Winner Strip Computation
  const dimensions = ["AI Match", "Experience Fit", "Comp Alignment", "Scorecard Signal", "Skills Coverage", "Lowest Risk"];
  const winsCount: Record<string, number> = {};
  dossiers.forEach((d) => (winsCount[d.id] = 0));

  // 1. AI Match
  dossiers.forEach((d) => {
    if (d.aiMatchScore === highestScore) winsCount[d.id] = (winsCount[d.id] || 0) + 1;
  });
  // 2. Experience
  dossiers.forEach((d) => {
    if (d.candidate.experienceYears === highestExp) winsCount[d.id] = (winsCount[d.id] || 0) + 1;
  });
  // 3. Comp
  const lowestComp = Math.min(...dossiers.map((d) => d.candidate.expectedSalary || 9999999));
  dossiers.forEach((d) => {
    if (d.candidate.expectedSalary === lowestComp) winsCount[d.id] = (winsCount[d.id] || 0) + 1;
  });
  // 4. Skills
  const maxSkills = Math.max(...dossiers.map((d) => d.candidate.skills?.length || 0));
  dossiers.forEach((d) => {
    if ((d.candidate.skills?.length || 0) === maxSkills) winsCount[d.id] = (winsCount[d.id] || 0) + 1;
  });
  // 5. Scorecard
  dossiers.forEach((d) => {
    if ((d.scorecards?.length || 0) > 0 && d.avgScorecard !== null) {
      winsCount[d.id] = (winsCount[d.id] || 0) + 1;
    }
  });

  // Find overall leader
  let overallLeader = dossiers[0];
  let maxWins = 0;
  dossiers.forEach((d) => {
    const count = winsCount[d.id] || 0;
    if (count > maxWins) {
      maxWins = count;
      overallLeader = d;
    }
  });

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
    <div className="flex flex-col gap-5 select-none">
      {/* Winner Strip Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-fg flex items-center gap-2">
              <span>Calibration Leader:</span>
              <span className="text-emerald-400">{overallLeader?.candidate.fullName}</span>
              <Mono className="text-[10px] text-fg-muted font-normal">
                ({overallLeader?.candidate.publicCode})
              </Mono>
            </span>
            <span className="text-xs text-fg-muted mt-0.5">
              Leads in <strong className="text-emerald-400 font-mono">{maxWins}</strong> of{" "}
              <span className="font-mono">{dimensions.length}</span> key hiring dimensions based on algorithmic and interviewer signal
            </span>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Top Calibrated Pick</span>
        </span>
      </div>

      {hasCrossJobComparison && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-400">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>Cross-Requisition Comparison:</strong> Candidates in this comparison applied to different job requisitions ({distinctJobs.length} different roles). AI match scores and salary evaluations are calibrated relative to each specific job&apos;s requirements and budget bands.
          </span>
        </div>
      )}

      {/* Radar Overlay Card with Legend Toggles */}
      <div className="p-5 bg-panel border border-hairline rounded-xl shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-fg">
              Multi-Candidate Radar Overlay
            </h3>
          </div>

          {/* Legend Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            {dossiers.map((d, index) => {
              const color = CANDIDATE_COLORS[index % CANDIDATE_COLORS.length];
              const isVisible = visibleRadarCandidates[d.id] !== false;
              return (
                <button
                  key={d.id}
                  onClick={() => toggleRadarCandidate(d.id)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all",
                    isVisible
                      ? "bg-white/[0.04] text-fg border-white/20"
                      : "opacity-40 text-fg-muted border-transparent hover:opacity-70"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium truncate max-w-[110px]">
                    {d.candidate.fullName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Radar Graphic */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="rgba(255, 255, 255, 0.08)"
                tick={false}
              />
              {dossiers.map((d, index) => {
                const color = CANDIDATE_COLORS[index % CANDIDATE_COLORS.length];
                const isVisible = visibleRadarCandidates[d.id] !== false;
                if (!isVisible) return null;
                return (
                  <Radar
                    key={d.id}
                    name={d.candidate.fullName}
                    dataKey={d.id}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                );
              })}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto border border-hairline rounded-xl bg-panel shadow-xs">
        <table className="w-full text-left border-collapse min-w-[700px]">
          {/* Header Row: Sticky Candidate Cards */}
          <thead className="sticky top-0 z-20 bg-panel/95 backdrop-blur-md border-b border-hairline">
            <tr>
              <th className="w-56 p-4 text-xs font-bold text-fg-muted uppercase tracking-wider bg-canvas/40 border-r border-hairline">
                Evaluation Dimension
              </th>
              {dossiers.map((d, index) => (
                <th
                  key={d.id}
                  className="p-4 border-r border-hairline last:border-r-0 min-w-[260px] max-w-[320px]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
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
                        className="text-fg-muted hover:text-fg p-1 rounded hover:bg-white/[0.06] transition-colors"
                        title="Remove from comparison"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col text-xs text-fg-muted">
                        <span className="font-medium text-fg truncate max-w-[160px]">
                          {d.candidate.currentTitle}
                        </span>
                        <span className="text-[11px] truncate max-w-[160px]">
                          at {d.candidate.currentCompany || "N/A"}
                        </span>
                        <span className="text-[10px] font-mono text-primary mt-0.5">
                          {d.job.code}: {d.job.title}
                        </span>
                      </div>
                      <ScoreRing score={d.aiMatchScore} size="sm" />
                    </div>

                    {/* Column Quick Actions */}
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
            {/* ROW: AI Match Score & Components */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                AI Match Score
              </td>
              {dossiers.map((d) => {
                const isBest = d.aiMatchScore === highestScore && dossiers.length > 1;
                return (
                  <td
                    key={d.id}
                    className={clsx(
                      "p-4 border-r border-hairline last:border-r-0",
                      isBest && "bg-emerald-500/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Mono className="text-base font-bold text-fg">
                        {d.aiMatchScore}%
                      </Mono>
                      {isBest && (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                          <Crown className="w-3.5 h-3.5" />
                          <span>Leader</span>
                        </span>
                      )}
                    </div>
                    {/* Component Breakdown Mini Bars */}
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

            {/* ROW: Pipeline Stage & Dwell */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Pipeline Stage & Dwell
              </td>
              {dossiers.map((d) => (
                <td key={d.id} className="p-4 border-r border-hairline last:border-r-0">
                  <div className="flex items-center gap-2">
                    <StagePill stage={d.currentStage as Stage} size="sm" />
                    <span className="font-mono text-fg-muted text-[11px]">
                      {d.slaStatus?.daysInStage || 0}d in stage
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* ROW: Experience Years */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Experience Years
              </td>
              {dossiers.map((d) => {
                const isBest = d.candidate.experienceYears === highestExp && dossiers.length > 1;
                return (
                  <td
                    key={d.id}
                    className={clsx(
                      "p-4 border-r border-hairline last:border-r-0",
                      isBest && "bg-emerald-500/[0.04]"
                    )}
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

            {/* ROW: Expected Salary vs Budget */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Expected Salary vs Budget
              </td>
              {dossiers.map((d) => {
                const exp = d.candidate.expectedSalary;
                const max = d.job.salaryMax;
                const delta = exp ? exp - max : 0;
                return (
                  <td key={d.id} className="p-4 border-r border-hairline last:border-r-0">
                    <div className="flex flex-col gap-1 font-mono">
                      <span className="text-sm font-bold text-fg">
                        {exp ? `$${(exp / 1000).toFixed(0)}k` : "Undisclosed"}
                      </span>
                      <span className="text-[11px] text-fg-muted">
                        Max Budget: ${(max / 1000).toFixed(0)}k
                      </span>
                      {exp && (
                        <span
                          className={clsx(
                            "text-[10px] font-bold",
                            delta <= 0 ? "text-emerald-400" : "text-rose-400"
                          )}
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

            {/* ROW: Scorecard Signal */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Interviewer Scorecards
              </td>
              {dossiers.map((d) => {
                const scs = d.scorecards || [];
                return (
                  <td key={d.id} className="p-4 border-r border-hairline last:border-r-0">
                    {scs.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{d.avgScorecard || "4.0"} avg ({scs.length} submitted)</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {scs.map((s: any) => (
                            <span
                              key={s.id}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-fg-muted"
                            >
                              {s.overallRecommendation}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-fg-muted font-mono text-[11px]">Pending interviews</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* ROW: Risk Flags */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 font-semibold text-fg bg-canvas/40 border-r border-hairline">
                Risk Flags
              </td>
              {dossiers.map((d) => {
                const flags = d.aiScoreBreakdown?.riskFlags || [];
                return (
                  <td key={d.id} className="p-4 border-r border-hairline last:border-r-0">
                    {flags.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {flags.map((f: string) => (
                          <span
                            key={f}
                            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px]">
                        ✓ No risk flags detected
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
