import { Text, type TextProps } from 'react-native';

import { colors, typography } from '@/constants/theme';

type Variant = keyof typeof typography;
type Tone = 'default' | 'secondary' | 'muted' | 'primary' | 'error' | 'success' | 'inverse';

const toneColors: Record<Tone, string> = {
  default: colors.text,
  secondary: colors.textSecondary,
  muted: colors.muted,
  primary: colors.primary,
  error: colors.error,
  success: colors.success,
  inverse: colors.white,
};

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone }) {
  return <Text style={[typography[variant], { color: toneColors[tone] }, style]} {...props} />;
}
