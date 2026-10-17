import { create } from "zustand";

interface CandidateMini {
  id: string; // application id
  candidateId: string;
  name: string;
  avatarUrl: string | null;
  code: string;
}

interface CompareState {
  candidates: CandidateMini[];
  addCandidate: (candidate: CandidateMini) => boolean;
  removeCandidate: (applicationId: string) => void;
  clear: () => void;
  isCompareTrayOpen: boolean;
  setCompareTrayOpen: (open: boolean) => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  candidates: [],
  isCompareTrayOpen: false,
  setCompareTrayOpen: (open) => set({ isCompareTrayOpen: open }),

  addCandidate: (candidate) => {
    const current = get().candidates;
    if (current.some((c) => c.id === candidate.id)) {
      return true;
    }
    if (current.length >= 4) {
      return false; // Max 4 candidates
    }
    set({
      candidates: [...current, candidate],
      isCompareTrayOpen: true,
    });
    return true;
  },

  removeCandidate: (applicationId) =>
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== applicationId),
    })),

  clear: () => set({ candidates: [], isCompareTrayOpen: false }),
}));
