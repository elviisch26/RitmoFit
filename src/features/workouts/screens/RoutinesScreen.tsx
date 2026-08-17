import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GOALS, GOAL_LABELS } from '@/shared/constants';
import { colors, radii, spacing, typography } from '@/shared/theme';

import {
  useDeleteRoutine,
  useDuplicateRoutine,
  useRoutines,
  useSeedExampleRoutines,
} from '../hooks/useRoutines';
import { useStartWorkoutFromRoutine } from '../hooks/useWorkouts';
import { useRoutinesUiStore } from '../store/routinesUiStore';
import type { Routine, WorkoutsStackParamList } from '../types';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
};

function FilterChip({ label, selected, onPress, testID }: FilterChipProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

type RoutineRowProps = {
  routine: Routine;
  expanded: boolean;
  onToggleExpand: () => void;
  onStart: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function RoutineRow({
  routine,
  expanded,
  onToggleExpand,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
}: RoutineRowProps) {
  const exerciseLabel =
    routine.exercises.length === 1 ? '1 ejercicio' : `${routine.exercises.length} ejercicios`;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${routine.name}, ${exerciseLabel}`}
        onPress={onToggleExpand}
        style={styles.cardHeader}
      >
        <View style={styles.cardTitleGroup}>
          <Text style={styles.cardTitle}>{routine.name}</Text>
          <Text style={styles.cardSubtitle}>{exerciseLabel}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.exerciseList}>
          {routine.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              <Text style={styles.exerciseMeta}>
                {exercise.targetSets}x{exercise.targetReps}
                {exercise.restSeconds > 0 ? ` · ${exercise.restSeconds}s de descanso` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Comenzar entrenamiento con ${routine.name}`}
          onPress={onStart}
          style={styles.startButton}
        >
          <Ionicons name="play" size={16} color={colors.background} />
          <Text style={styles.startButtonLabel}>Comenzar entrenamiento</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${routine.name}`}
          onPress={onEdit}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="pencil" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Duplicar ${routine.name}`}
          onPress={onDuplicate}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${routine.name}`}
          onPress={onDelete}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

export function RoutinesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutsStackParamList>>();
  const { data: routines, isLoading, isError } = useRoutines();
  const deleteMutation = useDeleteRoutine();
  const duplicateMutation = useDuplicateRoutine();
  const seedRoutinesMutation = useSeedExampleRoutines();
  const startWorkoutMutation = useStartWorkoutFromRoutine();

  const {
    searchPhrase,
    setSearchPhrase,
    expandedRoutineId,
    setExpandedRoutineId,
    goalFilter,
    setGoalFilter,
  } = useRoutinesUiStore();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver historial de entrenos"
            onPress={() => navigation.navigate('WorkoutsHistory')}
            hitSlop={8}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver catálogo de ejercicios"
            onPress={() => navigation.navigate('ExerciseCatalog')}
            hitSlop={8}
          >
            <Ionicons name="grid-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  const filtered = (routines ?? []).filter((routine) => {
    const matchesPhrase = routine.name
      .toLowerCase()
      .includes(searchPhrase.trim().toLowerCase());
    const matchesGoal = goalFilter === 'all' || routine.goal === goalFilter;
    return matchesPhrase && matchesGoal;
  });

  const handleDelete = (routine: Routine) => {
    Alert.alert('Eliminar rutina', `¿Eliminar "${routine.name}" definitivamente?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(routine.id),
      },
    ]);
  };

  let content;

  if (isLoading) {
    content = <ActivityIndicator color={colors.primary} style={styles.centered} />;
  } else if (isError) {
    content = (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No se pudieron cargar tus rutinas.</Text>
      </View>
    );
  } else if (filtered.length === 0) {
    const hasNoRoutines = (routines?.length ?? 0) === 0;
    const emptyMessage = hasNoRoutines
      ? 'Aún no hay rutinas.'
      : 'Ninguna rutina coincide con tu búsqueda.';
    content = (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('RoutineForm')}
          style={styles.emptyAddButton}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={styles.addButtonLabel}>Nueva rutina</Text>
        </Pressable>
        {hasNoRoutines ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar rutinas de ejemplo"
            onPress={() => seedRoutinesMutation.mutate()}
            style={styles.emptySeedButton}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.seedButtonLabel}>Usar rutinas de ejemplo</Text>
          </Pressable>
        ) : null}
      </View>
    );
  } else {
    content = (
      <View style={styles.listContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <FilterChip
            label="Todo"
            testID="goal-filter-all"
            selected={goalFilter === 'all'}
            onPress={() => setGoalFilter('all')}
          />
          {GOALS.map((goal) => (
            <FilterChip
              key={goal}
              label={GOAL_LABELS[goal]}
              testID={`goal-filter-${goal}`}
              selected={goalFilter === goal}
              onPress={() => setGoalFilter(goal)}
            />
          ))}
        </ScrollView>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RoutineRow
              routine={item}
              expanded={expandedRoutineId === item.id}
              onToggleExpand={() =>
                setExpandedRoutineId(expandedRoutineId === item.id ? null : item.id)
              }
              onStart={() =>
                startWorkoutMutation.mutate(item.id, {
                  onSuccess: (workoutId) =>
                    navigation.navigate('WorkoutSession', { workoutId }),
                })
              }
              onEdit={() => navigation.navigate('RoutineForm', { routineId: item.id })}
              onDuplicate={() => duplicateMutation.mutate(item.id)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('RoutineForm')}
              style={styles.addButton}
            >
              <Ionicons name="add" size={20} color={colors.background} />
              <Text style={styles.addButtonLabel}>Nueva rutina</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Buscar rutinas"
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          placeholder={`Buscar ${routines?.length ?? 0} rutinas`}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipsRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: colors.primary,
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
  cardTitleGroup: {
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
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: typography.caption,
  },
  exerciseMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.xs,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: 'auto',
  },
  startButtonLabel: {
    color: colors.background,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addButtonLabel: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '700',
  },
  centered: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  emptySeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  seedButtonLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});