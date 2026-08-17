import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { getDashboardSummary } from '../repository/dashboardRepository';

const DASHBOARD_KEY = ['dashboard'] as const;

/**
 * Consulta del resumen del dashboard (DASHBOARD-6). Se refresca al ganar foco
 * el tab: cada vez que la pantalla recupera el foco se invalida la data en
 * caché para que los KPIs semanales reflejen los últimos entrenamientos
 * completados (D3, TanStack Query v5).
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