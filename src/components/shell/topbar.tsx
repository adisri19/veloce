"use client";

import React from "react";
import { Search, Plus, RotateCcw } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { UserSwitcher } from "./user-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

export function Topbar() {
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const setNewCandidateModalOpen = useUiStore((s) => s.setNewCandidateModalOpen);
  const setResetDbModalOpen = useUiStore((s) => s.setResetDbModalOpen);

  return (
    <header className="h-14 border-b border-hairline bg-panel flex items-center justify-between px-6 shrink-0 z-20">
      {/* Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-hairline bg-canvas hover:bg-hairline/40 transition-colors text-fg-muted text-xs min-w-[260px] text-left"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">Search candidates, jobs, commands...</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5 text-fg-muted" />}
          onClick={() => setResetDbModalOpen(true)}
          title="Reset database to seed state"
        >
          Reset Demo DB
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setNewCandidateModalOpen(true)}
        >
          New Candidate
        </Button>

        <div className="h-4 w-px bg-hairline mx-1" />

        <ThemeToggle />

        <UserSwitcher />
      </div>
    </header>
  );
}
