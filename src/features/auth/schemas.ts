import { z } from 'zod';

import { mn } from '@/i18n/mn';

const v = mn.validation;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, v.required)
  .pipe(z.email(v.invalidEmail));

export const newPasswordSchema = z.string().min(8, v.passwordMin).max(72, v.passwordMax);

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6,10}$/, v.invalidCode);

export const loginSchema = z.object({
  email: emailSchema,
  // No length rule on login: accounts may predate the current password policy.
  password: z.string().min(1, v.required),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(1, v.required).max(100, v.tooLong),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordsMismatch,
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const newPasswordFormSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordsMismatch,
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    code: otpCodeSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordsMismatch,
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordFormInput = z.infer<typeof newPasswordFormSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
