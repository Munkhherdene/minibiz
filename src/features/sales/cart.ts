import { useState } from 'react';

import { formatQuantity, requiresWholeQuantity } from '@/domain/inventory';
import { cartSubtotal } from '@/domain/sales';
import { mn } from '@/i18n/mn';
import { QUANTITY_PATTERN, parseNumberInput } from '@/lib/number-input';
import type { Product } from '@/types/models';

/** The quantity stays as typed text so the user can edit it freely ("1.", ""). */
export type CartLine = { product: Product; quantityText: string };

export function lineQuantity(line: CartLine): number {
  return parseNumberInput(line.quantityText, QUANTITY_PATTERN) ?? 0;
}

/** Why a line can't be sold as entered, or null. The database checks the same rules. */
export function lineError(line: CartLine, allowNegativeStock: boolean): string | null {
  const quantity = parseNumberInput(line.quantityText, QUANTITY_PATTERN);
  if (!quantity) return mn.validation.invalidNumber;
  if (requiresWholeQuantity(line.product.unit) && !Number.isInteger(quantity)) {
    return mn.validation.wholeNumber;
  }
  if (!allowNegativeStock && quantity > line.product.current_stock) {
    return mn.sales.notEnoughStock(formatQuantity(line.product.current_stock));
  }
  return null;
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  /** Adds one unit, or one more if the product is already in the cart. */
  function add(product: Product) {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (!existing) return [...current, { product, quantityText: '1' }];
      return current.map((line) =>
        line === existing ? { ...line, quantityText: String(lineQuantity(line) + 1) } : line,
      );
    });
  }

  function setQuantity(productId: string, quantityText: string) {
    setLines((current) =>
      current.map((line) => (line.product.id === productId ? { ...line, quantityText } : line)),
    );
  }

  function remove(productId: string) {
    setLines((current) => current.filter((line) => line.product.id !== productId));
  }

  const subtotal = cartSubtotal(
    lines.map((line) => ({ quantity: lineQuantity(line), unitPrice: line.product.selling_price })),
  );

  return {
    lines,
    subtotal,
    add,
    setQuantity,
    remove,
    quantityOf: (productId: string) => {
      const line = lines.find((l) => l.product.id === productId);
      return line ? lineQuantity(line) : 0;
    },
  };
}

export type Cart = ReturnType<typeof useCart>;
