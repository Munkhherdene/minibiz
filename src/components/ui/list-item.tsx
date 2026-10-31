import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { colors, spacing, touchTarget } from '@/constants/theme';

export function ListItem({
  title,
  subtitle,
  value,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
}) {
  const content = (
    <>
      {icon && <Icon name={icon} size={22} color={colors.primary} />}
      <View style={styles.text}>
        <AppText numberOfLines={1}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? <AppText tone="secondary">{value}</AppText> : null}
      {onPress && <Icon name="chevron" size={18} color={colors.muted} />}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, gap: 2 },
  pressed: { opacity: 0.6 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
