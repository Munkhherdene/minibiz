import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, MoneyText } from '@/components/ui';
import { colors, radius, spacing, touchTarget } from '@/constants/theme';
import { SaleStatusBadge } from '@/features/sales/components/status-badge';
import { formatDateTime } from '@/i18n/format';
import { mn } from '@/i18n/mn';
import type { Sale } from '@/types/models';

export function SaleRow({
  sale,
  currency,
  onPress,
}: {
  sale: Sale;
  currency: string;
  onPress: () => void;
}) {
  const cancelled = sale.status === 'cancelled';
  const subtitle = [formatDateTime(sale.sold_at), sale.customer_name].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.text}>
        <AppText numberOfLines={1}>{mn.sales.saleNumber(sale.sale_number)}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <View style={styles.amount}>
        <MoneyText
          amount={sale.total_amount}
          currency={currency}
          variant="label"
          tone={cancelled ? 'muted' : 'default'}
          style={cancelled && styles.struck}
        />
        <SaleStatusBadge sale={sale} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  text: { flex: 1, gap: 2 },
  amount: { alignItems: 'flex-end', gap: spacing.xs },
  struck: { textDecorationLine: 'line-through' },
  pressed: { opacity: 0.6 },
});
