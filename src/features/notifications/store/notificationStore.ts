import { create } from 'zustand';

import type { ReminderConfig } from '../types';

/**
 * Reactive cache of reminder configs (D2). The database stays the source of
 * truth; this store only mirrors the last snapshot for instant UI reads.
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