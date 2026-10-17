"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useJobs } from "@/hooks/use-jobs";
import { JobFormDrawer } from "@/components/jobs/job-form-drawer";
import { Mono } from "@/components/ui/mono";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Plus,
  Edit2,
  Users,
  Target,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";

export default function JobsPage() {
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-[1600px] w-full mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">
            Job Requisitions & Hiring Plan
          </h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Manage headcount targets, required competencies, compensation bands, and stage SLAs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center bg-panel border border-hairline p-0.5 rounded-md">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-hairline text-fg"
                  : "text-fg-muted hover:text-fg"
              }`}
              title="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "cards"
                  ? "bg-hairline text-fg"
                  : "text-fg-muted hover:text-fg"
              }`}
              title="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
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
        <div className="flex items-center gap-1.5 bg-panel border border-hairline p-1 rounded-md text-xs">
          <span className="text-[11px] font-semibold text-fg-muted uppercase px-2">
            Status:
          </span>
          {["", "OPEN", "PAUSED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedStatus === st
                  ? "bg-primary text-white font-semibold"
                  : "text-fg-muted hover:text-fg hover:bg-hairline/40"
              }`}
            >
              {st || "All"}
            </button>
          ))}
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-1.5 bg-panel border border-hairline p-1 rounded-md text-xs">
            <span className="text-[11px] font-semibold text-fg-muted uppercase px-2">
              Dept:
            </span>
            <button
              onClick={() => setSelectedDept("")}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                selectedDept === ""
                  ? "bg-primary text-white font-semibold"
                  : "text-fg-muted hover:text-fg hover:bg-hairline/40"
              }`}
            >
              All
            </button>
            {departments.map((dept: any) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  selectedDept === dept
                    ? "bg-primary text-white font-semibold"
                    : "text-fg-muted hover:text-fg hover:bg-hairline/40"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content: Table or Cards */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto border border-hairline rounded-lg bg-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-canvas/60 border-b border-hairline text-fg-muted uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Code & Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Compensation Band</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Hiring Manager</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {jobs.map((job: any) => (
                <tr
                  key={job.id}
                  className="hover:bg-hairline/30 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex flex-col group-hover:text-primary transition-colors"
                    >
                      <span className="font-bold text-fg text-sm">
                        {job.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-fg-muted font-mono">
                        <Mono>{job.code}</Mono>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.workMode}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-fg font-medium">
                    {job.department}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-fg">
                        <Mono>{job.headcountFilled} / {job.headcountTotal}</Mono>
                      </span>
                      <div className="w-16 bg-hairline h-1.5 rounded-full overflow-hidden">
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
                  </td>
                  <td className="py-3 px-4 font-mono text-fg-muted">
                    <Mono>
                      ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k {job.currency}
                    </Mono>
                  </td>
                  <td className="py-3 px-4">
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
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        job.priority === "URGENT"
                          ? "bg-danger-surface text-danger border border-danger/30"
                          : job.priority === "HIGH"
                          ? "bg-amber-500/10 text-amber-500"
                          : "text-fg-muted"
                      }`}
                    >
                      {job.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-fg-muted">
                    {job.hiringManager?.name || "Unassigned"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        <Button
                          variant="outline"
                          size="xs"
                          icon={<ExternalLink className="w-3 h-3" />}
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {jobs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-fg-muted">
                    No job requisitions found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job: any) => (
            <div
              key={job.id}
              className="p-5 bg-panel border border-hairline rounded-lg shadow-xs flex flex-col justify-between gap-4 hover:border-fg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs text-primary font-bold">
                    {job.code}
                  </span>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-bold text-base text-fg hover:text-primary transition-colors truncate"
                  >
                    {job.title}
                  </Link>
                  <span className="text-xs text-fg-muted">
                    {job.department} • {job.location} ({job.workMode})
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
                    job.status === "OPEN"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-hairline text-fg-muted"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              {/* Headcount progress */}
              <div className="flex flex-col gap-1.5 p-3 bg-canvas border border-hairline rounded-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">Headcount Filled</span>
                  <span className="font-mono font-bold text-fg">
                    <Mono>{job.headcountFilled} / {job.headcountTotal}</Mono>
                  </span>
                </div>
                <div className="w-full bg-hairline h-1.5 rounded-full overflow-hidden">
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

              {/* Skills Tags */}
              <div className="flex items-center gap-1 flex-wrap">
                {job.requiredSkills.slice(0, 4).map((sk: string) => (
                  <span
                    key={sk}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-hairline text-fg-muted font-medium"
                  >
                    {sk}
                  </span>
                ))}
                {job.requiredSkills.length > 4 && (
                  <span className="text-[10px] font-mono text-fg-muted">
                    +{job.requiredSkills.length - 4}
                  </span>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs">
                <span className="font-mono text-fg-muted">
                  ${(job.salaryMin / 1000).toFixed(0)}k–${(job.salaryMax / 1000).toFixed(0)}k
                </span>
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
            </div>
          ))}
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
