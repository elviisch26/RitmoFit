import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, type Control, type Path } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useExerciseTemplates } from '@/features/exercises/hooks/useExerciseTemplates';
import type { ExerciseTemplate } from '@/features/exercises/types';
import { colors, radii, spacing, typography } from '@/shared/theme';

import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { useCreateRoutine, useGetRoutine, useUpdateRoutine } from '../hooks/useRoutines';
import {
  routineSchema,
  type Routine,
  type RoutineFormValues,
  type WorkoutsStackParamList,
} from '../types';

function toFormValues(routine: Routine): RoutineFormValues {
  return {
    name: routine.name,
    note: routine.note,
    exercises: routine.exercises.map((exercise) => ({
      exerciseTemplateId: exercise.exerciseTemplateId,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      restSeconds: exercise.restSeconds,
    })),
  };
}

type NumericFieldProps = {
  label: string;
  value: number;
  onChangeText: (text: string) => void;
  error?: string;
};

function NumericField({ label, value, onChangeText, error }: NumericFieldProps) {
  const textInputInvalidError = error != null ? styles.numericInputError : undefined;
  const displayValue = Number.isNaN(value) ? '' : String(value);

  return (
    <View style={styles.numericField}>
      <Text style={styles.numericLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={displayValue}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={[styles.numericInput, textInputInvalidError]}
      />
      {error != null ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type NumericControllerProps = {
  control: Control<RoutineFormValues>;
  name: Path<RoutineFormValues>;
  label: string;
};

function NumericController({ control, name, label }: NumericControllerProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <NumericField
          label={label}
          value={typeof value === 'number' ? value : Number.NaN}
          onChangeText={(text) => onChange(text.trim() === '' ? Number.NaN : Number(text))}
          error={error?.message}
        />
      )}
    />
  );
}

export function RoutineFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutsStackParamList>>();
  const route = useRoute<RouteProp<WorkoutsStackParamList, 'RoutineForm'>>();
  const routineId = route.params?.routineId;

  const { data: templates } = useExerciseTemplates();
  const { data: existingRoutine, isLoading: isRoutineLoading } = useGetRoutine(routineId);

  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: '',
      note: null,
      exercises: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  });

  const exercisesWatch = watch('exercises');

  const [picker, setPicker] = useState<{ visible: boolean; index: number | null }>({
    visible: false,
    index: null,
  });

  const templateById = useMemo(() => {
    const map = new Map<number, ExerciseTemplate>();
    (templates ?? []).forEach((template) => map.set(template.id, template));
    return map;
  }, [templates]);

  useEffect(() => {
    if (existingRoutine != null) {
      reset(toFormValues(existingRoutine));
    }
  }, [existingRoutine, reset]);

  useEffect(() => {
    if (routineId !== undefined && !isRoutineLoading && existingRoutine === undefined) {
      navigation.goBack();
    }
  }, [routineId, isRoutineLoading, existingRoutine, navigation]);

  if (routineId !== undefined && isRoutineLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const openPicker = (index: number | null) => {
    setPicker({ visible: true, index });
  };

  const addExerciseRow = () => {
    const index = fields.length;
    append({ exerciseTemplateId: 0, targetSets: 3, targetReps: 10, restSeconds: 60 });
    openPicker(index);
  };

  const handleSelectTemplate = (template: ExerciseTemplate) => {
    if (picker.index != null) {
      setValue(`exercises.${picker.index}.exerciseTemplateId`, template.id, {
        shouldValidate: true,
      });
    } else {
      append({
        exerciseTemplateId: template.id,
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      });
    }
    setPicker({ visible: false, index: null });
  };

  const onSubmit = handleSubmit((values) => {
    const input = {
      name: values.name,
      note: values.note?.trim() || null,
      exercises: values.exercises.map((exercise) => ({
        exerciseTemplateId: exercise.exerciseTemplateId,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
      })),
    };

    if (routineId !== undefined) {
      updateMutation.mutate({ id: routineId, input }, { onSuccess: () => navigation.goBack() });
    } else {
      createMutation.mutate(input, { onSuccess: () => navigation.goBack() });
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          accessibilityLabel="Nombre de la rutina"
          placeholder="Nombre de la rutina"
          placeholderTextColor={colors.textMuted}
          style={[styles.textInput, errors.name != null && styles.textInputError]}
          {...register('name')}
        />
        {errors.name != null ? <Text style={styles.fieldError}>{errors.name.message}</Text> : null}

        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          accessibilityLabel="Nota de la rutina"
          placeholder="Nota opcional"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.textInput, styles.noteInput]}
          {...register('note')}
        />

        <Text style={styles.exercisesHeading}>Ejercicios</Text>
        {fields.map((field, index) => {
          const current = exercisesWatch?.[index];
          const hasTemplate = current?.exerciseTemplateId != null && current.exerciseTemplateId > 0;
          const template = hasTemplate ? templateById.get(current.exerciseTemplateId) : undefined;

          return (
            <View key={field.id} style={styles.exerciseRow}>
              <View style={styles.exerciseHeader}>
                {hasTemplate ? (
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {template?.name ?? `Ejercicio #${current.exerciseTemplateId}`}
                  </Text>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar ejercicio"
                    onPress={() => openPicker(index)}
                    style={styles.selectExerciseButton}
                  >
                    <Text style={styles.selectExerciseLabel}>Seleccionar ejercicio</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ejercicio ${index + 1}`}
                  onPress={() => remove(index)}
                  hitSlop={8}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color={colors.danger} />
                </Pressable>
              </View>

              {hasTemplate ? (
                <View style={styles.numericRow}>
                  <NumericController
                    control={control}
                    name={`exercises.${index}.targetSets` as Path<RoutineFormValues>}
                    label="Series"
                  />
                  <NumericController
                    control={control}
                    name={`exercises.${index}.targetReps` as Path<RoutineFormValues>}
                    label="Reps"
                  />
                  <NumericController
                    control={control}
                    name={`exercises.${index}.restSeconds` as Path<RoutineFormValues>}
                    label="Descanso (s)"
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        {errors.exercises != null ? (
          <Text style={styles.fieldError}>
            {errors.exercises.message ?? errors.exercises.root?.message}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={addExerciseRow}
          style={styles.addExerciseButton}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addExerciseLabel}>Agregar ejercicio</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          onPress={onSubmit}
          disabled={isSubmitting}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonLabel}>
            {isSubmitting
              ? 'Guardando...'
              : routineId !== undefined
                ? 'Guardar cambios'
                : 'Crear rutina'}
          </Text>
        </Pressable>
      </ScrollView>

      <ExercisePickerModal
        visible={picker.visible}
        onSelect={handleSelectTemplate}
        onClose={() => setPicker({ visible: false, index: null })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInputError: {
    borderColor: colors.danger,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: colors.danger,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
  exercisesHeading: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  exerciseRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  selectExerciseButton: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  selectExerciseLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  removeButton: {
    padding: spacing.xxs,
  },
  numericRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  numericField: {
    flex: 1,
  },
  numericLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginBottom: spacing.xs,
  },
  numericInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  numericInputError: {
    borderColor: colors.danger,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  addExerciseLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  saveButtonLabel: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});