import { useProgressGlobalState } from '../store/useProgressGlobalState';

describe('useProgressGlobalState (PROG-2: picker selection)', () => {
  beforeEach(() => {
    useProgressGlobalState.setState({ selectedExerciseId: null });
  });

  it('starts with no selection (fresh install, no sessions)', () => {
    expect(useProgressGlobalState.getState().selectedExerciseId).toBeNull();
  });

  it('stores and clears the selected exercise id (triangulated)', () => {
    useProgressGlobalState.getState().setSelectedExerciseId(7);
    expect(useProgressGlobalState.getState().selectedExerciseId).toBe(7);

    useProgressGlobalState.getState().setSelectedExerciseId(2);
    expect(useProgressGlobalState.getState().selectedExerciseId).toBe(2);

    useProgressGlobalState.getState().setSelectedExerciseId(null);
    expect(useProgressGlobalState.getState().selectedExerciseId).toBeNull();
  });
});