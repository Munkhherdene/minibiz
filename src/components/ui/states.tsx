import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { colors, spacing } from '@/constants/theme';
import { mn } from '@/i18n/mn';

export function LoadingState() {
  return (
    <View style={styles.center} accessibilityLabel={mn.common.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={32} color={colors.primary} />
      </View>
      <AppText variant="subheading" style={styles.centerText}>
        {title}
      </AppText>
      {description ? (
        <AppText tone="muted" style={styles.centerText}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Icon name="warning" size={32} color={colors.error} />
      <AppText style={styles.centerText}>{message}</AppText>
      {onRetry ? (
        <Button title={mn.common.retry} variant="secondary" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centerText: { textAlign: 'center' },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
