import { describe, expect, it } from '@jest/globals';

import { formatQuantity, isLowStock, requiresWholeQuantity, unitMargin } from '../inventory';

describe('requiresWholeQuantity', () => {
  it('requires whole numbers for counted units only', () => {
    expect(requiresWholeQuantity('pcs')).toBe(true);
    expect(requiresWholeQuantity('box')).toBe(true);
    expect(requiresWholeQuantity('pack')).toBe(true);
    expect(requiresWholeQuantity('kg')).toBe(false);
    expect(requiresWholeQuantity('l')).toBe(false);
  });
});

describe('isLowStock', () => {
  it('is low at or below the threshold', () => {
    expect(isLowStock({ current_stock: 5, low_stock_threshold: 5 })).toBe(true);
    expect(isLowStock({ current_stock: 2, low_stock_threshold: 5 })).toBe(true);
    expect(isLowStock({ current_stock: 6, low_stock_threshold: 5 })).toBe(false);
  });

  it('is never low without a threshold', () => {
    expect(isLowStock({ current_stock: 0, low_stock_threshold: null })).toBe(false);
  });
});

describe('unitMargin', () => {
  it('uses the average cost while there is stock', () => {
    expect(
      unitMargin({ selling_price: 1500, avg_cost: 900, cost_price: 1000, current_stock: 10 }),
    ).toEqual({ amount: 600, percent: 40 });
  });

  it('uses the entered cost when there is no stock', () => {
    expect(
      unitMargin({ selling_price: 2000, avg_cost: 0, cost_price: 1500, current_stock: 0 }),
    ).toEqual({ amount: 500, percent: 25 });
  });

  it('has no percentage for free products', () => {
    expect(
      unitMargin({ selling_price: 0, avg_cost: 0, cost_price: 0, current_stock: 0 }).percent,
    ).toBeNull();
  });
});

describe('formatQuantity', () => {
  it('drops trailing zeros and groups thousands', () => {
    expect(formatQuantity(24)).toBe('24');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(0.125)).toBe('0.125');
    expect(formatQuantity(12500)).toBe('12,500');
    expect(formatQuantity(-3)).toBe('-3');
  });
});
