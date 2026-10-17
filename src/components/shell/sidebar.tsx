"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Briefcase,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { useCompareStore } from "@/stores/compare-store";

export function Sidebar() {
  const pathname = usePathname();
  const compareCount = useCompareStore((s) => s.candidates.length);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Pipeline",
      href: "/pipeline",
      icon: <Kanban className="w-4 h-4" />,
    },
    {
      label: "Jobs",
      href: "/jobs",
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      label: "Compare",
      href: "/compare",
      icon: <Scale className="w-4 h-4" />,
      badge: compareCount > 0 ? compareCount : undefined,
    },
  ];

  return (
    <aside className="w-56 border-r border-hairline bg-panel flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 border-b border-hairline gap-2.5">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white font-black tracking-tighter text-sm shadow-md">
          <Zap className="w-4 h-4 fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-fg flex items-center gap-1.5">
            VELOCE
            <span className="text-[10px] uppercase font-mono font-bold px-1 py-0.2 rounded bg-primary-muted text-primary">
              ATS
            </span>
          </span>
          <span className="text-[10px] text-fg-muted font-mono tracking-tight leading-none">
            Enterprise v1.0
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <div className="px-2 mb-2 text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary-muted text-primary font-semibold"
                  : "text-fg-muted hover:text-fg hover:bg-hairline/40"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={clsx(isActive ? "text-primary" : "text-fg-muted")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status strip */}
      <div className="p-3 border-t border-hairline flex flex-col gap-2">
        <div className="p-2.5 rounded-md bg-hairline/20 border border-hairline/50 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Scoring Engine</span>
          </div>
          <p className="text-[11px] text-fg-muted leading-tight">
            Deterministic weighted matching with alias normalization.
          </p>
        </div>
      </div>
    </aside>
  );
}
