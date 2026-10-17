"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useJob } from "@/hooks/use-jobs";
import { useApplications } from "@/hooks/use-applications";
import { JobFormDrawer } from "@/components/jobs/job-form-drawer";
import { Mono } from "@/components/ui/mono";
import { Button } from "@/components/ui/button";
import { StagePill } from "@/components/ui/stage-pill";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SlaBadge } from "@/components/ui/sla-badge";
import { useUiStore } from "@/stores/ui-store";
import { Stage, ALL_STAGES } from "@/lib/validations/common";
import {
  ArrowLeft,
  Edit2,
  Users,
  Target,
  Clock,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);

  const { data: job, isLoading, isError } = useJob(id);
  const { data: applicationsData } = useApplications({ jobIds: [id] });

  const applications = applicationsData?.data || [];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-fg-muted">
        Loading requisition details...
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="p-8 text-center text-xs text-fg-muted flex flex-col items-center gap-3">
        <span>Job requisition not found</span>
        <Button variant="outline" size="sm" onClick={() => router.push("/jobs")}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  // Count applications by stage
  const stageCounts: Record<string, number> = {};
  for (const app of applications) {
    stageCounts[app.currentStage] = (stageCounts[app.currentStage] || 0) + 1;
  }

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1400px] w-full mx-auto">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Requisitions</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          icon={<Edit2 className="w-3.5 h-3.5" />}
          onClick={() => setIsEditOpen(true)}
        >
          Edit Requisition
        </Button>
      </div>

      {/* Main Header Card */}
      <div className="p-6 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary-muted border border-primary/20">
                {job.code}
              </span>
              <h1 className="text-xl font-bold text-fg">{job.title}</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  job.status === "OPEN"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : job.status === "PAUSED"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-hairline text-fg-muted"
                }`}
              >
                {job.status}
              </span>
            </div>
            <p className="text-xs text-fg-muted">
              {job.department} • {job.location} ({job.workMode}) • {job.employmentType.replace("_", " ")}
            </p>
          </div>

          {/* Headcount pill */}
          <div className="flex items-center gap-3 p-3 bg-canvas border border-hairline rounded-md">
            <div className="flex flex-col">
              <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold">
                Headcount Progress
              </span>
              <span className="font-mono text-base font-bold text-fg">
                <Mono>{job.headcountFilled} / {job.headcountTotal}</Mono> filled
              </span>
            </div>
            <div className="w-20 bg-hairline h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (job.headcountFilled / job.headcountTotal) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Key metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-hairline text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-fg-muted">Compensation Band</span>
            <span className="font-mono font-bold text-fg">
              <Mono>
                ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k {job.currency}
              </Mono>
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-fg-muted">Experience Target</span>
            <span className="font-mono font-bold text-fg">
              <Mono>{job.minExperienceYears} – {job.maxExperienceYears} years</Mono>
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-fg-muted">Hiring Manager</span>
            <span className="font-bold text-fg">
              {job.hiringManager?.name || "Unassigned"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-fg-muted">Date Opened</span>
            <span className="font-mono text-fg">
              {format(new Date(job.openedAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Skills required */}
        <div className="flex flex-col gap-2 pt-3 border-t border-hairline text-xs">
          <span className="font-semibold text-fg">Required Core Competencies</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {job.requiredSkills.map((sk: string) => (
              <span
                key={sk}
                className="px-2 py-0.5 rounded bg-primary-muted text-primary text-xs font-medium border border-primary/20"
              >
                {sk}
              </span>
            ))}
            {job.niceToHaveSkills?.map((sk: string) => (
              <span
                key={sk}
                className="px-2 py-0.5 rounded bg-hairline text-fg-muted text-xs font-medium"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Funnel Bar */}
      <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-3">
        <h3 className="text-xs font-bold text-fg uppercase tracking-wider">
          Current Candidate Distribution ({applications.length} Active Applicants)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {ALL_STAGES.filter((s) => s !== "REJECTED" && s !== "WITHDRAWN").map(
            (stage) => {
              const count = stageCounts[stage] || 0;
              return (
                <div
                  key={stage}
                  className="p-2.5 bg-canvas border border-hairline rounded-md flex flex-col items-center gap-1 text-center"
                >
                  <StagePill stage={stage} size="xs" />
                  <span className="font-mono text-sm font-bold text-fg mt-1">
                    <Mono>{count}</Mono>
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Candidate Roster Table */}
      <div className="p-4 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-fg">Requisition Candidate Roster</h3>
          <Link
            href={`/pipeline?jobs=${job.id}`}
            className="text-xs text-primary hover:underline font-medium"
          >
            Open in Pipeline Workspace →
          </Link>
        </div>

        <div className="overflow-x-auto border border-hairline rounded-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-canvas/60 border-b border-hairline text-fg-muted uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Current Stage</th>
                <th className="py-2.5 px-3">Match Score</th>
                <th className="py-2.5 px-3">SLA Status</th>
                <th className="py-2.5 px-3">Experience</th>
                <th className="py-2.5 px-3">Target Comp</th>
                <th className="py-2.5 px-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => setActiveDossierId(app.id)}
                  className="hover:bg-hairline/30 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-fg hover:text-primary transition-colors">
                        {app.candidate.fullName}
                      </span>
                      <Mono className="text-[10px] text-fg-muted">
                        {app.candidate.publicCode}
                      </Mono>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <StagePill stage={app.currentStage} size="xs" />
                  </td>
                  <td className="py-2.5 px-3">
                    <ScoreBadge score={app.aiMatchScore} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <SlaBadge
                      slaState={app.slaState}
                      daysInStage={app.daysInStage}
                      slaDays={app.slaDays}
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-fg">
                    <Mono>{app.candidate.experienceYears}y</Mono>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-fg-muted">
                    {app.candidate.expectedSalary
                      ? `$${(app.candidate.expectedSalary / 1000).toFixed(0)}k`
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-fg-muted">
                    {format(new Date(app.appliedAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}

              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-fg-muted">
                    No candidates currently assigned to this requisition.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Drawer */}
      <JobFormDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        job={job}
      />
    </div>
  );
}
