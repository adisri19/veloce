"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useJobs } from "@/hooks/use-jobs";
import { JobFormDrawer } from "@/components/jobs/job-form-drawer";
import { Mono } from "@/components/ui/mono";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MiniFunnel } from "@/components/ui/mini-funnel";
import {
  Briefcase,
  Plus,
  Edit2,
  Users,
  Target,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export default function JobsPage() {
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  // Default to card grid per specification
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: jobs = [], isLoading } = useJobs({
    department: selectedDept || undefined,
    status: selectedStatus || undefined,
  });

  const departments = Array.from(new Set(jobs.map((j: any) => j.department)));

  const handleEdit = (job: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingJob(job);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] w-full mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Job Requisitions & Hiring Plan
          </h1>
          <p className="text-xs text-fg-muted mt-1 font-mono">
            Manage headcount targets, required competencies, compensation bands, and stage SLAs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("cards")}
              className={clsx(
                "p-1.5 rounded-md transition-colors",
                viewMode === "cards"
                  ? "bg-panel text-fg shadow-xs border border-white/10"
                  : "text-fg-muted hover:text-fg"
              )}
              title="Cards view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={clsx(
                "p-1.5 rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-panel text-fg shadow-xs border border-white/10"
                  : "text-fg-muted hover:text-fg"
              )}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleCreate}
          >
            New Requisition
          </Button>
        </div>
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] p-1 rounded-lg text-xs font-mono">
          <span className="text-[11px] font-semibold text-fg-muted uppercase px-2">
            Status:
          </span>
          {["", "OPEN", "PAUSED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={clsx(
                "px-2.5 py-1 rounded-md transition-all font-medium",
                selectedStatus === st
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-fg-muted hover:text-fg hover:bg-white/[0.04]"
              )}
            >
              {st || "All"}
            </button>
          ))}
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] p-1 rounded-lg text-xs font-mono">
            <span className="text-[11px] font-semibold text-fg-muted uppercase px-2">
              Dept:
            </span>
            <button
              onClick={() => setSelectedDept("")}
              className={clsx(
                "px-2.5 py-1 rounded-md transition-all font-medium",
                selectedDept === ""
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-fg-muted hover:text-fg hover:bg-white/[0.04]"
              )}
            >
              All
            </button>
            {departments.map((dept: any) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={clsx(
                  "px-2.5 py-1 rounded-md transition-all font-medium",
                  selectedDept === dept
                    ? "bg-primary text-white font-semibold shadow-xs"
                    : "text-fg-muted hover:text-fg hover:bg-white/[0.04]"
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Jobs Surface: Card Grid default vs Table */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job: any, index: number) => {
            const isClosed = job.status === "CLOSED";
            const isPaused = job.status === "PAUSED";
            const isUrgent = job.priority === "URGENT";

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className={clsx(
                  "relative p-5 bg-panel border rounded-xl shadow-xs flex flex-col justify-between gap-4 transition-all duration-150 overflow-hidden",
                  isPaused && "opacity-75 grayscale-[0.2]",
                  isClosed ? "border-hairline/80 bg-white/[0.01]" : "border-hairline hover:border-white/15 hover:shadow-lg"
                )}
              >
                {/* Closed "Filled" Ribbon */}
                {isClosed && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Filled</span>
                  </div>
                )}

                {/* Top Header: Code, Title, Location & Priority */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-primary font-bold">
                      {job.code}
                    </span>
                    {!isClosed && (
                      <div className="flex items-center gap-1.5">
                        {isPaused && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <PauseCircle className="w-3 h-3" />
                            <span>Paused</span>
                          </span>
                        )}
                        <span
                          className={clsx(
                            "text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 border",
                            isUrgent
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                              : "bg-white/[0.03] text-fg-muted border-white/[0.06]"
                          )}
                        >
                          {job.priority}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-bold text-base text-fg hover:text-primary transition-colors truncate"
                  >
                    {job.title}
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-fg-muted font-mono flex-wrap">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.03] border border-white/[0.05] text-[10px]">
                      {job.workMode}
                    </span>
                  </div>
                </div>

                {/* Headcount progress: ONE line 0/1 without wrapping */}
                <div className="flex flex-col gap-1.5 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-fg-muted">Headcount Target</span>
                    <span className="font-bold text-fg whitespace-nowrap">
                      <Mono className="whitespace-nowrap">
                        {job.headcountFilled} / {job.headcountTotal}
                      </Mono>
                    </span>
                  </div>
                  {/* Segmented headcount bar */}
                  <div className="flex items-center gap-1 w-full h-1.5 rounded-full bg-white/[0.04] p-0.5">
                    {Array.from({ length: job.headcountTotal }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "flex-1 h-full rounded-full transition-colors",
                          i < job.headcountFilled
                            ? "bg-emerald-400"
                            : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Compensation Band Range Bar */}
                <div className="flex flex-col gap-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-fg-muted">
                    <span>Budget Band ({job.currency})</span>
                    <span className="text-fg font-semibold whitespace-nowrap">
                      ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-1.5 rounded-full relative overflow-hidden">
                    <div className="absolute left-[20%] right-[20%] h-full bg-indigo-500/60 rounded-full" />
                  </div>
                </div>

                {/* Skills Chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  {job.requiredSkills.slice(0, 3).map((sk: string) => (
                    <span
                      key={sk}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-fg-muted font-mono"
                    >
                      {sk}
                    </span>
                  ))}
                  {job.requiredSkills.length > 3 && (
                    <span className="text-[10px] font-mono text-fg-muted">
                      +{job.requiredSkills.length - 3}
                    </span>
                  )}
                </div>

                {/* Mini Funnel Spread across bottom */}
                {job.activeByStage && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-fg-muted font-mono block mb-1">
                      Active Pipeline Spread:
                    </span>
                    <MiniFunnel stages={job.activeByStage} />
                  </div>
                )}

                {/* Card Footer: Hiring manager avatar + Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs">
                  {job.hiringManager ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={job.hiringManager.name}
                        src={job.hiringManager.avatarUrl}
                        size="xs"
                      />
                      <span className="text-[11px] text-fg-muted truncate max-w-[110px]">
                        {job.hiringManager.name}
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Edit2 className="w-3 h-3" />}
                      onClick={(e) => handleEdit(job, e)}
                    >
                      Edit
                    </Button>
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline" size="xs">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto border border-hairline rounded-xl bg-panel shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-canvas/60 border-b border-hairline text-fg-muted uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Requisition Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Salary Band</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {jobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-hairline/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {job.code}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-fg hover:text-primary transition-colors block truncate max-w-xs"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-fg-muted font-mono">{job.department}</td>
                  <td className="py-3 px-4 text-fg-muted">
                    {job.location} ({job.workMode})
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-fg whitespace-nowrap">
                    <Mono className="whitespace-nowrap">
                      {job.headcountFilled} / {job.headcountTotal}
                    </Mono>
                  </td>
                  <td className="py-3 px-4 font-mono text-fg-muted whitespace-nowrap">
                    ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={clsx(
                        "text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border",
                        job.status === "OPEN"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : job.status === "PAUSED"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-white/[0.04] text-fg-muted border-white/[0.08]"
                      )}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Edit2 className="w-3 h-3" />}
                        onClick={(e) => handleEdit(job, e)}
                        title="Edit requisition and adjust requirements"
                      >
                        Edit
                      </Button>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Job Create/Edit Drawer */}
      <JobFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        job={editingJob}
      />
    </div>
  );
}
