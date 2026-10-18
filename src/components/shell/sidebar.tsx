"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Briefcase,
  Scale,
  Sparkles,
  Zap,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useUiStore } from "@/stores/ui-store";
import { useCompareStore } from "@/stores/compare-store";
import { useApplications } from "@/hooks/use-applications";
import { useJobs } from "@/hooks/use-jobs";
import { GlassTooltip } from "../ui/glass-tooltip";
import { Mono } from "../ui/mono";

export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = useUiStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const recentDossiers = useUiStore((s) => s.recentDossiers);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const compareCount = useCompareStore((s) => s.candidates.length);

  // Live badges data
  const { data: appData } = useApplications({ limit: 1 });
  const { data: jobs = [] } = useJobs({ status: "OPEN" });

  const activeAppsCount = appData?.meta?.totals?.all ?? 32;
  const hasBreaches = (appData?.meta?.facets?.slaBreached ?? 0) > 0;
  const openJobsCount = jobs.length || 4;

  // Listen for ⌘B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Pipeline",
      href: "/pipeline",
      icon: <Kanban className="w-4 h-4 shrink-0" />,
      badge: activeAppsCount,
      hasBreachDot: hasBreaches,
    },
    {
      label: "Jobs",
      href: "/jobs",
      icon: <Briefcase className="w-4 h-4 shrink-0" />,
      badge: openJobsCount,
    },
    {
      label: "Compare",
      href: "/compare",
      icon: <Scale className="w-4 h-4 shrink-0" />,
      badge: compareCount > 0 ? compareCount : undefined,
    },
  ];

  return (
    <aside
      className={clsx(
        "border-r border-hairline bg-panel flex flex-col shrink-0 select-none transition-all duration-200 z-30",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-hairline">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden group focus-visible:ring-1 focus-visible:ring-primary rounded-md p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-fg flex items-center gap-1.5">
                VELOCE
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-primary-muted text-primary">
                  ATS
                </span>
              </span>
              <span className="text-[10px] text-fg-muted font-mono tracking-tight leading-none">
                Enterprise v1.0
              </span>
            </div>
          )}
        </Link>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded text-fg-muted hover:text-fg hover:bg-hairline/40 transition-colors focus-visible:outline-none"
            title="Collapse Sidebar (⌘B)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 mb-1.5 text-[10px] font-bold text-fg-muted uppercase tracking-[0.08em]">
            Workspace
          </div>
        )}

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const navContent = (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex items-center rounded-lg text-xs font-medium transition-colors focus-visible:outline-none",
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2",
                isActive ? "text-primary font-semibold" : "text-fg-muted hover:text-fg hover:bg-hairline/40"
              )}
            >
              {/* Gliding active pill via layoutId */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className="absolute inset-0 bg-primary-muted dark:bg-primary/15 rounded-lg -z-10"
                />
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                <span className={clsx(isActive ? "text-primary" : "text-fg-muted")}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.hasBreachDot && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="SLA Breaches" />
                  )}
                  <span
                    className={clsx(
                      "font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                      isActive ? "bg-primary text-white" : "bg-hairline text-fg-muted"
                    )}
                  >
                    <Mono>{item.badge}</Mono>
                  </span>
                </div>
              )}

              {isCollapsed && item.hasBreachDot && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>
          );

          return isCollapsed ? (
            <GlassTooltip key={item.href} content={item.label} position="right">
              {navContent}
            </GlassTooltip>
          ) : (
            navContent
          );
        })}

        {/* Recent Dossiers */}
        {!isCollapsed && recentDossiers.length > 0 && (
          <div className="mt-5 flex flex-col gap-1 border-t border-hairline/60 pt-3">
            <div className="px-2 mb-1 text-[10px] font-bold text-fg-muted uppercase tracking-[0.08em]">
              Recent Dossiers
            </div>
            {recentDossiers.map((rec) => (
              <button
                key={rec.name}
                onClick={() => {
                  if (rec.id) setActiveDossierId(rec.id);
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] text-fg-muted hover:text-fg hover:bg-hairline/30 text-left transition-colors truncate group focus-visible:outline-none"
              >
                <span className="truncate group-hover:text-primary transition-colors">
                  {rec.name}
                </span>
                <span className="font-mono text-[10px] text-fg-muted/60">
                  <Mono>{rec.score}%</Mono>
                </span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Footer Strip */}
      <div className="p-2.5 border-t border-hairline flex flex-col gap-2">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-hairline/40 flex items-center justify-center transition-colors focus-visible:outline-none"
            title="Expand Sidebar (⌘B)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        ) : (
          /* AI Scoring Engine Card with animated gradient border */
          <div className="gradient-border">
            <div className="p-3 bg-panel flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>AI Scoring Engine</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-fg-muted leading-tight">
                Deterministic weighted matching across skills, experience, and domain keywords.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
