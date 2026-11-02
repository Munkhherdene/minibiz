export const SALE_RANGES = ['today', 'week', 'month', 'all'] as const;

export type SaleRange = (typeof SALE_RANGES)[number];

const DAYS_BACK: Record<Exclude<SaleRange, 'all'>, number> = { today: 0, week: 6, month: 29 };

/**
 * Start of the range as an ISO time, at local midnight so the value (and the query
 * key built from it) stays the same all day. `null` = no lower bound.
 */
export function rangeStart(range: SaleRange, now = new Date()): string | null {
  if (range === 'all') return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - DAYS_BACK[range]);
  return start.toISOString();
}
