import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

export const HOUR_STEP = 1;
export const HOUR_MIN = 0;
export const HOUR_MAX = 23;
export const MINUTE_STEP = 15;
export const MINUTE_MIN = 0;
export const MINUTE_MAX = 45;

export type TimePickerModalProps = {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
};

function range(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let value = min; value <= max; value += step) {
    values.push(value);
  }
  return values;
}

/** Selector de hora de dos columnas (hora 0-23, minuto 0-55 paso 15) siguiendo a ExercisePickerModal. */
export function TimePickerModal({
  visible,
  initialHour,
  initialMinute,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const hours = range(HOUR_MIN, HOUR_MAX, HOUR_STEP);
  const minutes = range(MINUTE_MIN, MINUTE_MAX, MINUTE_STEP);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Elegir hora</Text>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.columnLabel} accessibilityLabel="Hora">
                Hora
              </Text>
              <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
                {hours.map((hour) => (
                  <Pressable
                    key={hour}
                    accessibilityRole="button"
                    accessibilityLabel={`Hora ${hour}`}
                    onPress={() => setSelectedHour(hour)}
                    style={[styles.option, selectedHour === hour && styles.optionSelected]}
                  >
                    <Text style={[styles.optionLabel, selectedHour === hour && styles.optionLabelSelected]}>
                      {String(hour).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel} accessibilityLabel="Minutos">
                Minutos
              </Text>
              <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
                {minutes.map((minute) => (
                  <Pressable
                    key={minute}
                    accessibilityRole="button"
                    accessibilityLabel={`Minuto ${minute}`}
                    onPress={() => setSelectedMinute(minute)}
                    style={[styles.option, selectedMinute === minute && styles.optionSelected]}
                  >
                    <Text style={[styles.optionLabel, selectedMinute === minute && styles.optionLabelSelected]}>
                      {String(minute).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => onConfirm(selectedHour, selectedMinute)}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonLabel}>Confirmar</Text>
          </Pressable>
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
  column: {
    flex: 1,
  },
  columnLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  columns: {
    flexDirection: 'row',
  },
  options: {
    flexGrow: 0,
    maxHeight: 240,
    marginBottom: spacing.md,
  },
  optionsContent: {
    gap: spacing.xs,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  confirmButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  confirmButtonLabel: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '700',
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