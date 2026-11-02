import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { spacing } from '@/constants/theme';

/** "Don't have an account? Sign up" style row with a full-size touch target. */
export function TextLink({
  prompt,
  label,
  onPress,
}: {
  prompt?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.row}>
      {prompt ? <AppText tone="muted">{prompt}</AppText> : null}
      <Button title={label} variant="ghost" onPress={onPress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  button: { paddingHorizontal: spacing.sm },
});
