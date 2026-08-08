import { LineChart } from 'react-native-gifted-charts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import type { LoadPoint } from '../types';

type LoadChartProps = {
  exerciseName: string;
  points: LoadPoint[];
};

/**
 * Load series chart for the selected exercise (PROGRESS-4/5): a wrapper View
 * exposing the a11y label plus the LineChart configured with `curved`,
 * `isAnimated` and the " kg" y-axis suffix.
 *
 * (Deviation note) gifted-charts 1.4.77 exposes the suffix as
 * `yAxisLabelSuffix`, not `yAxisSuffix` as the spec suggests — this keeps
 * typecheck green and the runtime behavior identical.
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