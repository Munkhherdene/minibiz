import { mn } from '@/i18n/mn';

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AuthRetryableFetchError' ||
    /network request failed|failed to fetch/i.test(error.message)
  );
}

/**
 * Converts any thrown or returned error into a Mongolian message for the UI.
 * Database error codes (e.g. INSUFFICIENT_STOCK) are mapped here as they are added.
 */
export function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return mn.errors.network;
  return mn.errors.generic;
}
