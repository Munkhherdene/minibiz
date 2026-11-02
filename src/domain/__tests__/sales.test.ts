import { describe, expect, it } from '@jest/globals';

import { cartSubtotal, lineTotal, paymentStatus, settlePayment } from '../sales';

describe('lineTotal and cartSubtotal', () => {
  it('rounds each line to 2 decimals before summing (rule 5.2.1)', () => {
    expect(lineTotal(3, 1500)).toBe(4500);
    expect(lineTotal(1.5, 3000)).toBe(4500);
    expect(lineTotal(0.333, 10)).toBe(3.33);
    expect(
      cartSubtotal([
        { quantity: 3, unitPrice: 1500 },
        { quantity: 1.5, unitPrice: 3000 },
      ]),
    ).toBe(9000);
  });

  it('is 0 for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0);
  });
});

describe('settlePayment', () => {
  it('treats an empty amount as full payment', () => {
    expect(settlePayment(8500, null)).toEqual({ amountPaid: 8500, change: 0, balanceDue: 0 });
  });

  it('records only the total and returns change when more is handed over', () => {
    expect(settlePayment(8500, 10000)).toEqual({ amountPaid: 8500, change: 1500, balanceDue: 0 });
  });

  it('leaves a balance for a partial payment', () => {
    expect(settlePayment(8500, 4000)).toEqual({ amountPaid: 4000, change: 0, balanceDue: 4500 });
  });
});

describe('paymentStatus', () => {
  it('derives the badge from status and balance', () => {
    expect(paymentStatus({ status: 'completed', amount_paid: 8500, balance_due: 0 })).toBe('paid');
    expect(paymentStatus({ status: 'completed', amount_paid: 4000, balance_due: 4500 })).toBe(
      'partial',
    );
    expect(paymentStatus({ status: 'completed', amount_paid: 0, balance_due: 8500 })).toBe('unpaid');
    expect(paymentStatus({ status: 'cancelled', amount_paid: 0, balance_due: 8500 })).toBe(
      'cancelled',
    );
  });
});
