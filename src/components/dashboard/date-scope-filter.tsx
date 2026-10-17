"use client";

import React, { useState } from "react";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "../ui/button";
import { Calendar, Briefcase, ChevronDown, Check } from "lucide-react";
import { subDays, startOfYear, format } from "date-fns";

export interface DateScopeFilterProps {
  from?: string;
  to?: string;
  jobIds: string[];
  onChange: (filters: { from?: string; to?: string; jobIds: string[] }) => void;
}

export function DateScopeFilter({
  from,
  to,
  jobIds,
  onChange,
}: DateScopeFilterProps) {
  const { data: jobs = [] } = useJobs();
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("90d");

  const presets = [
    { label: "7 Days", id: "7d", days: 7 },
    { label: "30 Days", id: "30d", days: 30 },
    { label: "90 Days", id: "90d", days: 90 },
    { label: "YTD", id: "ytd", isYtd: true },
  ];

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    setActivePreset(preset.id);
    const today = new Date();
    const toIso = today.toISOString();
    let fromIso: string;

    if (preset.isYtd) {
      fromIso = startOfYear(today).toISOString();
    } else {
      fromIso = subDays(today, preset.days || 30).toISOString();
    }

    onChange({ from: fromIso, to: toIso, jobIds });
  };

  const handleJobToggle = (id: string) => {
    const nextJobIds = jobIds.includes(id)
      ? jobIds.filter((j) => j !== id)
      : [...jobIds, id];
    onChange({ from, to, jobIds: nextJobIds });
  };

  const handleClearJobs = () => {
    onChange({ from, to, jobIds: [] });
  };

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Date Presets Segmented Control */}
      <div className="flex items-center bg-panel border border-hairline rounded-md p-0.5">
        <div className="flex items-center px-2 text-fg-muted">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetSelect(p)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activePreset === p.id
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-hairline/30"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Requisition Scope Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-panel border border-hairline rounded-md text-xs font-medium text-fg hover:border-fg-muted/40 transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5 text-fg-muted" />
          <span>
            {jobIds.length === 0
              ? "All Requisitions"
              : `${jobIds.length} Requisition${jobIds.length > 1 ? "s" : ""}`}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-fg-muted ml-1" />
        </button>

        {isJobDropdownOpen && (
          <div className="absolute top-full mt-1.5 right-0 w-72 bg-panel border border-hairline rounded-lg shadow-xl py-2 z-50 flex flex-col max-h-72 overflow-y-auto">
            <div className="px-3 pb-2 mb-1 border-b border-hairline flex items-center justify-between text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              <span>Filter by Job</span>
              {jobIds.length > 0 && (
                <button
                  onClick={handleClearJobs}
                  className="text-primary hover:underline lowercase font-normal"
                >
                  Clear all
                </button>
              )}
            </div>

            {jobs.map((job: any) => {
              const isSelected = jobIds.includes(job.id);
              return (
                <button
                  key={job.id}
                  onClick={() => handleJobToggle(job.id)}
                  className="flex items-center justify-between px-3 py-1.5 text-left text-xs text-fg hover:bg-hairline transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium truncate">{job.title}</span>
                    <span className="text-[10px] text-fg-muted font-mono">
                      {job.code} • {job.department}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-hairline bg-canvas"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
