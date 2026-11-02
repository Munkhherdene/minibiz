import { describe, expect, it } from '@jest/globals';

import { mn } from '@/i18n/mn';

import { loginSchema, resetPasswordSchema, signupSchema } from '../schemas';

describe('auth schemas', () => {
  it('normalises the email', () => {
    const result = loginSchema.parse({ email: '  Bold@Example.COM ', password: 'x' });
    expect(result.email).toBe('bold@example.com');
  });

  it('rejects an invalid email with a Mongolian message', () => {
    const result = loginSchema.safeParse({ email: 'bold', password: 'x' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(mn.validation.invalidEmail);
  });

  it('requires matching passwords of at least 8 characters on signup', () => {
    const base = { fullName: 'Болд', email: 'bold@example.com' };
    expect(
      signupSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' }).success,
    ).toBe(false);

    const mismatch = signupSchema.safeParse({
      ...base,
      password: 'password1',
      confirmPassword: 'password2',
    });
    expect(mismatch.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: mn.validation.passwordsMismatch,
    });

    expect(
      signupSchema.safeParse({ ...base, password: 'password1', confirmPassword: 'password1' })
        .success,
    ).toBe(true);
  });

  it('accepts only numeric codes of 6 to 10 digits', () => {
    const valid = { password: 'password1', confirmPassword: 'password1' };
    expect(resetPasswordSchema.safeParse({ ...valid, code: '123456' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...valid, code: '12345' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...valid, code: '12a456' }).success).toBe(false);
  });
});
