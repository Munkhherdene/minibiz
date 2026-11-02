import { formatQuantity } from '@/domain/inventory';
import { mn } from '@/i18n/mn';
import type { Unit } from '@/types/models';

/** "24 ширхэг", "1.5 кг" */
export function formatStock(quantity: number, unit: Unit): string {
  return `${formatQuantity(quantity)} ${mn.products.units[unit]}`;
}
