import { useEffect } from 'react';

import { RootNavigator } from '@/app/navigation';
import { AppProviders } from '@/app/providers';
import { reconcileReminders } from '@/features/notifications/scheduler';

export function App() {
  // Reconciliación al arranque (NOTI-10/REMINDERS-5): re-arma los recordatorios
  // habilitados cuya programación local pendiente falta o está desactualizada.
  // El permiso denegado es un no-op manejado dentro del scheduler, por lo que
  // no hace falta ninguna guarda aquí.
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