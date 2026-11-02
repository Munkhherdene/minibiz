import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Badge, MoneyText } from '@/components/ui';
import { colors, radius, spacing, touchTarget } from '@/constants/theme';
import { isLowStock } from '@/domain/inventory';
import { ProductThumbnail } from '@/features/products/components/product-thumbnail';
import { formatStock } from '@/features/products/format';
import { mn } from '@/i18n/mn';
import type { Product } from '@/types/models';

export function ProductRow({
  product,
  currency,
  badge,
  onPress,
}: {
  product: Product;
  currency: string;
  /** Short highlighted text, e.g. the quantity already in the cart. */
  badge?: string;
  onPress: () => void;
}) {
  const low = isLowStock(product);
  const stock = formatStock(product.current_stock, product.unit);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ProductThumbnail imagePath={product.image_path} />
      <View style={styles.text}>
        <AppText numberOfLines={1}>{product.name}</AppText>
        <AppText variant="caption" tone={low ? 'error' : 'muted'} numberOfLines={1}>
          {low ? `${stock} · ${mn.products.lowStock}` : stock}
        </AppText>
      </View>
      <View style={styles.trailing}>
        <MoneyText amount={product.selling_price} currency={currency} variant="label" />
        {badge ? <Badge label={badge} tone="info" /> : null}
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
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  pressed: { opacity: 0.6 },
});
