import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

type EmptyStateProps = {
  title: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

/**
 * Empty dashboard state (DASHBOARD-4): message plus an optional CTA that
 * navigates the user to their first routine.
 */
export function EmptyState({ title, ctaLabel, onCtaPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {ctaLabel && onCtaPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          onPress={onCtaPress}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ctaText: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '700',
  },
});