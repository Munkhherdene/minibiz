import { zodResolver } from '@hookform/resolvers/zod';
import { randomUUID } from 'expo-crypto';
import { Stack, router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FlatList, StyleSheet, View } from 'react-native';

import { FormTextField } from '@/components/form/form-text-field';
import {
  AppText,
  Button,
  Card,
  ChoiceChips,
  Divider,
  EmptyState,
  ErrorState,
  ListItem,
  LoadingState,
  Message,
  MoneyText,
  Screen,
  TextField,
} from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { formatQuantity } from '@/domain/inventory';
import { formatMoney, roundMoney } from '@/domain/money';
import { settlePayment } from '@/domain/sales';
import { useActiveBusiness } from '@/features/business/hooks';
import { ProductRow } from '@/features/products/components/product-row';
import { useProducts } from '@/features/products/hooks';
import { lineError, lineQuantity, useCart, type Cart } from '@/features/sales/cart';
import { CartLineEditor } from '@/features/sales/components/cart-line-editor';
import { useCreateSale } from '@/features/sales/hooks';
import {
  checkoutSchema,
  type CheckoutFormValues,
  type CheckoutInput,
} from '@/features/sales/schemas';
import { mn } from '@/i18n/mn';
import { MONEY_PATTERN, parseNumberInput } from '@/lib/number-input';
import { getErrorMessage } from '@/lib/errors';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { PAYMENT_METHODS } from '@/types/models';

/** Cart and checkout are two steps of one screen so they share the cart. */
export default function NewSaleScreen() {
  const cart = useCart();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  // Created once per screen: a retry after a network error (even after going back to
  // the cart) returns the already-saved sale instead of creating a duplicate.
  const [clientRequestId] = useState(() => randomUUID());

  return (
    <>
      <Stack.Screen options={{ title: mn.sales.newTitle }} />
      {step === 'cart' ? (
        <CartStep cart={cart} onCheckout={() => setStep('checkout')} />
      ) : (
        <CheckoutStep
          cart={cart}
          clientRequestId={clientRequestId}
          onBack={() => setStep('cart')}
        />
      )}
    </>
  );
}

