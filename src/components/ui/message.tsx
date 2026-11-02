import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { colors, radius, spacing } from '@/constants/theme';

const tones = {
  error: { background: colors.errorSoft, text: colors.error, icon: 'warning' },
  success: { background: colors.successSoft, text: colors.success, icon: 'check' },
  info: { background: colors.primarySoft, text: colors.primary, icon: 'info' },
} as const;

/** Form-level feedback such as "wrong password" or "saved". Renders nothing without text. */
export function Message({ tone, text }: { tone: keyof typeof tones; text: string | null }) {
  if (!text) return null;
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.background }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite">
      <Icon name={t.icon} size={20} color={t.text} />
      <AppText style={[styles.text, { color: t.text }]}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: { flex: 1 },
});
