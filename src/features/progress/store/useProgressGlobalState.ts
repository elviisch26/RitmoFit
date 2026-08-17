import { create } from 'zustand';

type ProgressGlobalState = {
  /** Selección del picker; `null` significa que ningún ejercicio tiene sesiones todavía (global vacío). */
  selectedExerciseId: number | null;
  setSelectedExerciseId: (id: number | null) => void;
};

/**
 * Caché reactiva mínima para la pantalla de Progreso (S4): solo el ejercicio
 * seleccionado del picker. La DB sigue siendo la fuente de verdad; este estado
 * es deliberadamente pequeño (D2 — zustand solo donde vive una selección local
 * de pantalla).
 */
export const useProgressGlobalState = create<ProgressGlobalState>((set) => ({
  selectedExerciseId: null,
  setSelectedExerciseId: (id) => set({ selectedExerciseId: id }),
}));