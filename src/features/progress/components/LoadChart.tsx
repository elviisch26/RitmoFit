import { LineChart } from 'react-native-gifted-charts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import type { LoadPoint } from '../types';

type LoadChartProps = {
  exerciseName: string;
  points: LoadPoint[];
};

/**
 * Gráfico de serie de cargas para el ejercicio seleccionado (PROGRESS-4/5): un
 * View envoltorio que expone la etiqueta a11y más el LineChart configurado con
 * `curved`, `isAnimated` y el sufijo del eje y en " kg".
 *
 * (Nota de desvío) gifted-charts 1.4.77 expone el sufijo como `yAxisLabelSuffix`,
 * no como `yAxisSuffix` como sugiere la spec — esto mantiene el typecheck en
 * verde y el comportamiento en runtime idéntico.
 */
export function LoadChart({ exerciseName, points }: LoadChartProps) {
  return (
    <View accessibilityLabel={`Evolución de cargas de ${exerciseName}`} style={styles.container}>
      <LineChart
        data={points.map((point) => ({ value: point.weightKg, label: point.date }))}
        curved
        isAnimated
        yAxisLabelSuffix=" kg"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
});