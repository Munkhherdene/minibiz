import { z } from 'zod';

import { mn } from '@/i18n/mn';
import { MONEY_PATTERN, optionalNumber, requiredNumber } from '@/lib/number-input';
import { PAYMENT_METHODS } from '@/types/models';

const v = mn.validation;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, v.tooLong)
    .transform((value) => value || null);

/** Checkout depends on the cart subtotal, so the schema is built for it. */
export function checkoutSchema(subtotal: number) {
  return z
    .object({
      discount: optionalNumber(MONEY_PATTERN),
      method: z.enum(PAYMENT_METHODS),
      // Empty = paid in full. For cash this is the amount handed over (change is shown).
      amountPaid: optionalNumber(MONEY_PATTERN),
      customerName: optionalText(100),
      note: optionalText(500),
    })
    .superRefine((values, ctx) => {
      const discount = values.discount ?? 0;
      if (discount > subtotal) {
        ctx.addIssue({ code: 'custom', path: ['discount'], message: mn.sales.discountTooHigh });
        return;
      }
      const total = subtotal - discount;
      if (values.method !== 'cash' && values.amountPaid !== null && values.amountPaid > total) {
        ctx.addIssue({ code: 'custom', path: ['amountPaid'], message: mn.sales.paidTooHigh });
      }
    });
}

export type CheckoutFormValues = z.input<ReturnType<typeof checkoutSchema>>;
export type CheckoutInput = z.output<ReturnType<typeof checkoutSchema>>;

export function paymentSchema(balanceDue: number) {
  return z.object({
    amount: requiredNumber(MONEY_PATTERN).refine(
      (amount) => amount > 0 && amount <= balanceDue,
      mn.errors.codes.INVALID_PAYMENT,
    ),
    method: z.enum(PAYMENT_METHODS),
  });
}

export type PaymentFormValues = z.input<ReturnType<typeof paymentSchema>>;
export type PaymentInput = z.output<ReturnType<typeof paymentSchema>>;
