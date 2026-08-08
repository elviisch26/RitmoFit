import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MUSCLE_GROUP_LABELS, MUSCLE_GROUPS } from '@/shared/constants';
import { colors, radii, spacing, typography } from '@/shared/theme';

import { ExerciseCard } from '../components/ExerciseCard';
import { useExerciseTemplates } from '../hooks/useExerciseTemplates';
import type { MuscleGroup } from '../types';

type MuscleFilter = 'all' | MuscleGroup;

const ALL: MuscleFilter = 'all';

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

export function ExerciseCatalogScreen() {
  const { data: templates, isLoading, isError } = useExerciseTemplates();
  const [filter, setFilter] = useState<MuscleFilter>(ALL);

  const filtered =
    filter === ALL
      ? (templates ?? [])
      : (templates ?? []).filter((template) => template.muscleGroup === filter);

  let content: React.ReactNode;

  if (isLoading) {
    content = <ActivityIndicator testID="catalog-loading" color={colors.primary} style={styles.centered} />;
  } else if (isError) {
    content = <Text style={styles.emptyText}>No se pudo cargar el catálogo de ejercicios.</Text>;
  } else if (filtered.length === 0) {
    content = <Text style={styles.emptyText}>No se encontraron ejercicios.</Text>;
  } else {
    content = (
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
        contentContainerStyle={styles.listContent}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <FilterChip
          label="Todo"
          testID="filter-all"
          selected={filter === ALL}
          onPress={() => setFilter(ALL)}
        />
        {MUSCLE_GROUPS.map((group: MuscleGroup) => (
          <FilterChip
            key={group}
            label={MUSCLE_GROUP_LABELS[group]}
            testID={`filter-${group}`}
            selected={filter === group}
            onPress={() => setFilter(group)}
          />
        ))}
      </ScrollView>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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