import { StyleSheet, Text, View } from 'react-native';

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '@/shared/constants';
import { colors, radii, spacing, typography } from '@/shared/theme';

import type { ExerciseTemplate } from '../types';

type ExerciseCardProps = {
  exercise: ExerciseTemplate;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{exercise.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Text>
        <Text style={styles.meta}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    textTransform: 'capitalize',
  },
});