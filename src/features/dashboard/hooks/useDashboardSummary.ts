import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { getDashboardSummary } from '../repository/dashboardRepository';

const DASHBOARD_KEY = ['dashboard'] as const;

/**
 * Dashboard summary query (DASHBOARD-6). Refreshes on tab focus: every time
 * the screen regains focus the cached data is invalidated so the weekly KPIs
 * reflect the latest completed workouts (D3, TanStack Query v5).
 */
export function useDashboardSummary() {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    }, [queryClient]),
  );

  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => getDashboardSummary(new Date()),
    staleTime: 30_000,
  });
}