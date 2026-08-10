import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { RootTabParamList, WorkoutsStackParamList } from '@/app/navigation';
import { ScreenContainer } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { EmptyState, KpiCard, StreakBadge } from '../components';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

type DashboardNavigation = NavigationProp<
  Omit<RootTabParamList, 'Workouts'> & {
    Workouts: NavigatorScreenParams<WorkoutsStackParamList>;
  }
>;

/**
 * Real dashboard home (DASHBOARD-4/5/6): weekly KPIs plus the animated streak
 * badge once there is at least one completed workout, otherwise an empty
 * state that guides the user to create their first routine.
 */
export function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigation>();
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || data === undefined) {
    return (
      <ScreenContainer title="Inicio">
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (data.workouts === 0) {
    return (
      <ScreenContainer title="Inicio" subtitle="Tu resumen de progreso semanal aparecerá aquí.">
        <EmptyState
          title="Todavía no registraste entrenamientos"
          ctaLabel="Crear mi primera rutina"
          onCtaPress={() => navigation.navigate('Workouts', { screen: 'RoutinesList' })}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Inicio" subtitle="Tu actividad de la semana.">
      <View style={styles.kpis}>
        <KpiCard label="Entrenos" value={data.workouts} accessibilityLabel={`Entrenos: ${data.workouts}`} />
        <KpiCard label="Series" value={data.sets} accessibilityLabel={`Series: ${data.sets}`} />
        <KpiCard label="Tiempo" value={data.minutes} accessibilityLabel={`Tiempo: ${data.minutes} minutos`} />
      </View>
      <View style={styles.streak}>
        <StreakBadge current={data.streak.current} best={data.streak.best} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  kpis: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  streak: {
    marginTop: spacing.xs,
  },
});