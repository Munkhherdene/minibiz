import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { FormTextField } from '@/components/form/form-text-field';
import {
  AppText,
  Button,
  Card,
  ChoiceChips,
  Divider,
  ErrorState,
  ListItem,
  LoadingState,
  Message,
  MoneyText,
  Screen,
  TextField,
} from '@/components/ui';
import { spacing } from '@/constants/theme';
import { formatMoney } from '@/domain/money';
import { useActiveBusiness } from '@/features/business/hooks';
import { formatStock } from '@/features/products/format';
import { SaleStatusBadge } from '@/features/sales/components/status-badge';
import { useAddSalePayment, useCancelSale, useSale } from '@/features/sales/hooks';
import {
  paymentSchema,
  type PaymentFormValues,
  type PaymentInput,
} from '@/features/sales/schemas';
import { formatDateTime } from '@/i18n/format';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';
import { PAYMENT_METHODS, type SaleWithDetails } from '@/types/models';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sale = useSale(id);

  if (sale.isPending) return <LoadingState />;
  if (sale.isError) {
    return <ErrorState message={getErrorMessage(sale.error)} onRetry={() => sale.refetch()} />;
  }
  return <SaleDetail sale={sale.data} />;
}

function SaleDetail({ sale }: { sale: SaleWithDetails }) {
  const currency = useActiveBusiness()?.currency ?? 'MNT';
  const money = (amount: number) => formatMoney(amount, currency);
  const completed = sale.status === 'completed';

  const totals: { label: string; value: string }[] = [
    { label: mn.sales.subtotal, value: money(sale.subtotal) },
  ];
  if (sale.discount_amount > 0) {
    totals.push({ label: mn.sales.discount, value: money(-sale.discount_amount) });
  }
  totals.push({ label: mn.sales.total, value: money(sale.total_amount) });
  if (completed) {
    totals.push({ label: mn.sales.paid, value: money(sale.amount_paid) });
    if (sale.balance_due > 0) {
      totals.push({ label: mn.sales.balanceDue, value: money(sale.balance_due) });
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: mn.sales.saleNumber(sale.sale_number) }} />
      <View style={styles.header}>
        <MoneyText amount={sale.total_amount} currency={currency} variant="title" />
        <SaleStatusBadge sale={sale} />
        <AppText tone="muted">
          {[formatDateTime(sale.sold_at), sale.customer_name].filter(Boolean).join(' · ')}
        </AppText>
      </View>

      {sale.status === 'cancelled' ? (
        <Message
          tone="info"
          text={[
            mn.sales.cancelledOn(sale.cancelled_at ? formatDateTime(sale.cancelled_at) : ''),
            sale.cancel_reason,
          ]
            .filter(Boolean)
            .join('\n')}
        />
      ) : null}

      <AppText variant="label" tone="muted">
        {mn.sales.items}
      </AppText>
      <Card style={styles.list}>
        {sale.sale_items.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? <Divider /> : null}
            <ListItem
              title={item.product_name}
              subtitle={mn.sales.lineDetail(
                formatStock(item.quantity, item.unit),
                money(item.unit_price),
              )}
              value={money(item.line_total)}
            />
          </Fragment>
        ))}
      </Card>

      <Card style={styles.list}>
        {totals.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 ? <Divider /> : null}
            <ListItem title={row.label} value={row.value} />
          </Fragment>
        ))}
      </Card>

      {sale.sale_payments.length > 0 ? (
        <>
          <AppText variant="label" tone="muted">
            {mn.sales.payments}
          </AppText>
          <Card style={styles.list}>
            {sale.sale_payments.map((payment, index) => (
              <Fragment key={payment.id}>
                {index > 0 ? <Divider /> : null}
                <ListItem
                  title={`${mn.sales.methods[payment.method]}${
                    payment.amount < 0 ? ` · ${mn.sales.refund}` : ''
                  }`}
                  subtitle={formatDateTime(payment.paid_at)}
                  value={money(payment.amount)}
                />
              </Fragment>
            ))}
          </Card>
        </>
      ) : null}

      {sale.note ? (
        <>
          <AppText variant="label" tone="muted">
            {mn.sales.note}
          </AppText>
          <Card>
            <AppText>{sale.note}</AppText>
          </Card>
        </>
      ) : null}

      {completed && sale.balance_due > 0 ? (
        // Keyed by the balance so the amount resets after a partial payment.
        <AddPaymentForm key={sale.balance_due} sale={sale} />
      ) : null}
      {completed ? <CancelSaleSection sale={sale} /> : null}
    </Screen>
  );
}

const methodOptions = PAYMENT_METHODS.map((value) => ({ value, label: mn.sales.methods[value] }));

function AddPaymentForm({ sale }: { sale: SaleWithDetails }) {
  const addPayment = useAddSalePayment();
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PaymentFormValues, unknown, PaymentInput>({
    resolver: zodResolver(paymentSchema(sale.balance_due)),
    defaultValues: { amount: String(sale.balance_due), method: 'cash' },
  });

  const submit = handleSubmit(async ({ amount, method }) => {
    setError(null);
    try {
      // The payments list and balance above update when the sale refetches.
      await addPayment.mutateAsync({ saleId: sale.id, amount, method });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <Card style={styles.form}>
      <AppText variant="subheading">{mn.sales.addPayment}</AppText>
      <FormTextField
        control={control}
        name="amount"
        label={mn.sales.amountPaid}
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
      <Message tone="error" text={error} />
      <Button title={mn.sales.savePayment} loading={isSubmitting} onPress={submit} />
    </Card>
  );
}

function CancelSaleSection({ sale }: { sale: SaleWithDetails }) {
  const cancelSale = useCancelSale();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setError(null);
    try {
      await cancelSale.mutateAsync({ saleId: sale.id, reason: reason.trim() || null });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  function confirm() {
    Alert.alert(mn.sales.cancelConfirmTitle, mn.sales.cancelConfirmText, [
      { text: mn.common.cancel, style: 'cancel' },
      { text: mn.sales.cancelSale, style: 'destructive', onPress: cancel },
    ]);
  }

  if (!open) {
    return (
      <Button
        title={mn.sales.cancelSale}
        icon="close"
        variant="danger"
        onPress={() => setOpen(true)}
      />
    );
  }

  return (
    <Card style={styles.form}>
      <AppText variant="subheading">{mn.sales.cancelSale}</AppText>
      <AppText tone="muted">{mn.sales.cancelConfirmText}</AppText>
      <TextField
        label={`${mn.sales.cancelReason} (${mn.common.optional})`}
        value={reason}
        onChangeText={setReason}
        maxLength={500}
      />
      <Message tone="error" text={error} />
      <Button
        title={mn.sales.cancelSale}
        variant="danger"
        loading={cancelSale.isPending}
        onPress={confirm}
      />
      <Button title={mn.common.cancel} variant="ghost" onPress={() => setOpen(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start', gap: spacing.xs },
  list: { paddingVertical: 4 },
  form: { gap: spacing.lg },
});
