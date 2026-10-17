"use client";

import React from "react";
import { Modal } from "../ui/modal";
import { Kbd } from "../ui/kbd";
import { useUiStore } from "@/stores/ui-store";

export function ShortcutHelpModal() {
  const isOpen = useUiStore((s) => s.isShortcutHelpModalOpen);
  const onClose = () => useUiStore.getState().setShortcutHelpModalOpen(false);

  const shortcuts = [
    { key: "⌘K", desc: "Open global command palette" },
    { key: "/", desc: "Focus search / command palette" },
    { key: "1", desc: "Switch to Kanban view" },
    { key: "2", desc: "Switch to High-Density Grid view" },
    { key: "3", desc: "Switch to Split Triage view" },
    { key: "J / ↓", desc: "Select next candidate in Split view" },
    { key: "K / ↑", desc: "Select previous candidate in Split view" },
    { key: "Enter", desc: "Focus candidate dossier drawer" },
    { key: "A", desc: "Advance candidate to next stage" },
    { key: "R", desc: "Reject candidate with reason" },
    { key: "S", desc: "Open scorecard submission tab" },
    { key: "N", desc: "Focus collaborative note composer" },
    { key: "C", desc: "Add to candidate comparison basket" },
    { key: "E", desc: "Archive candidate" },
    { key: "Esc", desc: "Close drawer or active modal" },
    { key: "?", desc: "Open this keyboard shortcuts guide" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-lg">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 py-1">
        {shortcuts.map((sc) => (
          <div key={sc.key} className="flex items-center justify-between text-xs py-1 border-b border-hairline/40">
            <span className="text-fg-muted">{sc.desc}</span>
            <Kbd>{sc.key}</Kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
