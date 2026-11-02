import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { colors, radius, spacing, touchTarget, typography } from '@/constants/theme';
import { mn } from '@/i18n/mn';

export function TextField({
  label,
  error,
  hint,
  secureToggle = false,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  /** Omit only when the placeholder says what the field is for (e.g. search). */
  label?: string;
  error?: string;
  hint?: string;
  /** Hides the text and shows an eye button to reveal it (for passwords). */
  secureToggle?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View style={[styles.box, { borderColor }]}>
        <TextInput
          accessibilityLabel={label ?? props.placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry={secureToggle && !revealed}
          autoCapitalize={secureToggle ? 'none' : props.autoCapitalize}
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
        {secureToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? mn.common.hidePassword : mn.common.showPassword}
            hitSlop={8}
            onPress={() => setRevealed((value) => !value)}
            style={styles.toggle}>
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>
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
  box: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  input: {
    ...typography.body,
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg - 2,
    color: colors.text,
  },
  toggle: {
    height: touchTarget,
    width: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
