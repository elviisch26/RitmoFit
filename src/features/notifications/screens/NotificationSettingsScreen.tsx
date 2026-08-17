import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { PermissionStatus } from 'expo';
import * as Notifications from 'expo-notifications';

import { ScreenContainer } from '@/shared/components';
import { colors, radii, spacing, typography } from '@/shared/theme';

import { resolveNextOccurrence } from '../domain/occurrence';
import { useReminderConfig } from '../hooks/useReminderConfig';
import {
  activateReminder,
  cancelReminder,
  reactivateReminder,
  updateReminderScheduledFor,
} from '../repository/notificationsRepository';
import {
  cancelScheduledReminder,
  scheduleReminder,
} from '../scheduler';
import { useNotificationStore } from '../store/notificationStore';
import { LABELS } from '../types';
import type { ReminderConfig, ReminderType } from '../types';
import { TimePickerModal } from '../components/TimePickerModal';

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Una fila por tipo de recordatorio: switch a11y + hora editable (abre el TimePickerModal). */
function ReminderRow({
  config,
  defaultEnabled,
  onChangeEnabled,
  onPressTime,
}: {
  config: ReminderConfig;
  defaultEnabled: boolean;
  onChangeEnabled: (enabled: boolean) => void;
  onPressTime: () => void;
}) {
  const label = LABELS[config.type];
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Cambiar hora de ${label}`}
          onPress={onPressTime}
          style={styles.timeButton}
        >
          <Text style={styles.rowTime}>{formatTime(config.hour, config.minute)}</Text>
        </Pressable>
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel={label}
        value={defaultEnabled}
        onValueChange={onChangeEnabled}
        trackColor={{ false: colors.border, true: colors.primaryMuted }}
        thumbColor={defaultEnabled ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

/** Deep link a los ajustes del sistema mostrado cuando el permiso fue denegado (REMINDERS-3). */
function PermissionWarning({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <View style={styles.warning} accessibilityRole="alert">
      <Text style={styles.warningText}>
        Las notificaciones están desactivadas en los ajustes del sistema
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir ajustes"
        onPress={onOpenSettings}
        style={styles.warningButton}
      >
        <Text style={styles.warningButtonLabel}>Abrir ajustes</Text>
      </Pressable>
    </View>
  );
}

export function NotificationSettingsScreen() {
  const { data } = useReminderConfig();
  const reminders = useNotificationStore((state) => state.reminders);
  const syncFromDb = useNotificationStore((state) => state.syncFromDb);
  const setReminderConfig = useNotificationStore((state) => state.setReminderConfig);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [pickingType, setPickingType] = useState<ReminderType | null>(null);

  useEffect(() => {
    if (data) {
      syncFromDb(data);
    }
  }, [data, syncFromDb]);

  // La DB es la fuente de verdad; la caché de zustand solo refleja la última snapshot.
  const configs: ReminderConfig[] = reminders.length > 0 ? reminders : (data ?? []);
  const picking = pickingType ? configs.find((config) => config.type === pickingType) : null;

  const handleToggle = async (config: ReminderConfig, enabled: boolean) => {
    const now = new Date();
    if (enabled) {
      // REMINDERS-3: pedir permiso en runtime en el primer opt-in.
      const permission = await Notifications.requestPermissionsAsync();
      const granted = permission.status === PermissionStatus.GRANTED;
      await activateReminder(config.type, config.hour, config.minute, now);
      if (granted) {
        await scheduleReminder(
          config.type,
          resolveNextOccurrence(config.type, config.hour, config.minute, now),
        );
        setPermissionDenied(false);
      } else {
        setPermissionDenied(true);
      }
      // El estado visual permanece configurado incluso cuando se deniega (REMINDERS-3).
      setReminderConfig({ ...config, enabled: true });
    } else {
      await cancelScheduledReminder(config.type);
      await cancelReminder(config.type);
      setReminderConfig({ ...config, enabled: false });
    }
  };

  const handleConfirmTime = async (hour: number, minute: number) => {
    if (!picking) {
      return;
    }
    const now = new Date();
    const next = resolveNextOccurrence(picking.type, hour, minute, now);
    // REMINDERS-4: persistir la nueva ocurrencia y reconciliar la programación local.
    if (picking.enabled) {
      await reactivateReminder(picking.type, hour, minute, now);
      await cancelScheduledReminder(picking.type);
      await scheduleReminder(picking.type, next);
    } else {
      await updateReminderScheduledFor(picking.type, next);
    }
    setReminderConfig({ ...picking, hour, minute });
    setPickingType(null);
  };

  return (
    <ScreenContainer
      title="Recordatorios"
      subtitle="Recibí un aviso para cada momento del día."
    >
      {permissionDenied ? (
        <PermissionWarning onOpenSettings={() => Linking.openSettings()} />
      ) : null}
      <View style={styles.rows}>
        {configs.map((config) => (
          <ReminderRow
            key={config.type}
            config={config}
            defaultEnabled={config.enabled}
            onChangeEnabled={(enabled) => handleToggle(config, enabled)}
            onPressTime={() => setPickingType(config.type)}
          />
        ))}
      </View>
      {picking ? (
        <TimePickerModal
          visible
          initialHour={picking.hour}
          initialMinute={picking.minute}
          onConfirm={handleConfirmTime}
          onClose={() => setPickingType(null)}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  timeButton: {
    marginTop: spacing.xxs,
    alignSelf: 'flex-start',
  },
  rowTime: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  warning: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  warningButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  warningButtonLabel: {
    color: colors.background,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});