import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, touchTarget } from '@/constants/theme';

/** Single-choice list of tappable chips, e.g. business type or currency. */
export function ChoiceChips<T extends string>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: {
  /** Also the accessibility label of the group. */
  label: string;
  /** Hide the visible label when the context already explains the choice. */
  hideLabel?: boolean;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      {hideLabel ? null : <AppText variant="label">{label}</AppText>}
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                (pressed || (disabled && !selected)) && styles.dimmed,
              ]}>
              <AppText variant="label" tone={selected ? 'primary' : 'secondary'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" tone="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget - 8,
    justifyContent: 'center',
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dimmed: { opacity: 0.5 },
});