function CartStep({ cart, onCheckout }: { cart: Cart; onCheckout: () => void }) {
  const currency = useActiveBusiness()?.currency ?? 'MNT';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const products = useProducts({ search: debouncedSearch, archived: false });
  const items = products.data?.pages.flat() ?? [];

  function renderEmpty() {
    if (products.isPending) return <LoadingState />;
    if (products.isError) {
      return (
        <ErrorState message={getErrorMessage(products.error)} onRetry={() => products.refetch()} />
      );
    }
    if (debouncedSearch) return <EmptyState icon="search" title={mn.products.noResults} />;
    return (
      <EmptyState
        icon="products"
        title={mn.sales.noProducts}
        actionLabel={mn.products.add}
        onAction={() => router.push('/products/new')}
      />
    );
  }

  return (
    <Screen scroll={false}>
      <TextField
        placeholder={mn.sales.searchProducts}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <FlatList
        data={items}
        keyExtractor={(product) => product.id}
        renderItem={({ item }) => {
          const inCart = cart.quantityOf(item.id);
          return (
            <ProductRow
              product={item}
              currency={currency}
              badge={inCart > 0 ? `× ${formatQuantity(inCart)}` : undefined}
              onPress={() => cart.add(item)}
            />
          );
        }}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty()}
        onEndReached={() => {
          if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
      {cart.lines.length > 0 ? (
        <Card style={styles.bar}>
          <View style={styles.barText}>
            <AppText variant="caption" tone="muted">
              {mn.sales.inCart(cart.lines.length)}
            </AppText>
            <MoneyText amount={cart.subtotal} currency={currency} variant="heading" />
          </View>
          <Button title={mn.sales.checkout} onPress={onCheckout} />
        </Card>
      ) : null}
    </Screen>
  );
}

const methodOptions = PAYMENT_METHODS.map((value) => ({ value, label: mn.sales.methods[value] }));

function CheckoutStep({
  cart,
  clientRequestId,
  onBack,
}: {
  cart: Cart;
  clientRequestId: string;
  onBack: () => void;
}) {
  const business = useActiveBusiness();
  const currency = business?.currency ?? 'MNT';
  const allowNegativeStock = business?.allow_negative_stock ?? false;
  const createSale = useCreateSale();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CheckoutFormValues, unknown, CheckoutInput>({
    resolver: zodResolver(checkoutSchema(cart.subtotal)),
    defaultValues: { discount: '', method: 'cash', amountPaid: '', customerName: '', note: '' },
  });

  // Live totals from what is typed so far (invalid input counts as 0 / full payment).
  const [discountText, amountPaidText, method] = useWatch({
    control,
    name: ['discount', 'amountPaid', 'method'],
  });
  const discount = Math.min(parseNumberInput(discountText, MONEY_PATTERN) ?? 0, cart.subtotal);
  const total = roundMoney(cart.subtotal - discount);
  const payment = settlePayment(total, parseNumberInput(amountPaidText, MONEY_PATTERN) ?? null);

  const lineErrors = cart.lines.map((line) => lineError(line, allowNegativeStock));
  const canSubmit = cart.lines.length > 0 && lineErrors.every((e) => e === null);

  const confirm = handleSubmit(async (values) => {
    if (!business || !canSubmit) return;
    setError(null);
    const settled = settlePayment(total, values.amountPaid);
    try {
      const sale = await createSale.mutateAsync({
        businessId: business.id,
        clientRequestId,
        items: cart.lines.map((line) => ({
          productId: line.product.id,
          quantity: lineQuantity(line),
        })),
        discount: values.discount ?? 0,
        amountPaid: settled.amountPaid,
        method: values.method,
        customerName: values.customerName,
        note: values.note,
      });
      router.replace({ pathname: '/sales/[id]', params: { id: sale.id } });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  if (cart.lines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="sales"
          title={mn.errors.codes.EMPTY_SALE}
          actionLabel={mn.sales.backToCart}
          onAction={onBack}
        />
      </Screen>
    );
  }

  const summary: { label: string; amount: number; strong?: boolean }[] = [
    { label: mn.sales.subtotal, amount: cart.subtotal },
  ];
  if (discount > 0) summary.push({ label: mn.sales.discount, amount: -discount });
  summary.push({ label: mn.sales.total, amount: total, strong: true });
  if (method === 'cash' && payment.change > 0) summary.push({ label: mn.sales.change, amount: payment.change });
  if (payment.balanceDue > 0) summary.push({ label: mn.sales.balanceDue, amount: payment.balanceDue });

  return (
    <Screen>
      <Card style={styles.lines}>
        {cart.lines.map((line, index) => (
          <Fragment key={line.product.id}>
            {index > 0 ? <Divider /> : null}
            <CartLineEditor
              line={line}
              currency={currency}
              error={lineErrors[index]}
              onChangeQuantity={(text) => cart.setQuantity(line.product.id, text)}
              onRemove={() => cart.remove(line.product.id)}
            />
          </Fragment>
        ))}
      </Card>
      <Button title={mn.sales.backToCart} icon="add" variant="ghost" onPress={onBack} />

      <FormTextField
        control={control}
        name="discount"
        label={`${mn.sales.discount} (${mn.common.optional})`}
        placeholder="0"
        keyboardType="decimal-pad"
      />
      <Controller
        control={control}
        name="method"
        render={({ field }) => (
          <ChoiceChips
            label={mn.sales.paymentMethod}
            options={methodOptions}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <FormTextField
        control={control}
        name="amountPaid"
        label={`${mn.sales.amountPaid} (${mn.common.optional})`}
        hint={mn.sales.amountPaidHint}
        placeholder={formatMoney(total, currency)}
        keyboardType="decimal-pad"
      />
      <FormTextField
        control={control}
        name="customerName"
        label={`${mn.sales.customerName} (${mn.common.optional})`}
        placeholder={mn.sales.customerPlaceholder}
        maxLength={100}
      />
      <FormTextField
        control={control}
        name="note"
        label={`${mn.sales.note} (${mn.common.optional})`}
        maxLength={500}
        multiline
      />

      <Card style={styles.lines}>
        {summary.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 ? <Divider /> : null}
            <ListItem title={row.label} value={formatMoney(row.amount, currency)} />
          </Fragment>
        ))}
      </Card>
      <Message tone="error" text={error} />
      <Button
        title={`${mn.sales.confirm} · ${formatMoney(total, currency)}`}
        loading={isSubmitting}
        disabled={!canSubmit}
        onPress={confirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginHorizontal: -spacing.lg },
  listContent: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barText: { flex: 1 },
  lines: { paddingVertical: 4 },
});
