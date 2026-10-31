import type { ComponentProps } from 'react';

import { AppText } from '@/components/ui/app-text';
import { formatMoney } from '@/domain/money';

export function MoneyText({
  amount,
  currency = 'MNT',
  ...props
}: Omit<ComponentProps<typeof AppText>, 'children'> & { amount: number; currency?: string }) {
  return <AppText {...props}>{formatMoney(amount, currency)}</AppText>;
}
