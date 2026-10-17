"use client";

import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Check, X, Sparkles, AlertCircle, Copy, Search, ExternalLink, RotateCw, FileText } from "lucide-react";
import { ScoreBadge } from "../ui/score-badge";
import { Mono } from "../ui/mono";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export function OverviewTab({ dossier }: { dossier: any }) {
  const queryClient = useQueryClient();
  const [resumeSearch, setResumeSearch] = useState("");
  const [isRescoring, setIsRescoring] = useState(false);

  const breakdown = dossier.aiScoreBreakdown;
  const components = breakdown?.components || {
    skills: { score: 75, weight: 0.4 },
    experience: { score: 80, weight: 0.25 },
    compensation: { score: 90, weight: 0.15 },
    domain: { score: 85, weight: 0.2 },
  };

  const radarData = [
    { subject: "Core Skills (40%)", A: components.skills.score, fullMark: 100 },
    { subject: "Experience (25%)", A: components.experience.score, fullMark: 100 },
    { subject: "Comp Fit (15%)", A: components.compensation.score, fullMark: 100 },
    { subject: "Domain (20%)", A: components.domain.score, fullMark: 100 },
  ];

  const handleRerunScore = async () => {
    setIsRescoring(true);
    try {
      const res = await fetch("/api/v1/candidates/parse-and-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: dossier.jobId,
          applicationId: dossier.id,
          resumeText: dossier.candidate.parsedResumeText,
          persist: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Re-scoring failed");
      toast.success(`Score updated to ${json.data.scoreBreakdown.total}%`);
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(dossier.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Re-score failed");
    } finally {
      setIsRescoring(false);
    }
  };

  const handleCopyResume = () => {
    if (dossier.candidate.parsedResumeText) {
      navigator.clipboard.writeText(dossier.candidate.parsedResumeText);
      toast.success("Resume text copied to clipboard");
    }
  };

  const rawResumeText = dossier.candidate.parsedResumeText || "";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Match Card */}
      <div className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold text-fg uppercase tracking-wider">
              AI Match Analysis & Breakdown
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              isLoading={isRescoring}
              icon={<RotateCw className="w-3 h-3 text-fg-muted" />}
              onClick={handleRerunScore}
            >
              Re-run Scoring
            </Button>
            <ScoreBadge score={dossier.aiMatchScore} size="md" />
          </div>
        </div>

        {/* Radar & Weighted Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--hairline)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--fg-muted)", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--hairline)" tick={false} />
                <Radar
                  name="Candidate"
                  dataKey="A"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2.5">
            {Object.entries(components).map(([key, comp]: [string, any]) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-medium text-fg-muted">{key}</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="font-semibold text-fg">{comp.score}%</span>
                    <span className="text-[10px] text-fg-muted">({Math.round(comp.weight * 100)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-hairline h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary text */}
        {breakdown?.summary && (
          <p className="text-xs text-fg-muted italic border-t border-hairline/60 pt-2">
            &ldquo;{breakdown.summary}&rdquo;
          </p>
        )}
      </div>

      {/* Skills Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Skills */}
        <div className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <Check className="w-3.5 h-3.5" />
            <span>Matched Core Requirements</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {breakdown?.matchedSkills?.length > 0 ? (
              breakdown.matchedSkills.map((s: string) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-success-surface text-success border border-success/30 flex items-center gap-1"
                >
                  <Check className="w-2.5 h-2.5" /> {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-fg-muted">No core skills matched</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
            <X className="w-3.5 h-3.5" />
            <span>Missing Core Requirements</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {breakdown?.missingSkills?.length > 0 ? (
              breakdown.missingSkills.map((s: string) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-danger-surface text-danger border border-danger/30 flex items-center gap-1"
                >
                  <X className="w-2.5 h-2.5" /> {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> All core skills matched
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Risk Flags & Compensation Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Flags */}
        <div className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-2">
          <span className="text-xs font-semibold text-fg uppercase tracking-wider">
            Risk Flags ({breakdown?.riskFlags?.length || 0})
          </span>
          <div className="flex flex-col gap-1.5">
            {breakdown?.riskFlags?.length > 0 ? (
              breakdown.riskFlags.map((rf: string) => (
                <div
                  key={rf}
                  className="flex items-center gap-2 text-xs text-amber-500 bg-warn-surface px-2.5 py-1.5 rounded border border-warn/25"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono text-[11px] font-semibold">{rf}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-fg-muted">No risk flags detected</span>
            )}
          </div>
        </div>

        {/* Key Facts */}
        <div className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-fg uppercase tracking-wider">Key Facts</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-fg-muted block text-[11px]">Notice Period</span>
              <Mono className="text-fg font-semibold">{dossier.candidate.noticePeriodDays || 30} days</Mono>
            </div>
            <div>
              <span className="text-fg-muted block text-[11px]">Location</span>
              <span className="text-fg font-medium">{dossier.candidate.location || "Remote"}</span>
            </div>
            <div>
              <span className="text-fg-muted block text-[11px]">Expected Salary</span>
              <Mono className="text-fg font-semibold">
                {dossier.candidate.expectedSalary
                  ? `$${dossier.candidate.expectedSalary.toLocaleString()}`
                  : "Not specified"}
              </Mono>
            </div>
            <div>
              <span className="text-fg-muted block text-[11px]">Job Budget Band</span>
              <Mono className="text-fg font-semibold">
                ${dossier.job.salaryMin.toLocaleString()} – ${dossier.job.salaryMax.toLocaleString()}
              </Mono>
            </div>
          </div>
        </div>
      </div>

      {/* Parsed Resume Viewer */}
      <div className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-fg uppercase tracking-wider">
              Parsed Resume Content
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-fg-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search within resume..."
                value={resumeSearch}
                onChange={(e) => setResumeSearch(e.target.value)}
                className="pl-6 pr-2 py-1 text-xs bg-panel border border-hairline rounded w-44 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              size="xs"
              icon={<Copy className="w-3 h-3" />}
              onClick={handleCopyResume}
            >
              Copy Text
            </Button>
          </div>
        </div>

        <div className="bg-panel p-3.5 rounded border border-hairline max-h-60 overflow-y-auto text-xs font-mono leading-relaxed text-fg whitespace-pre-wrap select-text">
          {rawResumeText ? (
            resumeSearch ? (
              // Highlight matched search terms
              rawResumeText.split(new RegExp(`(${resumeSearch})`, "gi")).map((part: string, i: number) =>
                part.toLowerCase() === resumeSearch.toLowerCase() ? (
                  <mark key={i} className="bg-amber-300 text-black px-0.5 rounded">
                    {part}
                  </mark>
                ) : (
                  part
                )
              )
            ) : (
              rawResumeText
            )
          ) : (
            <span className="text-fg-muted">No resume text on file.</span>
          )}
        </div>
      </div>
    </div>
  );
}
