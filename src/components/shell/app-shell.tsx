"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { DossierDrawer } from "../dossier/dossier-drawer";
import { CommandPalette } from "../command/command-palette";
import { NewCandidateModal } from "../command/new-candidate-modal";
import { ResetDialog } from "../command/reset-dialog";
import { ShortcutHelpModal } from "../command/shortcut-help-modal";
import { CompareTray } from "../compare/compare-tray";
import { RejectionModal } from "../pipeline/rejection-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
          {children}
        </main>
      </div>

      {/* Global Overlays */}
      <DossierDrawer />
      <CommandPalette />
      <NewCandidateModal />
      <ResetDialog />
      <ShortcutHelpModal />
      <CompareTray />
      <RejectionModal />
    </div>
  );
}
