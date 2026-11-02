import { describe, expect, it } from '@jest/globals';

import { mn } from '@/i18n/mn';
import type { Product } from '@/types/models';

import { lineError, lineQuantity, type CartLine } from '../cart';
import { rangeStart } from '../ranges';
import { checkoutSchema, paymentSchema } from '../schemas';

const water: Product = {
  id: 'p1',
  business_id: 'b1',
  name: 'Ус',
  sku: null,
  barcode: null,
  unit: 'pcs',
  image_path: null,
  cost_price: 900,
  avg_cost: 900,
  selling_price: 1500,
  current_stock: 5,
  low_stock_threshold: null,
  is_active: true,
  created_at: '',
  updated_at: '',
};

const line = (quantityText: string, product: Product = water): CartLine => ({
  product,
  quantityText,
});

describe('cart lines', () => {
  it('reads the typed quantity, treating invalid text as 0', () => {
    expect(lineQuantity(line('3'))).toBe(3);
    expect(lineQuantity(line(''))).toBe(0);
    expect(lineQuantity(line('abc'))).toBe(0);
  });

  it('accepts a valid line', () => {
    expect(lineError(line('5'), false)).toBeNull();
  });

  it('rejects empty, zero and fractional piece quantities', () => {
    expect(lineError(line(''), false)).toBe(mn.validation.invalidNumber);
    expect(lineError(line('0'), false)).toBe(mn.validation.invalidNumber);
    expect(lineError(line('1.5'), false)).toBe(mn.validation.wholeNumber);
    expect(lineError(line('1.5', { ...water, unit: 'kg' }), false)).toBeNull();
  });

  it('rejects more than the stock unless negative stock is allowed', () => {
    expect(lineError(line('6'), false)).toBe(mn.sales.notEnoughStock('5'));
    expect(lineError(line('6'), true)).toBeNull();
  });
});

describe('checkoutSchema', () => {
  const values = { discount: '', method: 'cash', amountPaid: '', customerName: '', note: '' };

  it('parses an empty checkout as no discount and full payment', () => {
    expect(checkoutSchema(9000).parse(values)).toEqual({
      discount: null,
      method: 'cash',
      amountPaid: null,
      customerName: null,
      note: null,
    });
  });

  it('rejects a discount above the subtotal', () => {
    const result = checkoutSchema(9000).safeParse({ ...values, discount: '9500' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['discount'],
      message: mn.sales.discountTooHigh,
    });
  });

  it('allows overpaying in cash (change) but not by transfer', () => {
    expect(checkoutSchema(9000).safeParse({ ...values, amountPaid: '10000' }).success).toBe(true);
    const transfer = checkoutSchema(9000).safeParse({
      ...values,
      method: 'bank_transfer',
      amountPaid: '10000',
    });
    expect(transfer.error?.issues[0]?.message).toBe(mn.sales.paidTooHigh);
  });
});

describe('paymentSchema', () => {
  it('accepts up to the balance due', () => {
    expect(paymentSchema(4500).parse({ amount: '4,500', method: 'cash' }).amount).toBe(4500);
    expect(paymentSchema(4500).safeParse({ amount: '4501', method: 'cash' }).success).toBe(false);
    expect(paymentSchema(4500).safeParse({ amount: '0', method: 'cash' }).success).toBe(false);
  });
});

describe('rangeStart', () => {
  const now = new Date(2026, 10, 2, 15, 30);

  it('starts at local midnight', () => {
    expect(rangeStart('today', now)).toBe(new Date(2026, 10, 2).toISOString());
    expect(rangeStart('week', now)).toBe(new Date(2026, 9, 27).toISOString());
    expect(rangeStart('month', now)).toBe(new Date(2026, 9, 4).toISOString());
  });

  it('has no lower bound for all sales', () => {
    expect(rangeStart('all', now)).toBeNull();
  });
});
