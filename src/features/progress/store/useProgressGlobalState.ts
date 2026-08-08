import { create } from 'zustand';

type ProgressGlobalState = {
  /** Picker selection; `null` means no exercise has sessions yet (empty global). */
  selectedExerciseId: number | null;
  setSelectedExerciseId: (id: number | null) => void;
};

/**
 * Minimal reactive cache for the Progress screen (S4): only the selected
 * exercise of the picker. The DB remains the source of truth; this state is
 * deliberately tiny (D2 — zustand only where a screen-local selection lives).
 */
export const useProgressGlobalState = create<ProgressGlobalState>((set) => ({
  selectedExerciseId: null,
  setSelectedExerciseId: (id) => set({ selectedExerciseId: id }),
}));