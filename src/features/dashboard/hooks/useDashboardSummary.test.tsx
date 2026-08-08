import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { getDashboardSummary } from '../repository/dashboardRepository';
import { useDashboardSummary } from './useDashboardSummary';

jest.mock('../repository/dashboardRepository', () => ({
  getDashboardSummary: jest.fn(),
}));

const focusCallbacks: (() => void | (() => void))[] = [];
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    focusCallbacks.push(callback);
  },
}));

const mockGetDashboardSummary = jest.mocked(getDashboardSummary);

const withData = { workouts: 3, sets: 13, minutes: 180, streak: { current: 3, best: 5 } };
const emptyData = { workouts: 0, sets: 0, minutes: 0, streak: { current: 0, best: 0 } };

describe('useDashboardSummary (DASHBOARD-6 fetch path, D3 focus refetch)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks.length = 0;
  });

  afterEach(() => {
    queryClient?.clear();
    cleanup();
  });

  it('fetches the dashboard summary with a fresh clock and exposes the data (DASHBOARD-6)', async () => {
    mockGetDashboardSummary.mockResolvedValue(withData);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = await renderHook(() => useDashboardSummary(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(withData));

    expect(mockGetDashboardSummary).toHaveBeenCalledTimes(1);
    expect(mockGetDashboardSummary.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(queryClient.getQueryData(['dashboard'])).toEqual(withData);
  });

  it('refetches on focus, refreshing the KPI data (D3)', async () => {
    mockGetDashboardSummary.mockResolvedValueOnce(withData).mockResolvedValueOnce(emptyData);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = await renderHook(() => useDashboardSummary(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(withData));

    act(() => {
      focusCallbacks[focusCallbacks.length - 1]();
    });

    await waitFor(() => expect(result.current.data).toEqual(emptyData));
    expect(mockGetDashboardSummary).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(['dashboard'])).toEqual(emptyData);
  });
});