import type { TextStyle } from 'react-native';

export const colors = {
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySoft: '#DBEAFE',
  text: '#111827',
  textSecondary: '#4B5563',
  muted: '#6B7280',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  error: '#DC2626',
  errorSoft: '#FEE2E2',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  background: '#FFFFFF',
  surface: '#F5F6F8',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

// Minimum touch target (Android guideline is 48dp).
export const touchTarget = 48;

export const typography = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} satisfies Record<string, TextStyle>;
