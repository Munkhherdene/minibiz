import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Icon, MoneyText, type IconName } from '@/components/ui';
import { colors, radius, spacing, touchTarget, typography } from '@/constants/theme';
import { requiresWholeQuantity } from '@/domain/inventory';
import { formatMoney } from '@/domain/money';
import { lineTotal } from '@/domain/sales';
import { formatStock } from '@/features/products/format';
import { lineQuantity, type CartLine } from '@/features/sales/cart';
import { mn } from '@/i18n/mn';

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.step, (pressed || disabled) && styles.dimmed]}>
      <Icon name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}

/** One cart line on the checkout step: − quantity +, line total and remove. */
export function CartLineEditor({
  line,
  currency,
  error,
  onChangeQuantity,
  onRemove,
}: {
  line: CartLine;
  currency: string;
  error: string | null;
  onChangeQuantity: (text: string) => void;
  onRemove: () => void;
}) {
  const { product } = line;
  const quantity = lineQuantity(line);

  return (
    <View style={styles.line}>
      <View style={styles.top}>
        <View style={styles.text}>
          <AppText numberOfLines={2}>{product.name}</AppText>
          <AppText variant="caption" tone="muted">
            {`${formatMoney(product.selling_price, currency)} · ${mn.sales.stockLeft(
              formatStock(product.current_stock, product.unit),
            )}`}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mn.sales.remove}
          hitSlop={8}
          onPress={onRemove}>
          <Icon name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>
      <View style={styles.bottom}>
        <View style={styles.stepper}>
          <StepButton
            icon="remove"
            label={mn.sales.decrease}
            disabled={quantity <= 1}
            onPress={() => onChangeQuantity(String(Math.max(quantity - 1, 1)))}
          />
          <TextInput
            accessibilityLabel={mn.sales.quantity}
            value={line.quantityText}
            onChangeText={onChangeQuantity}
            keyboardType={requiresWholeQuantity(product.unit) ? 'number-pad' : 'decimal-pad'}
            selectTextOnFocus
            style={[styles.input, error ? styles.inputError : null]}
          />
          <StepButton
            icon="add"
            label={mn.sales.increase}
            onPress={() => onChangeQuantity(String(quantity + 1))}
          />
          <AppText variant="caption" tone="muted">
            {mn.products.units[product.unit]}
          </AppText>
        </View>
        <MoneyText
          amount={lineTotal(quantity, product.selling_price)}
          currency={currency}
          variant="label"
        />
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
  line: { gap: spacing.sm, paddingVertical: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  text: { flex: 1, gap: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  step: {
    width: touchTarget - 8,
    height: touchTarget - 8,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    minWidth: 56,
    height: touchTarget - 8,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    textAlign: 'center',
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  dimmed: { opacity: 0.4 },
});
