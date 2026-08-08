import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useExerciseTemplates } from '@/features/exercises/hooks/useExerciseTemplates';
import type { ExerciseTemplate } from '@/features/exercises/types';
import { MUSCLE_GROUP_LABELS } from '@/shared/constants';
import { colors, radii, spacing, typography } from '@/shared/theme';

type ExercisePickerModalProps = {
  visible: boolean;
  onSelect: (template: ExerciseTemplate) => void;
  onClose: () => void;
};

export function ExercisePickerModal({ visible, onSelect, onClose }: ExercisePickerModalProps) {
  const { data: templates } = useExerciseTemplates();
  const [query, setQuery] = useState('');

  const filtered = (templates ?? []).filter((template) =>
    template.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Elige un ejercicio</Text>
          <TextInput
            accessibilityLabel="Buscar ejercicios"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ejercicios"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar ${item.name}`}
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                }}
                style={styles.row}
              >
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{MUSCLE_GROUP_LABELS[item.muscleGroup]}</Text>
              </Pressable>
            )}
            style={styles.list}
          />
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonLabel}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    maxHeight: '75%',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  list: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: 'capitalize',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
  },
  cancelButtonLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
});