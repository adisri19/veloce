import { create } from "zustand";

interface SelectionState {
  selectedIds: string[];
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectRange: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  select: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id],
    })),
  deselect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((item) => item !== id),
    })),
  toggle: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((item) => item !== id)
        : [...state.selectedIds, id],
    })),
  selectRange: (ids) =>
    set((state) => {
      const merged = new Set([...state.selectedIds, ...ids]);
      return { selectedIds: Array.from(merged) };
    }),
  selectAll: (ids) => set({ selectedIds: ids }),
  clear: () => set({ selectedIds: [] }),
}));
