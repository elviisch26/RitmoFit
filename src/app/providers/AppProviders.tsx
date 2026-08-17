import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrapDatabase } from '@/database/client';
import { colors } from '@/shared/theme';

// React Navigation usa por defecto un tema claro (fondo blanco) a menos que se
// provea uno. Sin tema, cada transición de pantalla parpadea en blanco antes de
// renderizar el contenido. Este tema oscuro mantiene el contenedor, las tarjetas
// y los encabezados alineados con la paleta de la app.
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