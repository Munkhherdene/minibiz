import type { ComponentProps } from 'react';

import { Badge } from '@/components/ui';
import { paymentStatus, type PaymentStatus } from '@/domain/sales';
import { mn } from '@/i18n/mn';
import type { Sale } from '@/types/models';

const tones: Record<PaymentStatus, ComponentProps<typeof Badge>['tone']> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'danger',
  cancelled: 'neutral',
};

export function SaleStatusBadge({
  sale,
}: {
  sale: Pick<Sale, 'status' | 'amount_paid' | 'balance_due'>;
}) {
  const status = paymentStatus(sale);
  return <Badge label={mn.sales.statuses[status]} tone={tones[status]} />;
}
