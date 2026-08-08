import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

export type ExerciseOption = { id: number; name: string };

type ExercisePickerProps = {
  exercises: ExerciseOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

/**
 * Horizontal chips with the exercises that have sessions (PROGRESS-2/5). Each
 * chip exposes a per-exercise accessibility label. When no exercise has
 * sessions it renders nothing — the global empty state is the screen's job.
 */
export function ExercisePicker({ exercises, selectedId, onSelect }: ExercisePickerProps) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {exercises.map((exercise) => {
        const selected = exercise.id === selectedId;
        return (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            accessibilityLabel={exercise.name}
            accessibilityState={{ selected }}
            onPress={() => onSelect(exercise.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {exercise.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.background,
  },
});