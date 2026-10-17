"use client";

import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, User, Briefcase, Sparkles, RotateCcw, Plus, Moon, HelpCircle } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { Avatar } from "../ui/avatar";
import { ScoreBadge } from "../ui/score-badge";
import { StagePill } from "../ui/stage-pill";
import { Stage } from "@/lib/validations/common";
import { Mono } from "../ui/mono";

export function CommandPalette() {
  const router = useRouter();
  const isOpen = useUiStore((s) => s.isCommandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setActiveDossierId = useUiStore((s) => s.setActiveDossierId);
  const setNewCandidateModalOpen = useUiStore((s) => s.setNewCandidateModalOpen);
  const setResetDbModalOpen = useUiStore((s) => s.setResetDbModalOpen);
  const setShortcutHelpModalOpen = useUiStore((s) => s.setShortcutHelpModalOpen);

  const [query, setQuery] = useState("");
  const [data, setData] = useState<{
    candidates: any[];
    jobs: any[];
    commands: any[];
  }>({
    candidates: [],
    jobs: [],
    commands: [],
  });

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search/global?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch {
        // Ignore search errors
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-xl bg-panel border border-hairline rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col">
        <Command className="w-full flex flex-col">
          <div className="flex items-center px-4 border-b border-hairline h-12">
            <Search className="w-4 h-4 text-fg-muted shrink-0 mr-3" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search candidates, requisitions, or commands..."
              className="w-full bg-transparent text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-fg-muted">
              No results found for &quot;{query}&quot;.
            </Command.Empty>

            {/* Candidates */}
            {data.candidates.length > 0 && (
              <Command.Group heading="Candidates" className="px-2 py-1 text-[10px] font-semibold text-fg-muted uppercase tracking-wider">
                {data.candidates.map((c) => (
                  <Command.Item
                    key={c.id}
                    onSelect={() => {
                      if (c.applicationId) {
                        setActiveDossierId(c.applicationId);
                      }
                      setOpen(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-hairline/40 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.fullName} src={c.avatarUrl} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-fg">{c.fullName}</span>
                        <span className="text-[11px] text-fg-muted">
                          {c.currentTitle} • <Mono>{c.publicCode}</Mono>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.stage && <StagePill stage={c.stage as Stage} size="sm" />}
                      {c.aiMatchScore !== null && <ScoreBadge score={c.aiMatchScore} size="sm" />}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Jobs */}
            {data.jobs.length > 0 && (
              <Command.Group heading="Job Requisitions" className="px-2 py-1 text-[10px] font-semibold text-fg-muted uppercase tracking-wider mt-2">
                {data.jobs.map((j) => (
                  <Command.Item
                    key={j.id}
                    onSelect={() => {
                      router.push(`/jobs`);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-hairline/40 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-fg">{j.title}</span>
                        <span className="text-[11px] text-fg-muted">
                          <Mono>{j.code}</Mono> • {j.department}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-hairline/50 text-fg-muted">
                      {j.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Commands */}
            {data.commands.length > 0 && (
              <Command.Group heading="Quick Actions" className="px-2 py-1 text-[10px] font-semibold text-fg-muted uppercase tracking-wider mt-2">
                {data.commands.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    onSelect={() => {
                      setOpen(false);
                      if (cmd.action.startsWith("/")) {
                        router.push(cmd.action);
                      } else if (cmd.action === "MODAL_NEW_CANDIDATE") {
                        setNewCandidateModalOpen(true);
                      } else if (cmd.action === "MODAL_RESET_DB") {
                        setResetDbModalOpen(true);
                      } else if (cmd.action === "ACTION_TOGGLE_THEME") {
                        document.documentElement.classList.toggle("dark");
                      }
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-hairline/40 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      {cmd.id.includes("reset") ? (
                        <RotateCcw className="w-4 h-4 text-danger" />
                      ) : cmd.id.includes("candidate") ? (
                        <Plus className="w-4 h-4 text-primary" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-fg">{cmd.title}</span>
                        <span className="text-[11px] text-fg-muted">{cmd.subtitle}</span>
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className="font-mono text-[10px] text-fg-muted font-bold px-1.5 py-0.5 bg-hairline/40 rounded">
                        {cmd.shortcut}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2 border-t border-hairline flex items-center justify-between text-[11px] text-fg-muted bg-canvas">
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
              className="hover:text-fg flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Keyboard Cheatsheet</span>
            </button>
          </div>
        </Command>
      </div>
    </div>
  );
}
