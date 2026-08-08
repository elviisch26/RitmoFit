import { create } from 'zustand';

type RoutinesUiState = {
  searchPhrase: string;
  expandedRoutineId: number | null;
  setSearchPhrase: (phrase: string) => void;
  setExpandedRoutineId: (id: number | null) => void;
};

export const useRoutinesUiStore = create<RoutinesUiState>((set) => ({
  searchPhrase: '',
  expandedRoutineId: null,
  setSearchPhrase: (searchPhrase) => set({ searchPhrase }),
  setExpandedRoutineId: (expandedRoutineId) => set({ expandedRoutineId }),
}));