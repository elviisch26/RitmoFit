import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

import {
  useAddSet,
  useCompleteWorkout,
  useDeleteSet,
  useUpdateSet,
  useWorkout,
  useWorkoutExercises,
} from '../hooks/useWorkouts';
import { useWorkoutUiStore } from '../store/workoutUiStore';
import type {
  AddSetInput,
  UpdateSetInput,
  WorkoutExercise,
  WorkoutsStackParamList,
  WorkoutSet,
} from '../types';

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

type SetRowProps = {
  setItem: WorkoutSet;
  exerciseName: string;
  onUpdate: (input: UpdateSetInput) => void;
  onDelete: () => void;
};

function SetRow({ setItem, exerciseName, onUpdate, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(() =>
    setItem.weightKg === 0 ? '' : String(setItem.weightKg),
  );
  const [reps, setReps] = useState(() => String(setItem.reps));
  const setLabel = String(setItem.orderIndex + 1);

  const commit = () => {
    const parsedWeight = parseFloat(weight);
    const parsedReps = parseInt(reps, 10);
    if (Number.isNaN(parsedWeight) || Number.isNaN(parsedReps)) {
      return;
    }
    if (parsedWeight !== setItem.weightKg || parsedReps !== setItem.reps) {
      onUpdate({ weightKg: parsedWeight, reps: parsedReps });
    }
  };

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{setLabel}</Text>
      <TextInput
        accessibilityLabel={`${exerciseName} serie ${setLabel} peso`}
        value={weight}
        onChangeText={setWeight}
        onBlur={commit}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor={colors.textMuted}
        style={styles.setInput}
      />
      <TextInput
        accessibilityLabel={`${exerciseName} serie ${setLabel} repeticiones`}
        value={reps}
        onChangeText={setReps}
        onBlur={commit}
        keyboardType="number-pad"
        placeholder="reps"
        placeholderTextColor={colors.textMuted}
        style={styles.setInput}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Eliminar serie ${setLabel} de ${exerciseName}`}
        onPress={onDelete}
        hitSlop={8}
        style={styles.setDeleteButton}
      >
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </Pressable>
    </View>
  );
}

type AddSetFormProps = {
  previousWeight: number;
  onAdd: (input: AddSetInput) => void;
  onCancel: () => void;
};

function AddSetForm({ previousWeight, onAdd, onCancel }: AddSetFormProps) {
  const [weight, setWeight] = useState(() =>
    previousWeight === 0 ? '' : String(previousWeight),
  );
  const [reps, setReps] = useState('');

  const parsedWeight = parseFloat(weight);
  const parsedReps = parseInt(reps, 10);
  const canSave = !Number.isNaN(parsedWeight) && parsedWeight >= 0 && !Number.isNaN(parsedReps) && parsedReps > 0;

  return (
    <View style={styles.addSetForm}>
      <Text style={styles.addSetFormTitle}>Nueva serie</Text>
      <View style={styles.setRow}>
        <TextInput
          accessibilityLabel="Peso de la nueva serie"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor={colors.textMuted}
          style={styles.setInput}
        />
        <TextInput
          accessibilityLabel="Repeticiones de la nueva serie"
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          placeholder="reps"
          placeholderTextColor={colors.textMuted}
          style={styles.setInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => onAdd({ weightKg: parsedWeight, reps: parsedReps })}
          style={[styles.saveSetButton, !canSave && styles.saveSetButtonDisabled]}
        >
          <Text style={styles.saveSetLabel}>Guardar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar nueva serie"
          onPress={onCancel}
          hitSlop={8}
          style={styles.setDeleteButton}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function ExerciseCard({ exercise }: { exercise: WorkoutExercise }) {
  const {
    expandedExerciseId,
    addSetExerciseId,
    setExpandedExerciseId,
    setAddSetExerciseId,
  } = useWorkoutUiStore();
  const expanded = expandedExerciseId === exercise.id;
  const showAddForm = addSetExerciseId === exercise.id;

  const addSetMutation = useAddSet();
  const updateSetMutation = useUpdateSet();
  const deleteSetMutation = useDeleteSet();

  const setCountLabel = exercise.sets.length === 1 ? '1 serie' : `${exercise.sets.length} series`;

  return (
    <View style={styles.exerciseCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${exercise.name}, ${setCountLabel}`}
        onPress={() => setExpandedExerciseId(expanded ? null : exercise.id)}
        style={styles.exerciseHeader}
      >
        <View style={styles.exerciseHeaderText}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseMeta}>{setCountLabel}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.exerciseBody}>
          {exercise.sets.map((setItem) => (
            <SetRow
              key={setItem.id}
              setItem={setItem}
              exerciseName={exercise.name}
              onUpdate={(input) => updateSetMutation.mutate({ setId: setItem.id, input })}
              onDelete={() => deleteSetMutation.mutate(setItem.id)}
            />
          ))}
          {showAddForm ? (
            <AddSetForm
              previousWeight={exercise.sets[exercise.sets.length - 1]?.weightKg ?? 0}
              onAdd={(input) =>
                addSetMutation.mutate(
                  { workoutExerciseId: exercise.id, input },
                  { onSuccess: () => setAddSetExerciseId(null) },
                )
              }
              onCancel={() => setAddSetExerciseId(null)}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Agregar serie a ${exercise.name}`}
              onPress={() => setAddSetExerciseId(exercise.id)}
              style={styles.addSetButton}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addSetLabel}>Agregar serie</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

export function WorkoutSessionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutsStackParamList>>();
  const route = useRoute<RouteProp<WorkoutsStackParamList, 'WorkoutSession'>>();
  const workoutId = route.params.workoutId;

  const {
    data: workout,
    isLoading: isWorkoutLoading,
    isError: isWorkoutError,
  } = useWorkout(workoutId);
  const {
    data: exercises,
    isLoading: isExercisesLoading,
    isError: isExercisesError,
  } = useWorkoutExercises(workoutId);
  const completeMutation = useCompleteWorkout();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (workout?.completedAt != null) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [workout?.completedAt]);

  const finished = workout?.completedAt != null;
  const elapsedLabel = formatElapsed(now - (workout?.startedAt ?? now));
  const isLoading = isWorkoutLoading || isExercisesLoading;
  const isError = isWorkoutError || isExercisesError;

  const handleFinish = () => {
    completeMutation.mutate(workoutId, { onSuccess: () => navigation.goBack() });
  };

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <ActivityIndicator testID="session-loading" color={colors.primary} style={styles.centered} />
    );
  } else if (isError) {
    content = <Text style={styles.emptyText}>No se pudo cargar este entrenamiento.</Text>;
  } else if (!exercises || exercises.length === 0) {
    content = <Text style={styles.emptyText}>Aún no hay ejercicios en este entrenamiento.</Text>;
  } else {
    content = (
      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
        contentContainerStyle={styles.listContent}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {workout?.name ?? 'Sesión de Entrenamiento'}
        </Text>
        <Text style={styles.elapsed}>Tiempo {elapsedLabel}</Text>
      </View>
      {content}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: completeMutation.isPending || finished }}
          disabled={completeMutation.isPending || finished}
          onPress={handleFinish}
          style={styles.finishButton}
        >
          <Text style={styles.finishButtonLabel}>
            {completeMutation.isPending
              ? 'Finalizando...'
              : finished
                ? 'Completado'
                : 'Finalizar entrenamiento'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  elapsed: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginTop: spacing.xxs,
  },
  listContent: {
    padding: spacing.md,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  exerciseHeaderText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: spacing.xxs,
  },
  exerciseBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  setNumber: {
    color: colors.textMuted,
    fontSize: typography.caption,
    width: 20,
    textAlign: 'center',
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setDeleteButton: {
    padding: spacing.xs,
  },
  addSetForm: {
    marginTop: spacing.xs,
  },
  addSetFormTitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginBottom: spacing.xs,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  addSetLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  saveSetButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveSetButtonDisabled: {
    opacity: 0.4,
  },
  saveSetLabel: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  finishButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  finishButtonLabel: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '700',
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