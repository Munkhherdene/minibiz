import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, touchTarget, typography } from '@/constants/theme';

export function TextField({
  label,
  error,
  hint,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor }, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <AppText variant="caption" tone="error">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  input: {
    ...typography.body,
    minHeight: touchTarget + 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    backgroundColor: colors.background,
    color: colors.text,
  },
});
