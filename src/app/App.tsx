import { useEffect } from 'react';

import { RootNavigator } from '@/app/navigation';
import { AppProviders } from '@/app/providers';
import { reconcileReminders } from '@/features/notifications/scheduler';

export function App() {
  // Boot reconciliation (NOTI-10/REMINDERS-5): re-arm enabled reminders whose
  // pending local schedule is missing or outdated. Denied permission is a no-op
  // handled inside the scheduler, so no guard is needed here.
  useEffect(() => {
    void reconcileReminders(new Date());
  }, []);

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

export { AppProviders } from '@/app/providers';