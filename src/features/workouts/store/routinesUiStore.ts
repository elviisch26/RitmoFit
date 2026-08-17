import { create } from 'zustand';

import type { Goal } from '@/database/schema';

type RoutinesUiState = {
  searchPhrase: string;
  expandedRoutineId: number | null;
  goalFilter: 'all' | Goal;
  setSearchPhrase: (phrase: string) => void;
  setExpandedRoutineId: (id: number | null) => void;
  setGoalFilter: (goal: 'all' | Goal) => void;
};

export const useRoutinesUiStore = create<RoutinesUiState>((set) => ({
  searchPhrase: '',
  expandedRoutineId: null,
  goalFilter: 'all',
  setSearchPhrase: (searchPhrase) => set({ searchPhrase }),
  setExpandedRoutineId: (expandedRoutineId) => set({ expandedRoutineId }),
  setGoalFilter: (goalFilter) => set({ goalFilter }),
}));
