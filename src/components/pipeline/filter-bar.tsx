"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Check,
} from "lucide-react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Kbd } from "../ui/kbd";
import { Mono } from "../ui/mono";
import { Stage, ALL_STAGES } from "@/lib/validations/common";
import { STAGE_THEME } from "@/lib/stage-theme";
import { PipelineViewMode } from "@/stores/ui-store";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterBarProps {
  facets?: any;
  totals?: { filtered: number; all: number };
}

export function FilterBar({ facets, totals }: FilterBarProps) {
  const { filters, updateFilters, clearAllFilters } = useUrlFilters();
  const [searchInput, setSearchInput] = useState(filters.q);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowFiltersPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search sync
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      updateFilters({ q: debouncedSearch });
    }
  }, [debouncedSearch, filters.q, updateFilters]);

  // Keyboard shortcut '/' to focus search input outside forms
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "1" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        updateFilters({ view: "kanban" });
      }
      if (e.key === "2" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        updateFilters({ view: "grid" });
      }
      if (e.key === "3" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        updateFilters({ view: "split" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [updateFilters]);

  const hasActiveFilters =
    Boolean(filters.q) ||
    filters.stages.length > 0 ||
    filters.jobIds.length > 0 ||
    filters.departments.length > 0 ||
    filters.minScore !== null ||
    filters.slaBreachedOnly ||
    filters.sources.length > 0;

  // Active saved view detection
  const isNeedsAction = filters.slaBreachedOnly && filters.stages.length === 0 && filters.minScore === null;
  const isHighPotential = filters.minScore === 85 && !filters.slaBreachedOnly && filters.stages.length === 0;
  const isOfferStage = filters.stages.length === 1 && filters.stages[0] === "OFFER";
  const isAll = !hasActiveFilters;

  const handleSavedView = (view: "all" | "needs-action" | "high-potential" | "offer-stage") => {
    if (view === "all") {
      clearAllFilters();
    } else if (view === "needs-action") {
      updateFilters({ slaBreachedOnly: true, minScore: null, stages: [] });
    } else if (view === "high-potential") {
      updateFilters({ minScore: 85, slaBreachedOnly: false, stages: [] });
    } else if (view === "offer-stage") {
      updateFilters({ stages: ["OFFER"], minScore: null, slaBreachedOnly: false });
    }
  };

  const handleToggleStage = (st: string) => {
    const next = filters.stages.includes(st)
      ? filters.stages.filter((s) => s !== st)
      : [...filters.stages, st];
    updateFilters({ stages: next });
  };

  const handleToggleDepartment = (dept: string) => {
    const next = filters.departments.includes(dept)
      ? filters.departments.filter((d) => d !== dept)
      : [...filters.departments, dept];
    updateFilters({ departments: next });
  };

  const handleToggleSource = (source: string) => {
    const next = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    updateFilters({ sources: next });
  };

  return (
    <div className="flex flex-col gap-3 px-6 py-3.5 border-b border-hairline bg-panel/80 backdrop-blur-xl shrink-0 select-none">
      {/* ROW 1: Search + Saved Views + View Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap lg:flex-nowrap">
        {/* Large Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-fg-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search candidates, skills, titles, or notes... (Press '/' to focus)"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-8 py-2 text-xs text-fg placeholder:text-fg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-xs"
          />
          {searchInput ? (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-2.5 text-fg-muted hover:text-fg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Kbd className="absolute right-2.5 top-2 pointer-events-none">/</Kbd>
          )}
        </div>

        {/* Saved View Tabs */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg text-xs font-mono">
          <button
            onClick={() => handleSavedView("all")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5",
              isAll
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-white/[0.03]"
            )}
          >
            <span>All</span>
            <span className="opacity-70 text-[10px]">({totals?.all ?? 32})</span>
          </button>

          <button
            onClick={() => handleSavedView("needs-action")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5",
              isNeedsAction
                ? "bg-rose-500 text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-white/[0.03]"
            )}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Needs Action</span>
            {facets?.slaBreached ? (
              <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-300">
                {facets.slaBreached}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => handleSavedView("high-potential")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5",
              isHighPotential
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-white/[0.03]"
            )}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>High Potential ≥85</span>
          </button>

          <button
            onClick={() => handleSavedView("offer-stage")}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5",
              isOfferStage
                ? "bg-amber-500 text-white font-semibold shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-white/[0.03]"
            )}
          >
            <span>Offer Stage</span>
            <span className="opacity-70 text-[10px]">
              ({facets?.stages?.OFFER ?? 3})
            </span>
          </button>
        </div>

        {/* View Switcher Controls (Kanban, Grid, Split) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg shadow-xs">
            {[
              { id: "kanban", label: "Kanban", icon: <Kanban className="w-3.5 h-3.5" />, key: "1" },
              { id: "grid", label: "Grid", icon: <TableIcon className="w-3.5 h-3.5" />, key: "2" },
              { id: "split", label: "Split", icon: <Columns className="w-3.5 h-3.5" />, key: "3" },
            ].map((v) => {
              const isActive = filters.view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => updateFilters({ view: v.id as PipelineViewMode })}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    isActive
                      ? "bg-panel text-fg font-semibold shadow-xs border border-white/10"
                      : "text-fg-muted hover:text-fg hover:bg-white/[0.03]"
                  )}
                  title={`Switch to ${v.label} view (${v.key})`}
                >
                  {v.icon}
                  <span>{v.label}</span>
                  <Kbd className="text-[10px] ml-0.5">{v.key}</Kbd>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: Filters Popover Button + Dismissible Filter Chips + Total Count */}
      <div className="flex items-center justify-between gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-2 flex-wrap relative" ref={popoverRef}>
          {/* Main "Filters" Popover Button */}
          <button
            onClick={() => setShowFiltersPopover(!showFiltersPopover)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-all shadow-xs",
              hasActiveFilters
                ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                : "bg-white/[0.03] border-white/[0.06] text-fg hover:border-white/15"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}
            <ChevronDown className="w-3 h-3 text-fg-muted ml-0.5" />
          </button>

          {/* Filters Comprehensive Popover */}
          {showFiltersPopover && (
            <div className="absolute top-full mt-2 left-0 w-80 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
                <span className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                  Facet Filters
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-primary hover:underline lowercase font-normal"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Stage Facets with Live Counts */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-fg-muted">Stages</span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STAGES.map((st) => {
                    const isSelected = filters.stages.includes(st);
                    const count = facets?.stages?.[st] ?? 0;
                    const theme = STAGE_THEME[st];
                    return (
                      <button
                        key={st}
                        onClick={() => handleToggleStage(st)}
                        className={clsx(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition-all",
                          isSelected
                            ? "bg-white/10 border-white/30 text-fg font-semibold"
                            : "bg-white/[0.02] border-white/[0.05] text-fg-muted hover:text-fg hover:bg-white/[0.05]"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: theme?.color || "#6366F1" }}
                        />
                        <span>{theme?.label || st}</span>
                        <span className="opacity-60 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Score Filter Slider */}
              <div className="flex flex-col gap-1.5 border-t border-hairline/40 pt-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-fg-muted">Minimum Match Score</span>
                  <span className="font-mono text-fg font-bold">
                    {filters.minScore !== null ? `≥ ${filters.minScore}%` : "Any"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filters.minScore ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateFilters({ minScore: val > 0 ? val : null });
                  }}
                  className="w-full accent-primary"
                />
              </div>

              {/* Departments */}
              {facets?.departments && Object.keys(facets.departments).length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-hairline/40 pt-2.5">
                  <span className="text-[11px] font-semibold text-fg-muted">Departments</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(facets.departments).map(([dept, count]: [string, any]) => {
                      const isSelected = filters.departments.includes(dept);
                      return (
                        <button
                          key={dept}
                          onClick={() => handleToggleDepartment(dept)}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] border transition-all",
                            isSelected
                              ? "bg-primary/20 border-primary text-primary font-semibold"
                              : "bg-white/[0.02] border-white/[0.05] text-fg-muted hover:text-fg"
                          )}
                        >
                          {dept} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Acquisition Sources */}
              {facets?.sources && Object.keys(facets.sources).length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-hairline/40 pt-2.5">
                  <span className="text-[11px] font-semibold text-fg-muted">Acquisition Source</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(facets.sources).map(([src, count]: [string, any]) => {
                      const isSelected = filters.sources.includes(src);
                      return (
                        <button
                          key={src}
                          onClick={() => handleToggleSource(src)}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] border transition-all",
                            isSelected
                              ? "bg-primary/20 border-primary text-primary font-semibold"
                              : "bg-white/[0.02] border-white/[0.05] text-fg-muted hover:text-fg"
                          )}
                        >
                          {src} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dismissible Active Filter Chips */}
          {filters.slaBreachedOnly && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <span>SLA Overdue</span>
              <button
                onClick={() => updateFilters({ slaBreachedOnly: false })}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.minScore !== null && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
              <span>Score ≥{filters.minScore}%</span>
              <button
                onClick={() => updateFilters({ minScore: null })}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.stages.map((st) => (
            <span
              key={st}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-white/[0.04] text-fg border border-white/10"
            >
              <span>{STAGE_THEME[st as Stage]?.label || st}</span>
              <button
                onClick={() => handleToggleStage(st)}
                className="hover:text-white ml-0.5 text-fg-muted"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.departments.map((dept) => (
            <span
              key={dept}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-white/[0.04] text-fg border border-white/10"
            >
              <span>{dept}</span>
              <button
                onClick={() => handleToggleDepartment(dept)}
                className="hover:text-white ml-0.5 text-fg-muted"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-fg-muted hover:text-fg underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Animated Showing X of Y count */}
        <div className="text-fg-muted text-xs font-mono shrink-0">
          Showing <strong className="text-fg font-semibold"><Mono>{totals?.filtered ?? 0}</Mono></strong> of{" "}
          <span><Mono>{totals?.all ?? 0}</Mono></span> candidates
        </div>
      </div>
    </div>
  );
}
