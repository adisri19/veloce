"use client";

import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Briefcase,
  Sparkles,
  RotateCcw,
  Plus,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  LayoutGrid,
  SunMoon,
  Users,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { Avatar } from "../ui/avatar";
import { ScoreRing } from "../ui/score-ring";
import { StagePill } from "../ui/stage-pill";
import { Stage } from "@/lib/validations/common";
import { Mono } from "../ui/mono";

export function CommandPalette() {
  const router = useRouter();
  const isOpen = useUiStore((s) => s.isCommandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const setNewCandidateModalOpen = useUiStore((s) => s.setNewCandidateModalOpen);
  const setResetDbModalOpen = useUiStore((s) => s.setResetDbModalOpen);
  const setShortcutHelpModalOpen = useUiStore((s) => s.setShortcutHelpModalOpen);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const setTourOpen = useUiStore((s) => s.setTourOpen);

  const [query, setQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [data, setData] = useState<{
    candidates: any[];
    jobs: any[];
    commands: any[];
  }>({
    candidates: [],
    jobs: [],
    commands: [],
  });

  // Listen for '/' key outside inputs to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCandidate(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search/global?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
          if (json.data.candidates.length > 0 && !selectedCandidate) {
            setSelectedCandidate(json.data.candidates[0]);
          }
        }
      } catch {
        // Ignore search errors
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-[640px] glass-panel rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col border border-white/10 dark:border-white/10">
        <Command className="w-full flex flex-col">
          {/* Search Header */}
          <div className="flex items-center px-4 border-b border-hairline h-13">
            <Search className="w-4 h-4 text-primary shrink-0 mr-3" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Type a command or search candidates, jobs..."
              className="w-full bg-transparent text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[10px] text-fg-muted font-mono hover:text-fg px-1.5 py-0.5 rounded bg-hairline/40"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex divide-x divide-hairline">
            {/* Left Result list */}
            <Command.List className="flex-1 max-h-[380px] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-xs text-fg-muted">
                No results found for &quot;{query}&quot;.
              </Command.Empty>

              {/* Quick Actions & Navigation */}
              <Command.Group
                heading="Actions & Navigation"
                className="px-2 py-1 text-[10px] font-bold text-fg-muted uppercase tracking-[0.08em]"
              >
                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    setNewCandidateModalOpen(true);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-fg">New Candidate & Resume Parse</span>
                  </div>
                  <Mono className="text-[10px] text-fg-muted font-bold px-1.5 py-0.5 bg-hairline/40 rounded">
                    N
                  </Mono>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    router.push("/pipeline");
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-fg">Go to Pipeline Kanban</span>
                  </div>
                  <Mono className="text-[10px] text-fg-muted font-bold px-1.5 py-0.5 bg-hairline/40 rounded">
                    G P
                  </Mono>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    router.push("/compare");
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-fg">Candidate Comparison Matrix</span>
                  </div>
                  <Mono className="text-[10px] text-fg-muted font-bold px-1.5 py-0.5 bg-hairline/40 rounded">
                    G C
                  </Mono>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    document.documentElement.classList.toggle("dark");
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <SunMoon className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-fg">Toggle Light / Dark Theme</span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    setTourOpen(true);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-fg">Interactive Spotlight Tour</span>
                  </div>
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    setResetDbModalOpen(true);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-danger/10 text-danger cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-danger" />
                    <span className="font-semibold text-danger">Reset Demo Database (Seed)</span>
                  </div>
                  <Mono className="text-[10px] text-danger font-bold px-1.5 py-0.5 bg-danger/10 rounded">
                    RESET
                  </Mono>
                </Command.Item>
              </Command.Group>

              {/* Candidates */}
              {data.candidates.length > 0 && (
                <Command.Group
                  heading="Candidates"
                  className="px-2 py-1 text-[10px] font-bold text-fg-muted uppercase tracking-[0.08em] mt-2"
                >
                  {data.candidates.map((c) => (
                    <Command.Item
                      key={c.id}
                      onSelect={() => {
                        if (c.applicationId) {
                          setActiveDossierId(c.applicationId);
                        }
                        setOpen(false);
                      }}
                      onMouseEnter={() => setSelectedCandidate(c)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={c.fullName} src={c.avatarUrl} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-fg truncate">{c.fullName}</span>
                          <span className="text-[10px] text-fg-muted truncate">
                            {c.currentTitle} • <Mono>{c.publicCode}</Mono>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.stage && <StagePill stage={c.stage as Stage} size="xs" />}
                        {c.aiMatchScore !== null && (
                          <ScoreRing score={c.aiMatchScore} size="xs" />
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Jobs */}
              {data.jobs.length > 0 && (
                <Command.Group
                  heading="Job Requisitions"
                  className="px-2 py-1 text-[10px] font-bold text-fg-muted uppercase tracking-[0.08em] mt-2"
                >
                  {data.jobs.map((j) => (
                    <Command.Item
                      key={j.id}
                      onSelect={() => {
                        router.push(`/jobs`);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-hairline/50 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-bold text-fg">{j.title}</span>
                          <span className="text-[10px] text-fg-muted font-mono">
                            <Mono>{j.code}</Mono> • {j.department}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-hairline text-fg-muted">
                        {j.status}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Right Mini-Dossier Preview */}
            {selectedCandidate && (
              <div className="w-56 p-3 hidden sm:flex flex-col gap-2.5 bg-canvas/40 text-xs">
                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">
                  Quick Preview
                </span>
                <div className="flex items-center gap-2.5">
                  <Avatar name={selectedCandidate.fullName} src={selectedCandidate.avatarUrl} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-fg truncate">
                      {selectedCandidate.fullName}
                    </span>
                    <Mono className="text-[10px] text-fg-muted">
                      {selectedCandidate.publicCode}
                    </Mono>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-hairline/50">
                  <span className="text-fg-muted text-[11px]">AI Match:</span>
                  {selectedCandidate.aiMatchScore !== null && (
                    <ScoreRing score={selectedCandidate.aiMatchScore} size="sm" />
                  )}
                </div>

                {selectedCandidate.stage && (
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted text-[11px]">Stage:</span>
                    <StagePill stage={selectedCandidate.stage as Stage} size="xs" />
                  </div>
                )}

                <div className="flex flex-col gap-1 pt-1 border-t border-hairline/50 text-[11px]">
                  <span className="text-fg-muted">Current Role:</span>
                  <span className="font-medium text-fg truncate">
                    {selectedCandidate.currentTitle || "Engineer"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (selectedCandidate.applicationId) {
                      setActiveDossierId(selectedCandidate.applicationId);
                    }
                    setOpen(false);
                  }}
                  className="mt-auto w-full py-1.5 rounded-lg bg-primary text-white font-bold text-xs hover:bg-primary-hover transition-colors"
                >
                  Open Dossier →
                </button>
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div className="px-4 py-2 border-t border-hairline flex items-center justify-between text-[11px] text-fg-muted bg-canvas/60">
            <div className="flex items-center gap-3">
              <span>Navigate <Mono className="px-1 py-0.5 bg-hairline rounded">↑↓</Mono></span>
              <span>Open <Mono className="px-1 py-0.5 bg-hairline rounded">↵</Mono></span>
              <span>Dismiss <Mono className="px-1 py-0.5 bg-hairline rounded">Esc</Mono></span>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setShortcutHelpModalOpen(true);
              }}
              className="hover:text-fg flex items-center gap-1 focus-visible:outline-none"
            >
              <HelpCircle className="w-3 h-3 text-fg-muted" />
              <span>Shortcuts (?)</span>
            </button>
          </div>
        </Command>
      </div>
    </div>
  );
}
