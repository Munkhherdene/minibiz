import { z } from 'zod';

import { mn } from '@/i18n/mn';

// Same limits as the numeric(14,2) and numeric(12,3) columns.
export const MONEY_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
export const QUANTITY_PATTERN = /^\d{1,9}(\.\d{1,3})?$/;

/**
 * Parses what the user typed. Spaces and thousands separators are ignored, so
 * "12 500" and "12,500" both mean 12500. Returns `null` for an empty field and
 * `undefined` when the text is not a valid non-negative number.
 */
export function parseNumberInput(value: string, pattern: RegExp): number | null | undefined {
  const normalized = value.replace(/[\s,]/g, '');
  if (!normalized) return null;
  return pattern.test(normalized) ? Number(normalized) : undefined;
}

/** Zod field for a required number typed into a text input. */
export function requiredNumber(pattern: RegExp) {
  return z.string().transform((value, ctx) => {
    const parsed = parseNumberInput(value, pattern);
    if (parsed === null || parsed === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: parsed === null ? mn.validation.required : mn.validation.invalidNumber,
      });
      return z.NEVER;
    }
    return parsed;
  });
}

/** Zod field for an optional number; an empty input means "not set" (`null`). */
export function optionalNumber(pattern: RegExp) {
  return z.string().transform((value, ctx) => {
    const parsed = parseNumberInput(value, pattern);
    if (parsed === undefined) {
      ctx.addIssue({ code: 'custom', message: mn.validation.invalidNumber });
      return z.NEVER;
    }
    return parsed;
  });
}
