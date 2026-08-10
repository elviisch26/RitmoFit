import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrapDatabase } from '@/database/client';
import { colors } from '@/shared/theme';

// React Navigation defaults to a light theme (white background) unless a theme
// is provided. Without one, every screen transition flashes white before the
// screen content renders. This dark theme keeps the container, cards, and
// headers aligned with the app palette.
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
};

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    bootstrapDatabase();
    return new QueryClient(queryClientOptions);
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}