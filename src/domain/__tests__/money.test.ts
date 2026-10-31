import { formatMoney, roundMoney } from '../money';

describe('roundMoney', () => {
  it('rounds half away from zero', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.345)).toBe(2.35);
    expect(roundMoney(-2.345)).toBe(-2.35);
  });

  it('keeps already-rounded values', () => {
    expect(roundMoney(12500)).toBe(12500);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundMoney(-0.001), 0)).toBe(true);
  });
});

describe('formatMoney', () => {
  it('formats MNT as whole tugrik with thousands separators', () => {
    expect(formatMoney(0)).toBe('0₮');
    expect(formatMoney(950)).toBe('950₮');
    expect(formatMoney(12500)).toBe('12,500₮');
    expect(formatMoney(1234567.4)).toBe('1,234,567₮');
    expect(formatMoney(1999.5)).toBe('2,000₮');
  });

  it('formats negative amounts', () => {
    expect(formatMoney(-12500)).toBe('-12,500₮');
    expect(formatMoney(-0.4)).toBe('0₮');
  });

  it('keeps 2 decimals for other currencies', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('1,234.50 USD');
  });
});
