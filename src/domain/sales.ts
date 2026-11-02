// Pure sales rules (docs/architecture.md, section 5.2) for live cart totals.
// create_sale computes the same numbers; the database result is what is saved.

import { roundMoney } from '@/domain/money';
import type { Sale } from '@/types/models';

/** Rule 1: round(quantity × unit_price, 2). */
export function lineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export function cartSubtotal(lines: { quantity: number; unitPrice: number }[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineTotal(line.quantity, line.unitPrice), 0));
}

/**
 * What gets stored as paid, and the change to hand back. For cash the customer may hand
 * over more than the total (rule 5); only up to the total is recorded. An empty amount
 * (`null`) means full payment.
 */
export function settlePayment(total: number, handedOver: number | null) {
  const given = handedOver ?? total;
  return {
    amountPaid: Math.min(given, total),
    change: roundMoney(Math.max(given - total, 0)),
    balanceDue: roundMoney(Math.max(total - given, 0)),
  };
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'cancelled';

export function paymentStatus(
  sale: Pick<Sale, 'status' | 'amount_paid' | 'balance_due'>,
): PaymentStatus {
  if (sale.status === 'cancelled') return 'cancelled';
  if (sale.balance_due <= 0) return 'paid';
  return sale.amount_paid > 0 ? 'partial' : 'unpaid';
}
