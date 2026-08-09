import { useQuery } from '@tanstack/react-query';

import { getReminderConfigs } from '../repository/notificationsRepository';
import { useNotificationStore } from '../store/notificationStore';

const NOTIFICATIONS_CONFIG_KEY = ['notifications', 'config'] as const;

/**
 * Reminder config query (D2). Mirrors the fetched snapshot into the zustand
 * cache so the settings screen can read instantly while the DB stays the
 * source of truth.
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