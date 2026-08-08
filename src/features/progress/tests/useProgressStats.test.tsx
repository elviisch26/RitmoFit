import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { useProgressStats } from '../hooks/useProgressStats';
import {
  getExerciseLoadSeries,
  getProgressKpis,
  listExerciseOptions,
} from '../repository/progressRepository';
import { useProgressGlobalState } from '../store/useProgressGlobalState';

jest.mock('../repository/progressRepository', () => ({
  getProgressKpis: jest.fn(),
  listExerciseOptions: jest.fn(),
  getExerciseLoadSeries: jest.fn(),
}));

const focusCallbacks: (() => void | (() => void))[] = [];
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    focusCallbacks.push(callback);
  },
}));

const mockGetProgressKpis = jest.mocked(getProgressKpis);
const mockListExerciseOptions = jest.mocked(listExerciseOptions);
const mockGetExerciseLoadSeries = jest.mocked(getExerciseLoadSeries);

const kpis = { workouts: 3, sets: 13, minutes: 180 };
const freshKpis = { workouts: 4, sets: 16, minutes: 210 };
const exercises = [{ id: 2, name: 'Press de banca' }];

function withClient(queryClient: QueryClient) {
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useProgressStats (PROG-2 + S4 default selection)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks.length = 0;
    useProgressGlobalState.setState({ selectedExerciseId: null });
  });

  afterEach(() => {
    queryClient?.clear();
    cleanup();
  });

  it('fetches weekly KPIs with a fresh clock and exposes the exercise options', async () => {
    mockGetProgressKpis.mockResolvedValue(kpis);
    mockListExerciseOptions.mockResolvedValue(exercises);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = await renderHook(() => useProgressStats(), {
      wrapper: withClient(queryClient),
    });

    await waitFor(() => {
      expect(result.current.kpis).toEqual(kpis);
      expect(result.current.exercises).toEqual(exercises);
    });
    expect(mockGetProgressKpis.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(queryClient.getQueryData(['progress'])).toEqual(kpis);
  });

  it('defaults the picker to the first exercise and loads its series (S4/PROGRESS-3)', async () => {
    mockGetProgressKpis.mockResolvedValue(kpis);
    mockListExerciseOptions.mockResolvedValue(exercises);
    mockGetExerciseLoadSeries.mockResolvedValue([
      { date: '12/01', weightKg: 60 },
      { date: '14/01', weightKg: 65 },
    ]);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = await renderHook(() => useProgressStats(), {
      wrapper: withClient(queryClient),
    });

    await waitFor(() => expect(result.current.selectedExerciseId).toBe(2));
    await waitFor(() => expect(result.current.series).toHaveLength(2));
    expect(useProgressGlobalState.getState().selectedExerciseId).toBe(2);
    expect(mockGetExerciseLoadSeries).toHaveBeenCalledWith(2);
  });

  it('keeps the selection null when no exercise has sessions (empty global)', async () => {
    mockGetProgressKpis.mockResolvedValue(kpis);
    mockListExerciseOptions.mockResolvedValue([]);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = await renderHook(() => useProgressStats(), {
      wrapper: withClient(queryClient),
    });

    await waitFor(() => expect(result.current.exercises).toEqual([]));
    expect(result.current.selectedExerciseId).toBeNull();
    expect(mockGetExerciseLoadSeries).not.toHaveBeenCalled();
  });

  it('refetches on focus, refreshing the weekly KPIs (D3)', async () => {
    mockGetProgressKpis.mockResolvedValueOnce(kpis).mockResolvedValueOnce(freshKpis);
    mockListExerciseOptions.mockResolvedValue(exercises);
    mockGetExerciseLoadSeries.mockResolvedValue([]);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = await renderHook(() => useProgressStats(), {
      wrapper: withClient(queryClient),
    });

    await waitFor(() => expect(result.current.kpis).toEqual(kpis));

    act(() => {
      focusCallbacks[focusCallbacks.length - 1]();
    });

    await waitFor(() => expect(result.current.kpis).toEqual(freshKpis));
    expect(mockGetProgressKpis).toHaveBeenCalledTimes(2);
  });
});