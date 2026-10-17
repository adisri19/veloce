import { create } from "zustand";

export type PipelineViewMode = "kanban" | "grid" | "split";

interface UiState {
  // Command palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Active dossier drawer
  activeDossierId: string | null;
  setActiveDossierId: (id: string | null) => void;
  activeDossierTab: "overview" | "scorecards" | "notes" | "interviews" | "timeline";
  setActiveDossierTab: (tab: "overview" | "scorecards" | "notes" | "interviews" | "timeline") => void;

  // Modals
  isNewCandidateModalOpen: boolean;
  setNewCandidateModalOpen: (open: boolean) => void;
  isResetDbModalOpen: boolean;
  setResetDbModalOpen: (open: boolean) => void;
  isShortcutHelpModalOpen: boolean;
  setShortcutHelpModalOpen: (open: boolean) => void;

  // Rejection modal
  rejectionModalAppId: string | null;
  setRejectionModalAppId: (id: string | null) => void;

  // Split view triage keyboard navigation
  focusedAppIndex: number;
  setFocusedAppIndex: (index: number) => void;

  // Pipeline view
  viewMode: PipelineViewMode;
  setViewMode: (view: PipelineViewMode) => void;

  // Active Actor override
  activeActorId: string;
  setActiveActorId: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  activeDossierId: null,
  setActiveDossierId: (id) => set({ activeDossierId: id }),
  activeDossierTab: "overview",
  setActiveDossierTab: (tab) => set({ activeDossierTab: tab }),

  isNewCandidateModalOpen: false,
  setNewCandidateModalOpen: (open) => set({ isNewCandidateModalOpen: open }),
  isResetDbModalOpen: false,
  setResetDbModalOpen: (open) => set({ isResetDbModalOpen: open }),
  isShortcutHelpModalOpen: false,
  setShortcutHelpModalOpen: (open) => set({ isShortcutHelpModalOpen: open }),

  rejectionModalAppId: null,
  setRejectionModalAppId: (id) => set({ rejectionModalAppId: id }),

  focusedAppIndex: 0,
  setFocusedAppIndex: (index) => set({ focusedAppIndex: index }),

  viewMode: "kanban",
  setViewMode: (viewMode) => set({ viewMode }),

  activeActorId: "usr_elena_sokolova", // Elena Sokolova default
  setActiveActorId: (id) => set({ activeActorId: id }),
}));
