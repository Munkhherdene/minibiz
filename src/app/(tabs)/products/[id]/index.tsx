import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Fragment, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  ListItem,
  LoadingState,
  Message,
  MoneyText,
  Screen,
} from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { formatQuantity, isLowStock, unitMargin } from '@/domain/inventory';
import { formatMoney } from '@/domain/money';
import { useActiveBusiness } from '@/features/business/hooks';
import { ProductThumbnail } from '@/features/products/components/product-thumbnail';
import { formatStock } from '@/features/products/format';
import { useProduct, useProductMovements, useUpdateProduct } from '@/features/products/hooks';
import { formatDateTime } from '@/i18n/format';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';
import type { Product } from '@/types/models';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);

  if (product.isPending) return <LoadingState />;
  if (product.isError) {
    return <ErrorState message={getErrorMessage(product.error)} onRetry={() => product.refetch()} />;
  }
  return <ProductDetail product={product.data} />;
}

function ProductDetail({ product }: { product: Product }) {
  const currency = useActiveBusiness()?.currency ?? 'MNT';
  const updateProduct = useUpdateProduct();
  const [error, setError] = useState<string | null>(null);
  const margin = unitMargin(product);
  const marginText =
    formatMoney(margin.amount, currency) +
    (margin.percent !== null ? ` (${Math.round(margin.percent)}%)` : '');

  async function setActive(isActive: boolean) {
    setError(null);
    try {
      await updateProduct.mutateAsync({ id: product.id, changes: { is_active: isActive } });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  function confirmArchive() {
    Alert.alert(mn.products.archiveConfirmTitle, mn.products.archiveConfirmText, [
      { text: mn.common.cancel, style: 'cancel' },
      { text: mn.products.archive, style: 'destructive', onPress: () => setActive(false) },
    ]);
  }

  const details: { label: string; value: string }[] = [
    { label: mn.products.stock, value: formatStock(product.current_stock, product.unit) },
    { label: mn.products.costPrice, value: formatMoney(product.cost_price, currency) },
    { label: mn.products.margin, value: marginText },
  ];
  if (product.low_stock_threshold !== null) {
    details.push({
      label: mn.products.lowStockThreshold,
      value: formatStock(product.low_stock_threshold, product.unit),
    });
  }
  if (product.sku) details.push({ label: mn.products.sku, value: product.sku });
  if (product.barcode) details.push({ label: mn.products.barcode, value: product.barcode });

  return (
    <Screen>
      <Stack.Screen options={{ title: product.name }} />
      <View style={styles.header}>
        <ProductThumbnail imagePath={product.image_path} size={72} />
        <View style={styles.headerText}>
          <AppText variant="heading">{product.name}</AppText>
          <MoneyText
            amount={product.selling_price}
            currency={currency}
            variant="subheading"
            tone="primary"
          />
          <View style={styles.badges}>
            {!product.is_active ? <Badge label={mn.products.archived} /> : null}
            {product.current_stock <= 0 ? (
              <Badge label={mn.products.outOfStock} tone="danger" />
            ) : isLowStock(product) ? (
              <Badge label={mn.products.lowStock} tone="warning" />
            ) : null}
          </View>
        </View>
      </View>

      {!product.is_active ? <Message tone="info" text={mn.products.archivedNotice} /> : null}

      <Card style={styles.list}>
        {details.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? <Divider /> : null}
            <ListItem title={item.label} value={item.value} />
          </Fragment>
        ))}
      </Card>

      <Message tone="error" text={error} />
      <View style={styles.actions}>
        <Button
          title={mn.products.edit}
          icon="edit"
          variant="secondary"
          style={styles.action}
          onPress={() => router.push({ pathname: '/products/[id]/edit', params: { id: product.id } })}
        />
        {product.is_active ? (
          <Button
            title={mn.products.archive}
            icon="archive"
            variant="danger"
            style={styles.action}
            loading={updateProduct.isPending}
            onPress={confirmArchive}
          />
        ) : (
          <Button
            title={mn.products.unarchive}
            icon="unarchive"
            variant="secondary"
            style={styles.action}
            loading={updateProduct.isPending}
            onPress={() => setActive(true)}
          />
        )}
      </View>

      <AppText variant="label" tone="muted">
        {mn.products.history}
      </AppText>
      <MovementHistory product={product} />
    </Screen>
  );
}

function MovementHistory({ product }: { product: Product }) {
  const movements = useProductMovements(product);

  if (movements.isPending) return <ActivityIndicator color={colors.primary} />;
  if (movements.isError) {
    return (
      <ErrorState message={getErrorMessage(movements.error)} onRetry={() => movements.refetch()} />
    );
  }
  if (movements.data.length === 0) {
    return <AppText tone="muted">{mn.products.noHistory}</AppText>;
  }

  return (
    <Card style={styles.list}>
      {movements.data.map((movement, index) => (
        <Fragment key={movement.id}>
          {index > 0 ? <Divider /> : null}
          <ListItem
            title={mn.products.movementTypes[movement.type]}
            subtitle={`${formatDateTime(movement.occurred_at)} · ${mn.products.stockAfter(
              formatQuantity(movement.stock_after),
            )}`}
            value={
              (movement.quantity_change > 0 ? '+' : '') + formatQuantity(movement.quantity_change)
            }
          />
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerText: { flex: 1, gap: spacing.xs },
  badges: { flexDirection: 'row', gap: spacing.xs },
  list: { paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
