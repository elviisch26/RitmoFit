import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

type KpiCardProps = {
  label: string;
  value: number;
  accessibilityLabel: string;
};

/**
 * Tarjeta de KPI semanal. El accessibilityLabel explícito reemplaza los textos
 * visibles para los lectores de pantalla: "Entrenos: 3", "Series: 13",
 * "Tiempo: 180 minutos" (DASHBOARD-5).
 */
export function KpiCard({ label, value, accessibilityLabel }: KpiCardProps) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    minWidth: 0,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: spacing.xxs,
  },
});