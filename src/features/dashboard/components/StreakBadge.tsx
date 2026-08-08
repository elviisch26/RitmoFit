import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, radii, spacing, typography } from '@/shared/theme';

type StreakBadgeProps = {
  current: number;
  best: number;
};

/**
 * Animated streak badge (DASHBOARD-3): entry animation with withTiming on
 * both opacity (0 -> 1) and scale (0.8 -> 1) over ~200ms. The accessibility
 * labels are always present, independent of the animation.
 */
export function StreakBadge({ current, best }: StreakBadgeProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 200 });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      accessibilityLabel={`Racha actual: ${current} días`}
      style={[styles.badge, animatedStyle]}
    >
      <Text style={styles.current}>🔥 {current} días</Text>
      <Text accessibilityLabel={`Mejor racha: ${best} días`} style={styles.best}>
        Mejor: {best}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  current: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  best: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
});