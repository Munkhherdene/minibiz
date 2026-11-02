// Pure inventory rules (docs/architecture.md, section 5.1). The database enforces
// the same rules; these give instant feedback in forms and screens.

import { groupThousands } from '@/domain/money';
import type { Product, Unit } from '@/types/models';

const WHOLE_UNITS: readonly Unit[] = ['pcs', 'box', 'pack'];

/** Rule 6: pieces, boxes and packs are counted in whole numbers. */
export function requiresWholeQuantity(unit: Unit): boolean {
  return WHOLE_UNITS.includes(unit);
}

export function isLowStock(product: Pick<Product, 'current_stock' | 'low_stock_threshold'>) {
  return product.low_stock_threshold !== null && product.current_stock <= product.low_stock_threshold;
}

/**
 * Estimated profit per unit. Uses the average cost while there is stock, otherwise
 * the cost the user entered (the average is meaningless with nothing on hand).
 */
export function unitMargin(
  product: Pick<Product, 'selling_price' | 'avg_cost' | 'cost_price' | 'current_stock'>,
): { amount: number; percent: number | null } {
  const cost = product.current_stock > 0 ? product.avg_cost : product.cost_price;
  const amount = product.selling_price - cost;
  const percent = product.selling_price > 0 ? (amount / product.selling_price) * 100 : null;
  return { amount, percent };
}

/** Up to 3 decimals without trailing zeros, with thousands separators: "1,250", "1.5". */
export function formatQuantity(value: number): string {
  const [whole, fraction] = (Math.round(Math.abs(value) * 1000) / 1000).toString().split('.');
  const sign = value < 0 && (whole !== '0' || fraction) ? '-' : '';
  return sign + groupThousands(whole) + (fraction ? `.${fraction}` : '');
}
