import { create } from 'zustand';

type WorkoutUiState = {
  expandedExerciseId: number | null;
  expandedHistoryId: number | null;
  addSetExerciseId: number | null;
  setExpandedExerciseId: (id: number | null) => void;
  setExpandedHistoryId: (id: number | null) => void;
  setAddSetExerciseId: (id: number | null) => void;
};

export const useWorkoutUiStore = create<WorkoutUiState>((set) => ({
  expandedExerciseId: null,
  expandedHistoryId: null,
  addSetExerciseId: null,
  setExpandedExerciseId: (expandedExerciseId) => set({ expandedExerciseId }),
  setExpandedHistoryId: (expandedHistoryId) => set({ expandedHistoryId }),
  setAddSetExerciseId: (addSetExerciseId) => set({ addSetExerciseId }),
}));