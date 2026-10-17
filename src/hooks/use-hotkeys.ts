"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

interface HotkeyOptions {
  onAdvance?: () => void;
  onReject?: () => void;
  onOpenScorecard?: () => void;
  onOpenNote?: () => void;
  onCompare?: () => void;
  onArchive?: () => void;
  onNextItem?: () => void;
  onPrevItem?: () => void;
  onSelectCurrent?: () => void;
}

export function useHotkeys(options: HotkeyOptions = {}) {
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const setShortcutHelpModalOpen = useUiStore((s) => s.setShortcutHelpModalOpen);
  const setViewMode = useUiStore((s) => s.setViewMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      // ⌘K / Ctrl+K (works everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // If typing in input, ignore single key shortcuts
      if (isInput) {
        return;
      }

      // Single key shortcuts
      switch (e.key) {
        case "/":
          e.preventDefault();
          toggleCommandPalette();
          break;

        case "?":
          e.preventDefault();
          setShortcutHelpModalOpen(true);
          break;

        case "1":
          setViewMode("kanban");
          break;
        case "2":
          setViewMode("grid");
          break;
        case "3":
          setViewMode("split");
          break;

        case "j":
        case "ArrowDown":
          e.preventDefault();
          options.onNextItem?.();
          break;

        case "k":
        case "ArrowUp":
          e.preventDefault();
          options.onPrevItem?.();
          break;

        case "Enter":
          options.onSelectCurrent?.();
          break;

        case "a":
        case "A":
          options.onAdvance?.();
          break;

        case "r":
        case "R":
          options.onReject?.();
          break;

        case "s":
        case "S":
          options.onOpenScorecard?.();
          break;

        case "n":
        case "N":
          options.onOpenNote?.();
          break;

        case "c":
        case "C":
          options.onCompare?.();
          break;

        case "e":
        case "E":
          options.onArchive?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, setShortcutHelpModalOpen, setViewMode, options]);
}
