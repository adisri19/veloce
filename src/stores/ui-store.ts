import { create } from "zustand";

export type PipelineViewMode = "kanban" | "grid" | "split";

interface UiState {
  // Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Active dossier drawer
  activeDossierId: string | null;
  setActiveDossierId: (id: string | null) => void;
  activeDossierTab: "overview" | "scorecards" | "notes" | "interviews" | "timeline";
  setActiveDossierTab: (tab: "overview" | "scorecards" | "notes" | "interviews" | "timeline") => void;

  // Recent dossiers (up to 3)
  recentDossiers: { id: string; name: string; stage: string; score: number }[];
  addRecentDossier: (item: { id: string; name: string; stage: string; score: number }) => void;

  // Modals
  isNewCandidateModalOpen: boolean;
  setNewCandidateModalOpen: (open: boolean) => void;
  isResetDbModalOpen: boolean;
  setResetDbModalOpen: (open: boolean) => void;
  isShortcutHelpModalOpen: boolean;
  setShortcutHelpModalOpen: (open: boolean) => void;
  isTourOpen: boolean;
  setTourOpen: (open: boolean) => void;

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
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  activeDossierId: null,
  setActiveDossierId: (id) => set({ activeDossierId: id }),
  activeDossierTab: "overview",
  setActiveDossierTab: (tab) => set({ activeDossierTab: tab }),

  recentDossiers: [
    { id: "", name: "Alexei Volkov", stage: "SOURCED", score: 97 },
    { id: "", name: "Dr. Ethan Wright", stage: "TECHNICAL_INTERVIEW", score: 96 },
    { id: "", name: "Chloe Dubois", stage: "SCREENING", score: 96 },
  ],
  addRecentDossier: (item) =>
    set((state) => {
      const filtered = state.recentDossiers.filter((d) => d.name !== item.name);
      return { recentDossiers: [item, ...filtered].slice(0, 3) };
    }),

  isNewCandidateModalOpen: false,
  setNewCandidateModalOpen: (open) => set({ isNewCandidateModalOpen: open }),
  isResetDbModalOpen: false,
  setResetDbModalOpen: (open) => set({ isResetDbModalOpen: open }),
  isShortcutHelpModalOpen: false,
  setShortcutHelpModalOpen: (open) => set({ isShortcutHelpModalOpen: open }),
  isTourOpen: false,
  setTourOpen: (open) => set({ isTourOpen: open }),

  rejectionModalAppId: null,
  setRejectionModalAppId: (id) => set({ rejectionModalAppId: id }),

  focusedAppIndex: 0,
  setFocusedAppIndex: (index) => set({ focusedAppIndex: index }),

  viewMode: "kanban",
  setViewMode: (viewMode) => set({ viewMode }),

  activeActorId: "usr_elena_sokolova", // Elena Sokolova default
  setActiveActorId: (id) => set({ activeActorId: id }),
}));
