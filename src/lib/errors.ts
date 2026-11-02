import { formatQuantity } from '@/domain/inventory';
import { mn } from '@/i18n/mn';
import type { Unit } from '@/types/models';

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AuthRetryableFetchError' ||
    /network request failed|failed to fetch/i.test(error.message)
  );
}

/** Supabase Auth errors carry `code`; database functions raise codes as the message. */
function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code === 'string' && code in mn.errors.codes) return code;
  if (typeof message === 'string' && message in mn.errors.codes) return message;
  return undefined;
}

export function hasErrorCode(error: unknown, code: string) {
  return errorCode(error) === code;
}

/** create_sale puts the product and available quantity in `details` as JSON. */
function insufficientStockMessage(error: unknown): string | undefined {
  const { details } = error as { details?: unknown };
  if (typeof details !== 'string') return undefined;
  try {
    const { name, available, unit } = JSON.parse(details) as {
      name: string;
      available: number;
      unit: Unit;
    };
    return mn.errors.insufficientStock(
      name,
      `${formatQuantity(available)} ${mn.products.units[unit] ?? ''}`.trim(),
    );
  } catch {
    return undefined;
  }
}

/** Converts any thrown or returned error into a Mongolian message for the UI. */
export function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return mn.errors.network;
  const code = errorCode(error);
  if (code === 'INSUFFICIENT_STOCK') {
    return insufficientStockMessage(error) ?? mn.errors.codes.INSUFFICIENT_STOCK;
  }
  if (code) return mn.errors.codes[code];
  if (__DEV__) console.warn('Unmapped error', error);
  return mn.errors.generic;
}
