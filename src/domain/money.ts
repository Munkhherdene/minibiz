// Pure money helpers. Must match the rounding used by the database
// (Postgres round() rounds half away from zero).

const CURRENCY_SYMBOLS: Record<string, string> = {
  MNT: '₮',
};

/** Rounds to 2 decimals, half away from zero, tolerating float noise (1.005 -> 1.01). */
export function roundMoney(amount: number): number {
  const sign = amount < 0 ? -1 : 1;
  const rounded = Math.round(Math.abs(amount) * 100 + 1e-7) / 100;
  return rounded === 0 ? 0 : sign * rounded;
}

export function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats an amount for display. MNT is shown as whole tugrik ("12,500₮");
 * other currencies keep 2 decimals and their code ("12.50 USD").
 * Does not depend on Intl locale data, which is incomplete for "mn" on some devices.
 */
export function formatMoney(amount: number, currency = 'MNT'): string {
  const decimals = currency === 'MNT' ? 0 : 2;
  const factor = 10 ** decimals;
  const value = Math.round(Math.abs(amount) * factor + 1e-7) / factor;
  const [whole, fraction] = value.toFixed(decimals).split('.');
  const sign = amount < 0 && value !== 0 ? '-' : '';
  const number = groupThousands(whole) + (fraction ? `.${fraction}` : '');
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${sign}${number}${symbol}` : `${sign}${number} ${currency}`;
}
