"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { DossierDrawer } from "../dossier/dossier-drawer";
import { CommandPalette } from "../command/command-palette";
import { NewCandidateModal } from "../command/new-candidate-modal";
import { ResetDialog } from "../command/reset-dialog";
import { ShortcutHelpModal } from "../command/shortcut-help-modal";
import { DemoTourModal } from "./demo-tour-modal";
import { CompareTray } from "../compare/compare-tray";
import { RejectionModal } from "../pipeline/rejection-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas relative">
      {/* Fixed Aurora Ambient Glow Backdrop (GPU transforms, 60s slow drift) */}
      <div className="aurora-bg">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
      </div>
      <div className="aurora-noise" />

      {/* App Structure */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
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
      <DemoTourModal />
      <CompareTray />
      <RejectionModal />
    </div>
  );
}
