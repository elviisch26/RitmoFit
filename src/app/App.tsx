import { RootNavigator } from '@/app/navigation';
import { AppProviders } from '@/app/providers';

export function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

export { AppProviders } from '@/app/providers';