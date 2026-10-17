"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Kanban,
  Table as TableIcon,
  Columns,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button, IconButton } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { Stage, ALL_STAGES } from "@/lib/validations/common";
import { PipelineViewMode } from "@/stores/ui-store";

export interface FilterBarProps {
  facets?: any;
  totals?: { filtered: number; all: number };
}

export function FilterBar({ facets, totals }: FilterBarProps) {
  const { filters, updateFilters, clearAllFilters } = useUrlFilters();
  const [searchInput, setSearchInput] = useState(filters.q);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Debounced search sync
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  React.useEffect(() => {
    if (debouncedSearch !== filters.q) {
      updateFilters({ q: debouncedSearch });
    }
  }, [debouncedSearch, filters.q, updateFilters]);

  const hasActiveFilters =
    Boolean(filters.q) ||
    filters.stages.length > 0 ||
    filters.jobIds.length > 0 ||
    filters.departments.length > 0 ||
    filters.minScore !== null ||
    filters.slaBreachedOnly ||
    filters.sources.length > 0;

  // Preset handlers
  const handleApplyPreset = (preset: "needs-action" | "high-potential" | "offer-stage") => {
    if (preset === "needs-action") {
      updateFilters({ slaBreachedOnly: true, minScore: null, stages: [] });
    } else if (preset === "high-potential") {
      updateFilters({ minScore: 85, slaBreachedOnly: false, stages: [] });
    } else if (preset === "offer-stage") {
      updateFilters({ stages: ["OFFER"], minScore: null, slaBreachedOnly: false });
    }
  };

  const handleToggleStage = (st: Stage) => {
    const next = filters.stages.includes(st)
      ? filters.stages.filter((s) => s !== st)
      : [...filters.stages, st];
    updateFilters({ stages: next });
  };

  return (
    <div className="flex flex-col gap-2.5 px-6 py-3 border-b border-hairline bg-panel shrink-0 select-none">
      {/* Top Bar Row: Search + View Switcher */}
      <div className="flex items-center justify-between gap-4">
        {/* Search & Presets */}
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-fg-muted pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by candidate, email, title, skills, or notes..."
              className="w-full bg-canvas border border-hairline rounded-md pl-9 pr-3 py-1.5 text-xs text-fg placeholder:text-fg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-2 text-fg-muted hover:text-fg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleApplyPreset("needs-action")}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border transition-colors ${
                filters.slaBreachedOnly
                  ? "bg-danger-surface text-danger border-danger/30 font-semibold"
                  : "bg-canvas text-fg-muted border-hairline hover:bg-hairline/40"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-danger" />
              <span>Needs Action</span>
            </button>
            <button
              onClick={() => handleApplyPreset("high-potential")}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border transition-colors ${
                filters.minScore === 85
                  ? "bg-primary-muted text-primary border-primary/30 font-semibold"
                  : "bg-canvas text-fg-muted border-hairline hover:bg-hairline/40"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>High Potential ≥85</span>
            </button>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-canvas border border-hairline p-0.5 rounded-md">
            {[
              { id: "kanban", label: "Kanban", icon: <Kanban className="w-3.5 h-3.5" />, key: "1" },
              { id: "grid", label: "Grid", icon: <TableIcon className="w-3.5 h-3.5" />, key: "2" },
              { id: "split", label: "Split Triage", icon: <Columns className="w-3.5 h-3.5" />, key: "3" },
            ].map((v) => {
              const isActive = filters.view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => updateFilters({ view: v.id as PipelineViewMode })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    isActive
                      ? "bg-panel text-fg font-semibold shadow-xs"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {v.icon}
                  <span>{v.label}</span>
                  <Kbd className="ml-0.5">{v.key}</Kbd>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Chips & Count Row */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            Filters:
          </span>

          {/* SLA Filter Toggle */}
          <button
            onClick={() => updateFilters({ slaBreachedOnly: !filters.slaBreachedOnly })}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
              filters.slaBreachedOnly
                ? "bg-danger-surface text-danger border-danger/40 font-semibold"
                : "bg-canvas text-fg-muted border-hairline hover:text-fg"
            }`}
          >
            SLA Breached ({facets?.slaBreached ?? 0})
          </button>

          {/* Min Score Slider Chip */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-canvas border border-hairline rounded text-[11px] text-fg-muted">
            <span>Score:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minScore ?? 0}
              onChange={(e) => updateFilters({ minScore: Number(e.target.value) || null })}
              className="w-16 accent-primary"
            />
            <span className="font-mono text-fg font-semibold">
              {filters.minScore !== null ? `≥${filters.minScore}%` : "All"}
            </span>
            {filters.minScore !== null && (
              <button
                onClick={() => updateFilters({ minScore: null })}
                className="hover:text-fg text-fg-muted ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Department Chips */}
          {facets?.departments &&
            Object.entries(facets.departments).map(([dept, count]: [string, any]) => {
              const isSelected = filters.departments.includes(dept);
              return (
                <button
                  key={dept}
                  onClick={() => {
                    const next = isSelected
                      ? filters.departments.filter((d) => d !== dept)
                      : [...filters.departments, dept];
                    updateFilters({ departments: next });
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    isSelected
                      ? "bg-primary-muted text-primary border-primary/40 font-semibold"
                      : "bg-canvas text-fg-muted border-hairline hover:text-fg"
                  }`}
                >
                  {dept} ({count})
                </button>
              );
            })}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-fg-muted hover:text-fg underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Results summary count */}
        <div className="text-fg-muted text-[11px] shrink-0 font-mono">
          Showing <strong className="text-fg font-semibold">{totals?.filtered ?? 0}</strong> of{" "}
          <span>{totals?.all ?? 0}</span> applications
        </div>
      </div>
    </div>
  );
}
