export const colors = {
  background: '#0B0E11',
  surface: '#151A1F',
  surfaceElevated: '#1E242C',
  border: '#2A323D',
  primary: '#22C55E',
  primaryMuted: '#166534',
  secondary: '#3B82F6',
  textPrimary: '#F1F5F9',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  display: 34,
  title: 28,
  heading: 20,
  body: 16,
  caption: 14,
  small: 12,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const zIndex = {
  base: 0,
  elevated: 10,
  overlay: 100,
} as const;
