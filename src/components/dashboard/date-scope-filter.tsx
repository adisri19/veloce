"use client";

import React, { useState, useRef, useEffect } from "react";
import { useJobs } from "@/hooks/use-jobs";
import { Calendar, Briefcase, ChevronDown, Check } from "lucide-react";
import { subDays, startOfYear } from "date-fns";
import { clsx } from "clsx";

export interface DateScopeFilterProps {
  from?: string;
  to?: string;
  jobIds: string[];
  activePreset?: string;
  onChange: (filters: { from?: string; to?: string; jobIds: string[]; preset?: string }) => void;
}

export function DateScopeFilter({
  from,
  to,
  jobIds,
  activePreset = "90d",
  onChange,
}: DateScopeFilterProps) {
  const { data: jobs = [] } = useJobs();
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsJobDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = [
    { label: "7D", id: "7d", days: 7 },
    { label: "30D", id: "30d", days: 30 },
    { label: "90D", id: "90d", days: 90 },
    { label: "YTD", id: "ytd", isYtd: true },
  ];

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    const today = new Date();
    const toIso = today.toISOString();
    let fromIso: string;

    if (preset.isYtd) {
      fromIso = startOfYear(today).toISOString();
    } else {
      fromIso = subDays(today, preset.days || 30).toISOString();
    }

    onChange({ from: fromIso, to: toIso, jobIds, preset: preset.id });
  };

  const handleJobToggle = (id: string) => {
    const nextJobIds = jobIds.includes(id)
      ? jobIds.filter((j) => j !== id)
      : [...jobIds, id];
    onChange({ from, to, jobIds: nextJobIds, preset: activePreset });
  };

  const handleClearJobs = () => {
    onChange({ from, to, jobIds: [], preset: activePreset });
  };

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Date Presets Segmented Control */}
      <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 shadow-xs">
        <div className="flex items-center px-2 text-fg-muted">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetSelect(p)}
            className={clsx(
              "px-3 py-1 text-xs rounded-md font-mono font-medium transition-all duration-150",
              activePreset === p.id
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-white/[0.04]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Requisition Scope Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs font-medium text-fg hover:border-white/12 transition-all shadow-xs"
        >
          <Briefcase className="w-3.5 h-3.5 text-fg-muted" />
          <span>
            {jobIds.length === 0
              ? "All Requisitions"
              : `${jobIds.length} Requisition${jobIds.length > 1 ? "s" : ""}`}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-fg-muted ml-0.5" />
        </button>

        {isJobDropdownOpen && (
          <div className="absolute top-full mt-1.5 right-0 w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50 flex flex-col max-h-72 overflow-y-auto">
            <div className="px-3 pb-2 mb-1 border-b border-white/10 flex items-center justify-between text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
              <span>Filter by Requisition</span>
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
                  className="flex items-center justify-between px-3 py-2 text-left text-xs text-fg hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium truncate">{job.title}</span>
                    <span className="text-[10px] text-fg-muted font-mono">
                      {job.code} • {job.department}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-white/20 bg-white/[0.02]"
                    )}
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
