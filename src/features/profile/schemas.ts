import { z } from 'zod';

import { mn } from '@/i18n/mn';

const v = mn.validation;

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, v.required).max(100, v.tooLong),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\+?[\d\s-]{6,20}$/.test(value), v.invalidPhone),
});

export type ProfileInput = z.infer<typeof profileSchema>;
