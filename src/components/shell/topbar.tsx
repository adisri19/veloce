"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Bell,
  MoreVertical,
  RotateCcw,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { UserSwitcher } from "./user-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { Mono } from "../ui/mono";
import { useDashboard } from "@/hooks/use-dashboard";

export function Topbar() {
  const pathname = usePathname();
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const setNewCandidateModalOpen = useUiStore((s) => s.setNewCandidateModalOpen);
  const setResetDbModalOpen = useUiStore((s) => s.setResetDbModalOpen);
  const setShortcutHelpModalOpen = useUiStore((s) => s.setShortcutHelpModalOpen);
  const setTourOpen = useUiStore((s) => s.setTourOpen);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);

  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);

  const overflowRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications data from dashboard
  const { data: dashboardData } = useDashboard();
  const needsAttention = dashboardData?.needsAttention || [];
  const slaBreachesCount = dashboardData?.kpis.activeSlaBreaches.total || 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumb label
  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard Overview";
    if (pathname.startsWith("/pipeline")) return "Pipeline Triage";
    if (pathname.startsWith("/jobs")) return "Job Requisitions";
    if (pathname.startsWith("/compare")) return "Candidate Calibration Matrix";
    return "Veloce ATS";
  };

  return (
    <header className="h-14 border-b border-hairline bg-panel/80 backdrop-blur-md flex items-center justify-between px-5 shrink-0 z-20 select-none">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="text-xs font-bold text-fg tracking-tight">
          {getPageTitle()}
        </span>
      </div>

      {/* Center: Wide ⌘K Search Pill */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={toggleCommandPalette}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-lg border border-hairline bg-canvas/70 hover:bg-hairline/50 hover:border-fg-muted/30 transition-all text-fg-muted text-xs text-left shadow-xs group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-fg-muted group-hover:text-primary transition-colors shrink-0" />
            <span className="truncate">Search candidates, jobs, commands...</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Kbd>⌘K</Kbd>
            <span className="text-[10px] text-fg-muted/60">or</span>
            <Kbd>/</Kbd>
          </div>
        </button>
      </div>

      {/* Right Cluster */}
      <div className="flex items-center gap-2.5">
        {/* Notification Bell Popover */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setIsBellOpen(!isBellOpen)}
            className="relative p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-hairline/40 transition-colors focus-visible:outline-none"
            title="Notifications (SLA breaches & scorecards owed)"
          >
            <Bell className="w-4 h-4" />
            {needsAttention.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {isBellOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl glass-panel p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline">
                <span className="text-xs font-bold text-fg">Needs Attention</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-bold">
                  <Mono>{needsAttention.length}</Mono> pending
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {needsAttention.length === 0 ? (
                  <p className="text-xs text-fg-muted py-4 text-center">
                    All clear! Zero overdue reviews or breached SLAs.
                  </p>
                ) : (
                  needsAttention.slice(0, 5).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveDossierId(item.applicationId);
                        setIsBellOpen(false);
                      }}
                      className="p-2 rounded-lg bg-hairline/30 hover:bg-hairline/60 text-left transition-colors flex flex-col gap-0.5 focus-visible:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-fg truncate">
                          {item.candidateName}
                        </span>
                        <span className="text-[10px] text-rose-400 font-mono font-bold">
                          +{item.overByDays}d SLA
                        </span>
                      </div>
                      <span className="text-[11px] text-fg-muted truncate">
                        {item.jobTitle} • {item.stage.replace(/_/g, " ")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Switcher */}
        <UserSwitcher />

        {/* The ONLY primary gradient button: New Candidate */}
        <button
          onClick={() => setNewCandidateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 focus-visible:outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Candidate</span>
        </button>

        {/* Overflow Menu */}
        <div className="relative" ref={overflowRef}>
          <button
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-hairline/40 transition-colors focus-visible:outline-none"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isOverflowOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl glass-panel p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setIsOverflowOpen(false);
                  setTourOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg hover:bg-hairline/50 transition-colors text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive Tour</span>
              </button>
              <button
                onClick={() => {
                  setIsOverflowOpen(false);
                  setShortcutHelpModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg hover:bg-hairline/50 transition-colors text-left"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Keyboard Shortcuts (?)</span>
              </button>
              <div className="h-px bg-hairline my-1" />
              <button
                onClick={() => {
                  setIsOverflowOpen(false);
                  setResetDbModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-danger" />
                <span>Reset Demo Database</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
