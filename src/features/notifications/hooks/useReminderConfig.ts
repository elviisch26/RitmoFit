import { useQuery } from '@tanstack/react-query';

import { getReminderConfigs } from '../repository/notificationsRepository';
import { useNotificationStore } from '../store/notificationStore';

const NOTIFICATIONS_CONFIG_KEY = ['notifications', 'config'] as const;

/**
 * Consulta de la configuración de recordatorios (D2). Refleja la snapshot
 * obtenida en la caché de zustand para que la pantalla de ajustes pueda leerla
 * al instante mientras la DB sigue siendo la fuente de verdad.
 */
export function useReminderConfig() {
  const syncFromDb = useNotificationStore((state) => state.syncFromDb);

  return useQuery({
    queryKey: NOTIFICATIONS_CONFIG_KEY,
    queryFn: async () => {
      const configs = await getReminderConfigs();
      syncFromDb(configs);
      return configs;
    },
    staleTime: 30_000,
  });
}