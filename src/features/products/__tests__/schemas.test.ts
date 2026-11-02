import { describe, expect, it } from '@jest/globals';

import { mn } from '@/i18n/mn';

import { productFormValues, productSchema, type ProductFormValues } from '../schemas';

const base: ProductFormValues = {
  name: 'Ус 0.5л',
  sellingPrice: '1500',
  costPrice: '',
  unit: 'pcs',
  openingStock: '',
  lowStockThreshold: '',
  sku: '',
  barcode: '',
};

function firstError(values: Partial<ProductFormValues>) {
  const result = productSchema.safeParse({ ...base, ...values });
  return result.success ? undefined : result.error.issues[0];
}

describe('productSchema', () => {
  it('parses numbers and turns empty optional fields into null', () => {
    expect(productSchema.parse({ ...base, sellingPrice: '12 500', costPrice: '9,000' })).toEqual({
      name: 'Ус 0.5л',
      sellingPrice: 12500,
      costPrice: 9000,
      unit: 'pcs',
      openingStock: null,
      lowStockThreshold: null,
      sku: null,
      barcode: null,
    });
  });

  it('requires a name and a selling price', () => {
    expect(firstError({ name: '  ' })?.message).toBe(mn.validation.required);
    expect(firstError({ sellingPrice: '' })?.message).toBe(mn.validation.required);
  });

  it('rejects negative, non-numeric and over-precise numbers', () => {
    expect(firstError({ sellingPrice: '-5' })?.message).toBe(mn.validation.invalidNumber);
    expect(firstError({ sellingPrice: 'abc' })?.message).toBe(mn.validation.invalidNumber);
    expect(firstError({ sellingPrice: '1.999' })?.message).toBe(mn.validation.invalidNumber);
    expect(firstError({ openingStock: '1.2345', unit: 'kg' })?.message).toBe(
      mn.validation.invalidNumber,
    );
  });

  it('requires whole quantities for pieces but not for kilograms', () => {
    expect(firstError({ openingStock: '1.5' })).toMatchObject({
      path: ['openingStock'],
      message: mn.validation.wholeNumber,
    });
    expect(firstError({ openingStock: '1.5', unit: 'kg' })).toBeUndefined();
  });

  it('trims SKU and barcode', () => {
    expect(productSchema.parse({ ...base, sku: ' W-05 ', barcode: ' 865 ' })).toMatchObject({
      sku: 'W-05',
      barcode: '865',
    });
  });
});

describe('productFormValues', () => {
  it('round-trips a saved product through the form', () => {
    const values = productFormValues({
      id: 'p1',
      business_id: 'b1',
      name: 'Будаа',
      sku: null,
      barcode: '8650001',
      unit: 'kg',
      image_path: null,
      cost_price: 2500,
      avg_cost: 2500,
      selling_price: 3200.5,
      current_stock: 12.5,
      low_stock_threshold: 2,
      is_active: true,
      created_at: '',
      updated_at: '',
    });
    expect(productSchema.parse(values)).toMatchObject({
      sellingPrice: 3200.5,
      costPrice: 2500,
      unit: 'kg',
      lowStockThreshold: 2,
      sku: null,
      barcode: '8650001',
    });
  });
});
