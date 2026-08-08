import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

import { useWorkoutExercises, useWorkouts } from '../hooks/useWorkouts';
import { useWorkoutUiStore } from '../store/workoutUiStore';
import type { Workout } from '../types';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

function WorkoutHistoryDetail({ workoutId }: { workoutId: number }) {
  const { data: exercises, isLoading, isError } = useWorkoutExercises(workoutId);

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={styles.detailLoading} />;
  }

  if (isError) {
    return <Text style={styles.detailError}>No se pudieron cargar los detalles del entrenamiento.</Text>;
  }

  if (!exercises || exercises.length === 0) {
    return <Text style={styles.detailError}>No se registraron ejercicios.</Text>;
  }

  return (
    <View style={styles.detailBody}>
      {exercises.map((exercise) => {
        const volume = exercise.sets.reduce(
          (sum, setItem) => sum + setItem.weightKg * setItem.reps,
          0,
        );
        return (
          <View key={exercise.id} style={styles.detailRow}>
            <View style={styles.detailRowText}>
              <Text style={styles.detailExerciseName}>{exercise.name}</Text>
              <Text style={styles.detailMeta}>
                {exercise.sets.length === 1 ? '1 serie' : `${exercise.sets.length} series`}
                {' · '}
                {volume.toFixed(0)} kg de volumen
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function HistoryRow({ workout }: { workout: Workout }) {
  const { expandedHistoryId, setExpandedHistoryId } = useWorkoutUiStore();
  const expanded = expandedHistoryId === workout.id;

  const metaLabel = `Completado ${formatDate(workout.completedAt ?? workout.startedAt)}`;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${workout.name}, ${metaLabel}`}
        onPress={() => setExpandedHistoryId(expanded ? null : workout.id)}
        style={styles.cardHeader}
      >
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{workout.name}</Text>
          <Text style={styles.cardSubtitle}>{metaLabel}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded ? <WorkoutHistoryDetail workoutId={workout.id} /> : null}
    </View>
  );
}

export function WorkoutsHistoryScreen() {
  const { data: workouts, isLoading, isError } = useWorkouts();

  const completed = (workouts ?? []).filter((workout) => workout.completedAt != null);

  let content: React.ReactNode;

  if (isLoading) {
    content = <ActivityIndicator color={colors.primary} style={styles.centered} />;
  } else if (isError) {
    content = <Text style={styles.emptyText}>No se pudo cargar tu historial de entrenos.</Text>;
  } else if (completed.length === 0) {
    content = (
      <Text style={styles.emptyText}>
        Aún no hay entrenamientos completados. Finaliza una sesión para verlo aquí.
      </Text>
    );
  } else {
    content = (
      <FlatList
        data={completed}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <HistoryRow workout={item} />}
        contentContainerStyle={styles.listContent}
      />
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: spacing.xxs,
  },
  detailBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.xs,
  },
  detailRowText: {
    flex: 1,
  },
  detailExerciseName: {
    color: colors.textPrimary,
    fontSize: typography.caption,
  },
  detailMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: spacing.xxs,
  },
  detailLoading: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailError: {
    color: colors.textMuted,
    fontSize: typography.caption,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  centered: {
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});