import { z } from 'zod';

import { requiresWholeQuantity } from '@/domain/inventory';
import { mn } from '@/i18n/mn';
import {
  MONEY_PATTERN,
  QUANTITY_PATTERN,
  optionalNumber,
  requiredNumber,
} from '@/lib/number-input';
import { UNITS, type Product } from '@/types/models';

const v = mn.validation;

const optionalCode = z
  .string()
  .trim()
  .max(64, v.tooLong)
  .transform((value) => value || null);

/** Form fields are strings; the parsed output has numbers and nulls. */
export const productSchema = z
  .object({
    name: z.string().trim().min(1, v.required).max(100, v.tooLong),
    sellingPrice: requiredNumber(MONEY_PATTERN),
    costPrice: optionalNumber(MONEY_PATTERN),
    unit: z.enum(UNITS),
    // Only shown when creating; stock changes later only through movements.
    openingStock: optionalNumber(QUANTITY_PATTERN),
    lowStockThreshold: optionalNumber(QUANTITY_PATTERN),
    sku: optionalCode,
    barcode: optionalCode,
  })
  .superRefine((product, ctx) => {
    if (!requiresWholeQuantity(product.unit)) return;
    for (const key of ['openingStock', 'lowStockThreshold'] as const) {
      const value = product[key];
      if (value !== null && !Number.isInteger(value)) {
        ctx.addIssue({ code: 'custom', path: [key], message: v.wholeNumber });
      }
    }
  });

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductInput = z.output<typeof productSchema>;

/** Pre-fills the edit form from a saved product. */
export function productFormValues(product: Product): ProductFormValues {
  const text = (value: number | null) => (value === null ? '' : String(value));
  return {
    name: product.name,
    sellingPrice: text(product.selling_price),
    costPrice: product.cost_price ? text(product.cost_price) : '',
    unit: product.unit,
    openingStock: '',
    lowStockThreshold: text(product.low_stock_threshold),
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
  };
}
