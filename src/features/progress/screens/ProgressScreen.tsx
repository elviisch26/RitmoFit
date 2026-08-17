import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EmptyState, KpiCard } from '@/features/dashboard/components';
import { ScreenContainer } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { ExercisePicker } from '../components/ExercisePicker';
import { LoadChart } from '../components/LoadChart';
import { useProgressStats } from '../hooks/useProgressStats';

/**
 * Tab de Progreso (PROGRESS-1..5): KPIs semanales idénticos a los del dashboard,
 * el picker de ejercicios y el gráfico de serie de cargas. Estados vacíos:
 * global (ninguna sesión) y por ejercicio (sin series con peso), ambos con
 * etiqueta a11y.
 */
export function ProgressScreen() {
  const { kpis, exercises, series, selectedExerciseId, setSelectedExerciseId, isLoading } =
    useProgressStats();

  if (isLoading || kpis === undefined) {
    return (
      <ScreenContainer title="Progreso">
        <View style={styles.loading}>
          <ActivityIndicator
            accessibilityLabel="Cargando datos de progreso"
            color={colors.primary}
            size="large"
          />
        </View>
      </ScreenContainer>
    );
  }

  if (exercises.length === 0) {
    return (
      <ScreenContainer title="Progreso" subtitle="Tus cargas por ejercicio aparecerán aquí.">
        <View accessibilityLabel="Todavía no hay sesiones registradas">
          <EmptyState title="Todavía no hay sesiones registradas" />
        </View>
      </ScreenContainer>
    );
  }

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId);

  return (
    <ScreenContainer title="Progreso" subtitle="Tu avance por ejercicio.">
      <View style={styles.kpis}>
        <KpiCard label="Entrenos" value={kpis.workouts} accessibilityLabel={`Entrenos: ${kpis.workouts}`} />
        <KpiCard label="Series" value={kpis.sets} accessibilityLabel={`Series: ${kpis.sets}`} />
        <KpiCard label="Tiempo" value={kpis.minutes} accessibilityLabel={`Tiempo: ${kpis.minutes} minutos`} />
      </View>
      <ExercisePicker exercises={exercises} selectedId={selectedExerciseId} onSelect={setSelectedExerciseId} />
      {selectedExercise == null || series === undefined ? null : series.length === 0 ? (
        <View accessibilityLabel="Sin series con peso para este ejercicio">
          <EmptyState title="Sin series con peso para este ejercicio" />
        </View>
      ) : (
        <LoadChart exerciseName={selectedExercise.name} points={series} />
      )}
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
});