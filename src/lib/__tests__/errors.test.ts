import { describe, expect, it } from '@jest/globals';

import { mn } from '@/i18n/mn';

import { getErrorMessage, hasErrorCode } from '../errors';

describe('getErrorMessage', () => {
  it('maps Supabase Auth error codes', () => {
    const error = Object.assign(new Error('Invalid login credentials'), {
      code: 'invalid_credentials',
    });
    expect(getErrorMessage(error)).toBe(mn.errors.codes.invalid_credentials);
    expect(hasErrorCode(error, 'invalid_credentials')).toBe(true);
  });

  it('maps database error codes raised as the message', () => {
    expect(getErrorMessage({ code: '22023', message: 'INVALID_BUSINESS_NAME' })).toBe(
      mn.errors.codes.INVALID_BUSINESS_NAME,
    );
  });

  it('names the product and the available stock for INSUFFICIENT_STOCK', () => {
    const error = {
      code: '22023',
      message: 'INSUFFICIENT_STOCK',
      details: '{"name": "Ус 0.5л", "available": 3.000, "unit": "pcs"}',
    };
    expect(getErrorMessage(error)).toBe(mn.errors.insufficientStock('Ус 0.5л', '3 ширхэг'));
    expect(getErrorMessage({ ...error, details: null })).toBe(
      mn.errors.codes.INSUFFICIENT_STOCK,
    );
  });

  it('detects network failures', () => {
    expect(getErrorMessage(new TypeError('Network request failed'))).toBe(mn.errors.network);
  });

  it('falls back to a generic message', () => {
    expect(getErrorMessage(new Error('something unexpected'))).toBe(mn.errors.generic);
    expect(getErrorMessage(undefined)).toBe(mn.errors.generic);
  });
});
