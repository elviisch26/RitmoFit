import { create } from 'zustand';

import type { ReminderConfig } from '../types';

/**
 * Caché reactiva de las configuraciones de recordatorios (D2). La base de datos
 * sigue siendo la fuente de verdad; este store solo refleja la última snapshot
 * para lecturas instantáneas de la UI.
 */
type NotificationState = {
  reminders: ReminderConfig[];
  setReminderConfig: (config: ReminderConfig) => void;
  syncFromDb: (configs: ReminderConfig[]) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  reminders: [],
  setReminderConfig: (config) =>
    set((state) => {
      const exists = state.reminders.some((reminder) => reminder.type === config.type);
      return {
        reminders: exists
          ? state.reminders.map((reminder) =>
              reminder.type === config.type ? config : reminder,
            )
          : [...state.reminders, config],
      };
    }),
  syncFromDb: (reminders) => set({ reminders }),
}));